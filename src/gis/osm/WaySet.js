goog.provide('gis.osm.WaySet');
goog.require('gis.Obj');
goog.require('gis.Q');
goog.require('gis.osm.Way');
goog.require('gis.osm.WayProfile');
goog.require('gis.data.QuadTree');

//var globalDebug=0;

/** Set of ways, detects shared nodes to create topology for routing.
  * @constructor */
gis.osm.WaySet=function() {
	var tileNum;
	var wayTypeTbl;
	var typeListList;
	var typeListNum;
	var typeList;
	var typeNum,typeCount;
	var tagList;
	var tagNum,tagCount;

	/** @type {RegExp} Regular expression for parsing Hstore "key"=>"value" pairs handling \" style escaping. */
	this.hstoreGlob=/"((\\.|[^"])*)"=>"((\\.|[^"])*)"/g;

	/** @type {Array.<gis.osm.Way>} List of all ways read. */
	this.wayList=[];
	/** @type {gis.data.QuadTree} */
	this.wayTree=new gis.data.QuadTree(0,0,gis.MU.range,gis.MU.range,
		gis.data.QuadTree.Dup.ALLOW,gis.data.QuadTree.Placement.TOPBRANCH);
	/** @type {Array.<Object.<number,number|gis.osm.Node>>} Array of hash tables for finding nodes by exact coordinates. */
	this.nodeTbl=[];
	/** @type {Array.<number>} List of total number of points read at the beginning of each way. */
	this.ptTotalList=[];
	/** @type {number} Total number of points read. */
	this.ptTotal=0;

	// Create several hash tables for coordinate pairs. <hashPrefixBits> highest bits of each coordinate
	// determine which table to use, the rest form a hash for indexing the hash table. This allows creating
	// numeric indices (JavaScript numbers are 52 bits) from pairs of 30-bit numbers for speed.
	for(tileNum=0;tileNum<(1<<(gis.osm.WaySet.hashPrefixBits*2));tileNum++) this.nodeTbl[tileNum]={};

	wayTypeTbl={};

	typeListList=[gis.osm.WaySet.railwayTypeList,gis.osm.WaySet.transitwayTypeList,gis.osm.WaySet.highwayTypeList];
	for(typeListNum=0;typeListNum<typeListList.length;typeListNum++) {
		typeList=typeListList[typeListNum];
		typeCount=typeList.length;
		for(typeNum=0;typeNum<typeCount;typeNum+=2) {
			tagList=typeList[typeNum+1].split(' ');
			tagCount=tagList.length;
			for(tagNum=0;tagNum<tagCount;tagNum++) {
				wayTypeTbl[tagList[tagNum]]=typeList[typeNum];
			}
		}
	}

	this.wayTypeTbl=wayTypeTbl;

	/** @type {Object.<string,gis.osm.WayProfile>} */
	this.profileTbl={};
	/** @type {Array.<gis.osm.WayProfile>} */
	this.profileList=[];
	/** @type {number} */
	this.profileCount=0;

	/** @type {Array.<string>} */
	this.nameList;

	this.hstoreKeyTbl={
		'lanes':1,
		'level':1,
		'lit':1
	};
};

/** @type {number} Number of most significant bits in coordinates to use for selecting a hash table
  * instead of forming a hash key. */
gis.osm.WaySet.hashPrefixBits=5;
gis.osm.WaySet.hashKeyBits=gis.MU.bits-gis.osm.WaySet.hashPrefixBits;
/** @type {number} Mask to extract bits from a coordinate that belong into a hash key. */
gis.osm.WaySet.hashKeyMask=(1<<gis.osm.WaySet.hashKeyBits)-1;

// TODO: check SQL table structure and get missing columns from HSTORE.
/** @type {Array.<string>} */
gis.osm.WaySet.schemeFieldList=(
	'osm_id access bicycle bridge foot highway layer motorcar name oneway public_transport railway route'
).split(' ');

/** @type {Object.<string,*>} */
gis.osm.WaySet.defaultAccess;

/** @type {Array.<gis.osm.Way.Type|string>} */
gis.osm.WaySet.highwayTypeList;

/** @type {Array.<string>} */
gis.osm.WaySet.railwayTypeList;

/** @type {Array.<string>} */
gis.osm.WaySet.transitwayTypeList;

(function() {
	var t=gis.osm.WayProfile.Type;
	var accessList;
	var accessNum,accessCount;
	var defaultAccess;

	// Modes for transport allowed by default for each way type.
	// c=car, b=bike, f=foot, w=wheelchair.
	accessList=[
		t.HIGHWAY, 'c',
		t.FASTCARS,'c',
		t.SLOWCARS,'cb',
		t.PARKING ,'cb',
		t.HOMEZONE,'cbfw',
		t.CARPATH, 'cbf',
		t.CYCLEWAY, 'b',
		t.FOOTWAY,   'fw',
		t.PATH,     'bf',
		t.STAIRS,    'f',
		t.TRANSIT, ''
	];

	defaultAccess=[];

	accessCount=accessList.length;
	for(accessNum=0;accessNum<accessCount;accessNum+=2) {
		defaultAccess[accessList[accessNum]]={};
	}

	gis.osm.WaySet.defaultAccess=defaultAccess;

	gis.osm.WaySet.highwayTypeList=[
		t.HIGHWAY, 'motorway motorway_link',
		t.HIGHWAY, 'trunk trunk_link',
		t.FASTCARS,'primary primary_link',
		t.FASTCARS,'secondary secondary_link',
		t.SLOWCARS,'tertiary tertiary_link',
		t.TRANSIT, 'bus_guideway',
		t.SLOWCARS,'residential unclassified',
		t.SLOWCARS,'service access road',
		t.CARPATH, 'track',
		t.HOMEZONE,'living_street pedestrian',
		t.CYCLEWAY,'cycleway',
		t.FOOTWAY, 'crossing',
		t.FOOTWAY, 'footway bus_stop platform',
		t.PATH,    'path bridleway',
		t.STAIRS,  'escalator steps',
		t.PARKING, 'services'
	];

	gis.osm.WaySet.railwayTypeList=[
		t.TRANSIT, 'rail light_rail narrow_gauge',
		t.TRANSIT, 'subway',
		t.TRANSIT, 'tram miniature',
		t.TRANSIT, 'disused preserved',
		t.AIR,     'funicular monorail',
		t.FOOTWAY, 'platform'
	];

	gis.osm.WaySet.transitwayTypeList=[
		t.FOOTWAY, 'platform'
	];
})();

/** @param {number} edgeS
  * @param {number} edgeW
  * @param {number} edgeN
  * @param {number} edgeE */
gis.osm.WaySet.prototype.importPgSQL=function(edgeS,edgeW,edgeN,edgeE,done) {
	var acceptHighwayList;
	var self=this;
	var srid;
	var sql;

	function extractKeys(typeList) {
		var typeNum,typeCount;
		var txt;

		txt='';
		typeCount=typeList.length;
		for(typeNum=1;typeNum<typeCount;typeNum+=2) {
			txt+=(txt?',':'')+'\''+typeList[typeNum].replace(/ /g,'\',\'')+'\'';
		}

		return(txt);
	}

	srid=4326;
	sql=(
		'SELECT '+
			gis.osm.WaySet.schemeFieldList.join(',')+',tags,ST_AsBinary(way,\'NDR\') AS geom'+
		' FROM planet_osm_line'+
		' WHERE way && ST_MakeEnvelope('+[edgeW,edgeS,edgeE,edgeN,srid].join(',')+')'+
		' AND ('+
			'highway IN ('+extractKeys(gis.osm.WaySet.highwayTypeList)+')'+
			' OR railway IN ('+extractKeys(gis.osm.WaySet.railwayTypeList)+')'+
			' OR public_transport IN ('+extractKeys(gis.osm.WaySet.transitwayTypeList)+')'
		+');'
//		+') AND osm_id=18378805;'
	);

	console.log(sql);
	var query=db.query(sql);

	query.on('row',
		/** @param {Object.<string,*>} row */
		function(row) {
/*
globalDebug++;
if(globalDebug%10000==0) {
var memUsed=0;
if(typeof(window)!='undefined' && window.performance && window.performance.memory) memUsed=window.performance.memory.usedJSHeapSize;
if(typeof(process)!='undefined' && process.memoryUsage) memUsed=process.memoryUsage()['heapUsed'];
console.log('Heap now '+~~(memUsed/1024/1024+0.5)+' megs.');
}
*/
			self.importRow(row);
		}
	);

	query.on('end',function() {
		db.end();
done();
/*
var memUsed=0;
if(typeof(window)!='undefined' && window.performance && window.performance.memory) memUsed=window.performance.memory.usedJSHeapSize;
if(typeof(process)!='undefined' && process.memoryUsage) memUsed=process.memoryUsage()['heapUsed'];
console.log('Heap now '+~~(memUsed/1024/1024+0.5)+' megs.');

if(typeof(window)!='undefined' && window.gc) window.gc();
else if(typeof(global)!='undefined' && global.gc) global.gc();

var memUsed=0;
if(typeof(window)!='undefined' && window.performance && window.performance.memory) memUsed=window.performance.memory.usedJSHeapSize;
if(typeof(process)!='undefined' && process.memoryUsage) memUsed=process.memoryUsage()['heapUsed'];
console.log('Heap now '+~~(memUsed/1024/1024+0.5)+' megs.');
*/
	});
};

/** @param {gis.osm.Way} way
  * @param {number} ptNum
  * @param {number} lat
  * @param {number} lon
  * @param {boolean|number} forceNode */
gis.osm.WaySet.prototype.insertNode=function(way,ptNum,lat,lon,forceNode) {
	var mask;
	var key1,key2;
	var node;
	var ptTotalList;
	var mid,first,last;
	var oldWay;
	var wayPos;

	this.ptTotal++;
	mask=gis.osm.WaySet.hashKeyMask;

	key1=((lat>>(gis.osm.WaySet.hashKeyBits-gis.osm.WaySet.hashPrefixBits))&~((1<<gis.osm.WaySet.hashPrefixBits)-1))+
		(lon>>gis.osm.WaySet.hashKeyBits);
	key2=(lat&mask)+(lon&mask);
	key2=key2*(key2+1)/2+(lon&mask);
	// Check if a node already exists at this point's coordinates.
	node=this.nodeTbl[key1][key2];

	if(!node) {
		if(forceNode) {
			node=new gis.osm.Node(new gis.MU(lat,lon));
			this.nodeTbl[key1][key2]=node;

			node.addWay(way,ptNum);
			way.ptList[ptNum]=node;
			return(node);
		} else {
			// If no node exists yet, this may not be an intersection so don't create a node object yet,
			// just store total number of points so far so the way and index of point along it can be
			// retrieved by binary search if a node is created later.
			this.nodeTbl[key1][key2]=this.ptTotal;

			lat-=way.bb.x1;
			lon-=way.bb.y1;
			way.ptList[ptNum]=lat*(1<<gis.osm.WaySet.hashKeyBits)+lon;
			return(lat*(1<<gis.osm.WaySet.hashKeyBits)+lon);
		}
	}

	if(typeof(node)=='number') {
		ptTotalList=this.ptTotalList;

		// Binary search to find the way containing the existing coordinates.
		mid=0;
		first=0;
		last=ptTotalList.length-1;
		while(first<=last) {
			mid=(first+last)>>1;
			if(ptTotalList[mid]<node) first=mid+1;
			else if(ptTotalList[mid]>node) last=mid-1;
			else break;
		}

		if(ptTotalList[mid]>node) mid--;
		oldWay=this.wayList[mid];
//		if(oldWay==way) {
			// The current way has a loop here. Add nodes read so far to connect this node to an existing one.
//			way.reshape(ptList);
//		}
		wayPos=node-ptTotalList[mid];

		if(typeof(oldWay.ptList[wayPos])!='number') console.log('ERROR');

		lat=oldWay.bb.x1+~~(oldWay.ptList[wayPos]/ (1<<gis.osm.WaySet.hashKeyBits)  );
		lon=oldWay.bb.y1+  (oldWay.ptList[wayPos]&((1<<gis.osm.WaySet.hashKeyBits)-1));

		node=new gis.osm.Node(new gis.MU(lat,lon));
		this.nodeTbl[key1][key2]=node;

		node.addWay(oldWay,wayPos);
		oldWay.ptList[wayPos]=node;
	}

	node.addWay(way,ptNum);
	way.ptList[ptNum]=node;
	return(node);
};

/** @param {number} ptCount
  * @return {gis.osm.Way} */
gis.osm.WaySet.prototype.insertWay=function(ptCount) {
	var way;

	way=new gis.osm.Way();
	way.ptList=[];
	way.ptList.length=ptCount;

	this.wayList.push(way);
	this.ptTotalList.push(this.ptTotal+1);

	return(way);
};

/** @param {Array.<gis.MU>} coordList
  * @return {gis.osm.Way} */
gis.osm.WaySet.prototype.insertCoordList=function(coordList) {
	var ptNum,ptCount;
	var way;
	var bb;
	var forceNodes;
	var ll;
	var lat,lon;

	ptCount=coordList.length;
	way=this.insertWay(ptCount);

	bb=way.makeBB(coordList);
	// Make nodes for all input points if a bounding box dimension needs more bits than hashKeyBits.
	forceNodes=bb.x2-bb.x1>(1<<gis.osm.WaySet.hashKeyBits) || bb.y2-bb.y1>(1<<gis.osm.WaySet.hashKeyBits);

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		ll=coordList[ptNum];
		lat=ll.llat;
		lon=ll.llon;

		this.insertNode(way,ptNum,lat,lon,forceNodes);
	}

	this.wayTree.insert(way);
	return(way);
};

/** @param {Object.<string,*>} row */
gis.osm.WaySet.prototype.importRow=function(row) {
	var txt;
	var glob;
	var match;
	var hstore;

	var geom;
	var geomPos;
	var type;

	var ptNum,ptCount;
	var coordList;
	var lat,lon;
	var name;
	var way;

	var profile,oldProfile;
	var key;
	var n;

	hstore={};
	txt=/** @type {string} */ (row['tags']);
	// Parse HSTORE keys and values to get tags not mentioned in database schema.
	glob=this.hstoreGlob;
	while(match=glob.exec(txt)) {
		if(this.hstoreKeyTbl[match[1]]) hstore[match[1]]=match[3];
	}

	geom=/** @type {NodeBuffer} */ (row['geom']);
	geomPos=0;

	// Read endianness flag.
	if(geom.readUInt8(geomPos)!=1) console.log('Big endian not supported!');
	geomPos++;

	// Read geometry type number.
	type=geom.readUInt32LE(geomPos);geomPos+=4;
	if(type<1 || type>3) console.log('Only point, linestring and polygon type geometries supported!');

	// Read number of points and initialize list of coordinates.
	ptCount=geom.readUInt32LE(geomPos);geomPos+=4;
	coordList=/** @type {Array.<gis.MU>} */ ([]);
	coordList.length=ptCount;

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		lon=geom.readDoubleLE(geomPos);geomPos+=8;
		lat=geom.readDoubleLE(geomPos);geomPos+=8;

		// Project coordinates to map units.
		coordList[ptNum]=new gis.Deg(lat,lon).toMU();
	}

	name=row['name'];
	if(!name) name='';
	// Replace whitespace of any length with a single space.
	name=name.replace(/\s+/g,' ');

	wayType=null;
	if(row['railway']) wayType=this.wayTypeTbl[row['railway']];
	if(!wayType && row['public_transport']) wayType=this.wayTypeTbl[row['public_transport']];
	if(!wayType && row['highway']) wayType=this.wayTypeTbl[row['highway']];
	if(!wayType) return(null);

	/** @param {string} key
	  * @return {string} */
	function getVal(key) {
		var val;

		if(typeof(row[key])=='string') val=row[key];
		else if(typeof(hstore[key])=='string') val=hstore[key];
		else return(null);

		// Replace whitespace of any length with a single space.
		return(val.replace(/\s+/g,' '));
	}

	/** @param {string} key
	  * @return {number} */
	function getNum(key) {
		var txt;
		txt=getVal(key);
		if(txt===null || !txt.match(/^-?[0-9]+(\.[0-9]+)?$/)) return(null);

		// Convert string to number.
		return(+txt);
	}

	profile=new gis.osm.WayProfile();

	profile.type=wayType;

	profile.lanes=getNum('lanes');
	profile.layer=getNum('layer');
	profile.tunnel=getVal('tunnel');
	profile.bridge=getVal('bridge');

	profile.access=getVal('access');
	profile.car=getVal('car');
	profile.bike=getVal('bike');
	profile.foot=getVal('foot');
	profile.oneway=getVal('oneway');

	profile.lit=getVal('lit');

	n=getNum('level');if(typeof(n)=='number' && typeof(profile.layer)!='number') profile.layer=n;

	key=profile.getKey();
	oldProfile=this.profileTbl[key];
	if(!oldProfile) {
		profile.num=this.profileCount;
		this.profileTbl[key]=profile;
		this.profileList[this.profileCount++]=profile;
	} else profile=oldProfile;

	way=this.insertCoordList(coordList);
	way.profile=profile;
	way.name=name;

	return(way);
};

