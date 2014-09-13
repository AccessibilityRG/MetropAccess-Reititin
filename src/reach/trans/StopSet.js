goog.provide('reach.trans.StopSet');
goog.require('reach.trans.Stop');
goog.require('reach.data.Codec');
goog.require('reach.data.QuadTree');
goog.require('reach.io.SQL');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.StopSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<reach.trans.Stop>} */
	this.list=[];
	/** @type {Object.<number,reach.trans.Stop>} */
	this.tbl={};
	/** @type {reach.data.QuadTree} */
	this.tree;
};

/** @param {reach.io.SQL} db */
/*
reach.trans.StopSet.prototype.importKalkati=function(db) {
	var result;
	var row;
	var stopId;
	var origId;
	var name;
	var lat,lon;
	var ll;
	var stop;

	this.list=[];
	this.tbl={};

	result=db.query('SELECT statid,name,lat,lon FROM station ORDER BY statid;');
	stopId=0;

	while(row=result.getRow()) {
		origId=+row['statid'];
*/
//		name=/** @type {string} */ row['name'];
/*
		lat=row['lat']/1000000;
		lon=row['lon']/1000000;
		ll=new reach.Deg(lat,lon).toMU();

		stop=new reach.trans.Stop(stopId,''+origId,name,ll);
		this.list.push(stop);
		this.tbl[origId]=stop;

		stopId++;
	}
};
*/

/** @param {function(string)} write */
/*
reach.trans.StopSet.prototype.exportPack=function(write) {
	var codec=new reach.data.Codec();
	var ll,lat,lon;
	var prevId,prevLat,prevLon,prevNameId;
	var i,stopCount;
	var stop;
	var data;
	var name,nameId,nameLen,nameCount,nameList,nameTbl;
	var compressed;

	stopCount=this.list.length;
	data=[];

	nameLen=0;
	nameCount=0;
	nameList=[];
*/
//	nameTbl=/** @type {Object.<string,number>} */ {};
/*

	for(i=0;i<stopCount;i++) {
		stop=this.list[i];
		name=stop.name;
		if(name.length>nameLen) nameLen=name.length;
		nameId=nameTbl[name];
		if(!nameId) {
			nameId=nameCount++;
			nameTbl[name]=nameId;
			data.push(name+'\n');
		}
		stop.nameId=nameId;
	}

	compressed=codec.compressBytes(data.join(''),nameLen,10000);
	write(codec.encodeLong([this.city.firstDate.jd,this.city.dayCount,compressed.length]));
	write(compressed);

	data=[];

	prevId=0;
	prevLat=0;
	prevLon=0;
	prevNameId=0;

	for(i=0;i<stopCount;i++) {
		stop=this.list[i];
		ll=stop.ll.toDeg();
		lat=reach.util.round(ll.llat*100000,1);
		lon=reach.util.round(ll.llon*100000,1);
		nameId=stop.nameId;

		data.push(codec.encodeShort([
			reach.util.fromSigned(stop.origId-prevId),
			reach.util.fromSigned(stop.nameId-prevNameId),
			reach.util.fromSigned(lat-prevLat),
			reach.util.fromSigned(lon-prevLon)
		]));

		prevId=stop.origId;
		prevNameId=nameId;
		prevLat=lat;
		prevLon=lon;
	}

	write(codec.encodeLong([stopCount])+data.join('')+'\n');
};
*/

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.trans.StopSet.prototype.importPack=function(stream) {
	/** @type {reach.trans.StopSet} */
	var self=this;
	/** @type {number} */
	var origId;
	var ll;
	/** @type {number} */
	var lat;
	/** @type {number} */
	var lon;
	/** @type {number} */
	var nameId;
	/** @type {number} */
	var stopNum;
	var stopCount;
	var nameList;
	var step;

	var advance=function() {
		var dec;
		var data;
		var stop;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				self.list=[];
				self.tbl={};
				return(1);

			// Read list of stop names.
			case 1:
				step++;

				dec=stream.readLong(3);
				self.city.firstDate=new reach.core.Date(dec[0]);
				self.city.dayCount=dec[1];

				data=stream.readPack(dec[2],10000);
				nameList=data.split('\n');
				return(1);

			// Initialize loop to read stop data.
			case 2:
				step++;

				origId=0;
				lat=0;
				lon=0;
				nameId=0;

				stopCount=stream.readLong(1)[0];
				stopNum=0;
				return(stopCount);

			// Iterate to read stop data.
			case 3:
				dec=stream.readShort(4);
				origId+=reach.util.toSigned(dec[0]);
				nameId+=reach.util.toSigned(dec[1]);
				lat+=reach.util.toSigned(dec[2]);
				lon+=reach.util.toSigned(dec[3]);

				ll=new reach.Deg(lat/100000,lon/100000).toMU();
				stop=new reach.trans.Stop(stopNum,''+origId,nameList[nameId],ll);
//				console.log(stop.id+' '+stop.origId+' '+stop.ll.llat+' '+stop.ll.llon+' '+stop.name);

				self.list[stopNum++]=stop;
				self.tbl[origId]=stop;

				return(stopCount-stopNum);
		}
	};

	step=0;
	return(advance);
};

