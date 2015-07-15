goog.provide('main');
goog.require('reach.util');
goog.require('reach.io.SQL');
goog.require('reach.trans.City');
goog.require('reach.road.TileTree');
goog.require('reach.route.Conf');
goog.require('reach.route.WayVisitor');
goog.require('reach.route.Dijkstra');
//goog.require('reach.Debugger');

var city;
var routeDebug=false;
//var tilesLoaded=0;
//var maxTiles=1<<30;
//var maxTiles=10;

function compute() {
	var dbg,ctx;
	/** @type {reach.io.SQL} */
	var db;
	var data;
	var advance;
	var tree;
	var tile;
	var base;
	var fd;

	db=null;
	/** @param {string} path
	  * @return {Array.<{id:string,data:string}>} */
	function loadTileData(path) {
		var result;
		var row;
		var data;

		data=[];
		result=db.query('SELECT wayid,data FROM tileway,tile WHERE tileway.tileid=tile.tileid AND tile.path="'+path+'";');

		while(row=result.getRow()) {
			data.push({id:row['wayid'],data:row['data']});
		}

		return(data);
	}

	/** @param {string} id
	  * @return {{name:?string,type:?string,access:?boolean,walk:?boolean,bike:?boolean}} */
	function loadWayTags(id) {
		var result;
		var row;
		var data;
		var val,flag;

		var accessTags=['access'];
		var walkTags=['foot','footway','sidewalk'];
		var bikeTags=['bicycle','cycleway','cycleworth','ramp:bicycle'];

		data={name:null,type:null,access:null,walk:null,bike:null};
		result=db.query('SELECT k.data AS key,v.data AS val FROM waytag,tagdata AS k,tagdata AS v WHERE k.tagid=waytag.keyid AND v.tagid=waytag.valid AND k.data IN ("highway","name","'+accessTags.join('","')+'","'+walkTags.join('","')+'","'+bikeTags.join('","')+'") AND wayid="'+id+'";');

		while(row=result.getRow()) {
			flag=null;
			val=row['val'].toLowerCase();
			if(val=='0' || val=='no' || val=='false' || val=='off') flag=false;
			if(val=='1' || val=='yes' || val=='true' || val=='on') flag=true;

			switch(row['key'].toLowerCase()) {
				case 'highway':data.type=val;break;
				case 'name':data.name=''+row['val'];break;

				case 'access':
					data.access=flag;
					break;

				case 'foot':
				case 'footway':
				case 'sidewalk':
					data.walk=flag;
					break;

				case 'bicycle':
				case 'cycleway':
				case 'cycleworth':
				case 'ramp:bicycle':
					data.bike=flag;
					break;
			}
		}

		return(data);
	}

	base='..';
	city=new reach.trans.City();
	db=new reach.io.SQL(base+'/tiles.sqlite');

//	dbg=new reach.Debugger();
//	ctx=repl.start().context;
//	ctx.reach=reach;
//	ctx.city=city;
//	ctx.dbg=dbg;

/*
	console.log('Reading stops...');
	data=fs.readFileSync('tmp/stops.txt','utf8');
	advance=city.stopSet.importPack(data);
	while(advance()) {}

	console.log('Reading lines...');
	data=fs.readFileSync('tmp/lines.txt','ascii');
	advance=city.lineSet.importPack(data,city.stopSet);
	while(advance()) {}
*/

	data=fs.readFileSync(base+'/data/splits.txt','ascii');
	tree=new reach.road.TileTree(data,loadTileData,loadWayTags);

	/** @param {reach.road.Tile} tile */
	tree.loadTile=function(tile) {tile.loadOSM();};

	/** @param {string} txt */
	function write(txt) {fs.writeSync(fd,txt,null,'utf8');}

	/** @param {Array.<string>} txtList */
	function writeStringList(txtList) {
		var codec=new reach.data.Codec();
		var txtNum,txtCount;
		var len,maxLen;
		var compressed;

		maxLen=0;
		txtCount=txtList.length;
		for(txtNum=0;txtNum<txtCount;txtNum++) {
			len=txtList[txtNum].length;
			if(len>maxLen) maxLen=len;
		}

		compressed=codec.compressBytes(txtList.join('\n'),maxLen,10000);
		write(codec.encodeLong([compressed.length]));
		write(compressed);
	}

	var dijkstra,conf;
	var clusterNum;
	var found;
	var node,cluster;

	/** @type {Array.<reach.road.Tile>} */
	var tileStack;

	var ll;
	var id,clusterId;
	var i,l;

	dijkstra=new reach.route.Dijkstra();

	conf=new reach.route.Conf(city);
	conf.walkCostMul=1;
	conf.transCostMul=0;	// Only walk distance is needed for clustering so disable use of public transport in routing.
//	conf.maxCost=30*conf.walkTimePerM;
	conf.maxCost=20*conf.walkTimePerM;
	clusterNum=1;

	tileStack=/** @type {Array.<reach.road.Tile>} */ [tile];
	/** @param {reach.road.Tile} tile */
	tree.onTileLoad=function(tile) {tileStack.push(tile);};

//	if(maxTiles>=(1<<30)) 
	/** @param {reach.road.Tile} tile */
	tree.forEach(function(tile) {
		/** @type {Array.<string>} */
		var typeList;
		/** @type {Object.<string,number>} */
		var typeTbl;
		/** @type {Array.<string>} */
		var nameList;
		/** @type {Object.<string,number>} */
		var nameTbl;
		/** @type {array.<string>} */
		var data;
		var dataCount;
		var compressed;
		var typeNum,typeCount,typeLen;
		var nameNum,nameCount,nameLen;
		var len;

		if(!tile.isLeaf) return;
		if(!tile.loaded) tile.load();

		typeList=/** @type {Array.<string>} */ [];
		typeTbl=/** @type {Object.<string,number>} */ {};
		nameList=/** @type {Array.<string>} */ [];
		nameTbl=/** @type {Object.<string,number>} */ {};
		dataCount=0;
		data=/** @type {array.<string>} */ [];

		function writeBuf(txt) {
			data[dataCount++]=txt;
		}

		tile.exportPack(writeBuf,typeList,typeTbl,nameList,nameTbl);

		fd=fs.openSync(base+'/tiles/'+tile.path+'.txt','w');
		writeStringList(typeList);
		writeStringList(nameList);
		write(data.join(''));
		fs.closeSync(fd);
	});

	console.log('Frobnicating...');
	while(tile=/** @type {reach.road.Tile} */ (tileStack.pop())) {
		for(var pos in tile.nodeTbl) {
			node=tile.nodeTbl[pos];
			while(!node.clusterNum) cluster=node.makeCluster(dijkstra,conf,clusterNum++);
		}
	}

	console.log('Writing OSM format.');
	fd=fs.openSync('tile2.osm','w');
	tree.dumpOSM(write);
	fs.closeSync(fd);

	var tagInfo;

	fd=fs.openSync(base+'/data/map.txt','w');
	tagInfo=tree.exportTempPack(write);
	fs.closeSync(fd);

	console.log('Writing map text.');
	fd=fs.openSync(base+'/data/maptext.txt','w');
	writeStringList(tagInfo.typeList);
	writeStringList(tagInfo.nameList);
	fs.closeSync(fd);
	console.log('Done!');
}

Fiber(compute).run();