/** @param {gis.io.PackStream} stream
  * @param {gis.io.PackStream} nameStream */
gis.osm.WaySet.prototype.exportPack=function(stream,nameStream) {
	var wayList;
	var wayNum,wayCount;
	var way;
	var profileList;
	var profileNum,profileCount;
	var profile;
	var nameList;
	var nameNum,nameCount;
	var nameTbl;
	var ptList;
	var ptNum,ptCount;
	var boundS,boundW;
//	var forceNode;
	var lat,prevLat;
	var lon,prevLon;
	var item,pair,header;

	wayList=this.wayList;
	wayCount=wayList.length;
	console.log('Writing '+wayCount+' ways.');

	profileList=this.profileList;
	profileCount=this.profileCount;
	nameStream.writeText(profileCount+'\n');

	for(profileNum=0;profileNum<profileCount;profileNum++) {
		profile=profileList[profileNum];
		nameStream.writeText(profile.export()+'\n');
	}

	nameList=[];
	nameCount=0;
	nameTbl={'':0};

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.name && !nameTbl[way.name]) {
			nameTbl[way.name]=1;
			nameList[nameCount++]=way.name;
		}
	}

	nameList.sort();
	nameStream.writeText(nameCount+'\n');

	for(nameNum=0;nameNum<nameCount;nameNum++) {
		nameTbl[nameList[nameNum]]=nameNum+1;
		nameStream.writeText(nameList[nameNum]+'\n');
	}

	pair=[];
	header=[];

	boundS=0;
	boundW=0;

	item=[wayCount];
	stream.writeLong(item);

	// TODO: rearrange profileList according to frequency and update num for each profile.

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		ptList=way.ptList;
		ptCount=ptList.length;

		header[0]=ptCount;
		header[1]=gis.Q.fromSigned(way.bb.x1-boundS);
		header[2]=gis.Q.fromSigned(way.bb.y1-boundW);
		header[3]=way.profile.num;
		header[4]=nameTbl[way.name];
		if(wayNum==0) stream.writeLong([header.length]);
		stream.writeLong(header);

		boundS=way.bb.x1;
		boundW=way.bb.y1;
		prevLat=boundS;
		prevLon=boundW;

		way.forPoints(function(lat,lon,node) {
			var forceNode;

			forceNode=node?1:0;

			pair[0]=gis.Q.fromSigned(lat-prevLat)*2+forceNode;
			pair[1]=gis.Q.fromSigned(lon-prevLon);
			stream.writeLong(pair);

			prevLat=lat;
			prevLon=lon;
		});