reach.trans.StopSet.prototype.cleanUp=function() {
	var stopNum,stopCount;
	var stop;

//	delete(this.tbl);
//	Following commented out because table is needed for node connection tweaks and doesn't really use a lot of mem.
//	if(this.tbl) this.tbl=null;

	stopCount=this.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.list[stopNum];

		// Used in LineSet.importPack
//		delete(stop.followerList);
		if(stop.followerList) stop.followerList=null;

//		delete(stop.followerTbl);
//		delete(stop.durationsTo);
//		delete(stop.statsTo);
		if(stop.followerTbl) stop.followerTbl=null;
		if(stop.durationsTo) stop.durationsTo=null;
		if(stop.statsTo) stop.statsTo=null;

		// Used in StopSet.exportPack
//		delete(stop.nameId);

		// Used in LineSet.exportPack
//		delete(stop.packFollowers);
//		delete(stop.packTbl);
		if(stop.packFollowers) stop.packFollowers=null;
		if(stop.packTbl) stop.packTbl=null;
	}
};

/** @return {reach.data.QuadTree} */
reach.trans.StopSet.prototype.makeTree=function() {
	var lat,lon,lat0,lon0,lat1,lon1;
	var stopNum,stopCount;
	var stop;
	var tree;

	stopCount=this.list.length;
	if(stopCount==0) return(null);

	// Compute bounding box containing all stops.
	stop=this.list[0];
	lat0=stop.ll.llat;
	lon0=stop.ll.llon;
	lat1=lat0;
	lon1=lon0;

	for(stopNum=1;stopNum<stopCount;stopNum++) {
		stop=this.list[stopNum];
		lat=stop.ll.llat;
		lon=stop.ll.llon;

		if(lat<lat0) lat0=lat;
		if(lat>lat1) lat1=lat;
		if(lon<lon0) lon0=lon;
		if(lon>lon1) lon1=lon;
	}

	// Create quadtree for computed bounding box.
	tree=new reach.data.QuadTree(lat0,lon0,lat1,lon1,reach.data.QuadTree.Dup.ALLOWDUP);
	this.tree=tree;

	// Insert all stops in tree.
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.list[stopNum];
		tree.insert(stop);
	}

	return(tree);
};

/*
<Trnsmode TrnsmodeId='22' Name='Helsingin aamuy&#246;nlinjat'/>
<Trnsmode TrnsmodeId='23' Name='Espoon palvelulinjat'/>
<Trnsmode TrnsmodeId='36' Name='Kirkkonummen sis&#228;inen'/>
<Trnsmode TrnsmodeId='24' Name='Vantaan palvelulinjat'/>
<Trnsmode TrnsmodeId='25' Name='Aamuy&#246;n seutulinjat'/>
<Trnsmode TrnsmodeId='39' Name='Keravan sis&#228;inen'/>
<Trnsmode TrnsmodeId='12' Name='VR:n l&#228;hiliikenne'/>
<Trnsmode TrnsmodeId='38' Name='Sipoon sis&#228;iset linjat'/>
<Trnsmode TrnsmodeId='3' Name='Espoon sis&#228;inen'/>
<Trnsmode TrnsmodeId='21' Name='Helsingin palvelulinjat'/>
<Trnsmode TrnsmodeId='2' Name='Hki/raitiovaunu'/>
<Trnsmode TrnsmodeId='1' Name='Hki/linja-auto'/>
<Trnsmode TrnsmodeId='7' Name='Vesiliikenne'/>
<Trnsmode TrnsmodeId='6' Name='Metroliikenne'/>
<Trnsmode TrnsmodeId='5' Name='Seutuliikenne'/>
<Trnsmode TrnsmodeId='4' Name='Vantaan sis&#228;inen'/>
<Trnsmode TrnsmodeId='8' Name='U-liikenne'/>
*/

// Mark what modes of transport are departing from each stop.
reach.trans.StopSet.prototype.calcModes=function() {
	var stopNum,stopCount;
	var stop;
	var lineNum,lineCount;
	var line;
	var modeTbl;

	modeTbl=/** @type {Object.<number,reach.trans.Trip.Mode>} */ {
		1:reach.trans.Trip.Mode.BUS,
		2:reach.trans.Trip.Mode.TRAM,
		3:reach.trans.Trip.Mode.BUS,
		4:reach.trans.Trip.Mode.BUS,
		5:reach.trans.Trip.Mode.BUS,
		6:reach.trans.Trip.Mode.SUBWAY,
		7:reach.trans.Trip.Mode.BOAT,
		8:reach.trans.Trip.Mode.BUS,

		12:reach.trans.Trip.Mode.TRAIN,
		21:reach.trans.Trip.Mode.BUS,
		22:reach.trans.Trip.Mode.BUS,
		23:reach.trans.Trip.Mode.BUS,
		24:reach.trans.Trip.Mode.BUS,
		25:reach.trans.Trip.Mode.BUS,
		36:reach.trans.Trip.Mode.BUS,
		38:reach.trans.Trip.Mode.BUS,
		39:reach.trans.Trip.Mode.BUS
	};

	stopCount=this.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.list[stopNum];
		stop.transModeTbl=/** @type {Object.<reach.trans.Trip.Mode,boolean>} */ {};

		lineCount=stop.lineList.length;
		for(lineNum=0;lineNum<lineCount;lineNum++) {
			line=stop.lineList[lineNum];

			for(var mode in line.transModeTbl) {
				stop.transModeTbl[modeTbl[+mode]]=true;
			}
		}
	}
};