/*
		for(ptNum=0;ptNum<ptCount;ptNum++) {
			if(typeof(ptList[ptNum])=='number') {
				lat=boundS+~~(ptList[ptNum]/ (1<<gis.osm.WaySet.hashKeyBits)  );
				lon=boundW+  (ptList[ptNum]&((1<<gis.osm.WaySet.hashKeyBits)-1));
				forceNode=0;
			} else {
				lat=ptList[ptNum].ll.llat;
				lon=ptList[ptNum].ll.llon;
				forceNode=1;
			}

			pair[0]=gis.Q.fromSigned(lat-prevLat)*2+forceNode;
			pair[1]=gis.Q.fromSigned(lon-prevLon);

			stream.writeLong(pair);
			prevLat=lat;
			prevLon=lon;
		}
*/
	}
};

/** @param {gis.io.LineStream} stream */
gis.osm.WaySet.prototype.importNamePack=function(stream) {
	var txt;
	var profileNum,profileCount;
	var nameNum,nameCount;

	txt=stream.readLine();
	profileCount=+txt;
	this.profileCount=profileCount;
	for(profileNum=0;profileNum<profileCount;profileNum++) {
		txt=stream.readLine();
		profile=new gis.osm.WayProfile();
		profile.import(txt);
		profile.num=profileNum;
		this.profileList[profileNum]=profile;
	}

	txt=stream.readLine();
	this.nameList=[''];
	nameCount=+txt;
	for(nameNum=0;nameNum<nameCount;nameNum++) {
		txt=stream.readLine();
		this.nameList[nameNum+1]=txt;
	}
};

/** @param {gis.io.PackStream} stream */
gis.osm.WaySet.prototype.importPack=function(stream) {
	var dec;
	var wayList;
	var wayNum,wayCount;
	var way;
	var headerLen;
	var ptNum,ptCount;
	var boundS,boundW;
	var boundN,boundE;
	var lat,lon;
	var forceNode;

	dec=[];
	dec=stream.readLong(1,dec);
	wayCount=dec[0];

	wayList=[];
	wayList.length=wayCount;

	boundS=0;
	boundW=0;
	dec=stream.readLong(1,dec);
	headerLen=dec[0];

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		dec=stream.readLong(headerLen,dec);
		ptCount=dec[0];
		boundS+=gis.Q.toSigned(dec[1]);
		boundW+=gis.Q.toSigned(dec[2]);
		boundN=boundS;
		boundE=boundW;
		lat=boundS;
		lon=boundW;

		way=this.insertWay(ptCount);
		way.bb=new gis.geom.BB(lat,lon,lat,lon);
		way.profile=this.profileList[dec[3]];
//if(!way.profile) console.log(this.profileList);
		way.name=this.nameList[dec[4]];

		for(ptNum=0;ptNum<ptCount;ptNum++) {
			stream.readLong(2,dec);
			forceNode=dec[0]&1;
			lat+=gis.Q.toSigned(dec[0]>>1);
			lon+=gis.Q.toSigned(dec[1]);

			if(lat>boundN) boundN=lat;
			if(lon>boundE) boundE=lon;

			this.insertNode(way,ptNum,lat,lon,forceNode);
		}

		way.bb.x2=boundN;
		way.bb.y2=boundE;
	}

	console.log(this.ptTotal+' points.');
	console.log(wayCount+' ways.');
};

/** @param {gis.io.PackStream} stream
  * @param {gis.geom.BB} area */
gis.osm.WaySet.prototype.exportKml=function(stream,area) {
	var wayList;
	var wayNum,wayCount;
	var way;
	var bb;

	wayList=this.wayList;
	wayCount=wayList.length;

	txt='<?xml version="1.0" encoding="utf-8" ?>\n'+
		'<kml xmlns="http://www.opengis.net/kml/2.2">\n'+
		'<Document>\n';
	stream.writeText(txt);

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		bb=way.bb;

		// Check if way's bounding box is outside area to save.
		if(bb.x2<area.x1 || bb.x1 > area.x2 || bb.y2<area.y1 || bb.y1>area.y2) continue;

        txt='<Placemark>\n'+
			'<name>'+(way.name||'')+'</name>\n'+
			'<description><table>'+
			'<tr><td>Type</td><td>'+way.profile.type+'</td></tr>'+
			'</table></description>'+
//			'<styleUrl>'+style+'</styleUrl>\n'+
			'<LineString>\n'+
			'<coordinates>\n';
		stream.writeText(txt);

		txt='';
		way.forPoints(function(lat,lon,node) {
			var deg;

			if(node) deg=node.ll.toDeg();
			else deg=new gis.MU(lat,lon).toDeg();
			txt+=deg.llon+','+deg.llat+',0\n';
        });
		stream.writeText(txt);

        txt='</coordinates>\n'+
			'</LineString>\n'+
			'</Placemark>\n';
		stream.writeText(txt);
	}

	txt='</Document>\n'+
		'</kml>\n';
	stream.writeText(txt);
};

/** @param {gis.geom.BB} area */
gis.osm.WaySet.prototype.findArea=function(area) {
	var wayList;
	var wayNum,wayCount;
	var way;
	var bb;
	var geomList;

	geomList=[];
	wayList=this.wayList;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		bb=way.bb;

		// Check if way's bounding box is outside area to save.
		if(bb.x2<area.x1 || bb.x1 > area.x2 || bb.y2<area.y1 || bb.y1>area.y2) continue;

		geomList.push(way);
	}

	return(geomList);
};

// Tags: lit name:fi lanes maxspeed cycleway segregated
