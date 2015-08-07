goog.provide('reach.road.Tile');
goog.require('reach.road.Way');
goog.require('reach.road.NearWay');
goog.require('reach.road.Node');
goog.require('reach.data.Codec');
goog.require('reach.util');
goog.require('reach.MU');

/** @constructor
  * @param {reach.road.TileTree} tileTree
  * @param {string} path
  * @param {number} id
  * @param {number} sEdge
  * @param {number} wEdge
  * @param {number} nEdge
  * @param {number} eEdge */
reach.road.Tile=function(tileTree,path,id,sEdge,wEdge,nEdge,eEdge) {
	/** @type {reach.road.TileTree} */
	this.tree=tileTree;
	/** @type {string} */
	this.path=path;
	/** @type {number} */
	this.id=id;
	/** @type {number} */
	this.sEdge=sEdge;
	/** @type {number} */
	this.wEdge=wEdge;
	/** @type {number} */
	this.nEdge=nEdge;
	/** @type {number} */
	this.eEdge=eEdge;
	/** @type {reach.road.Tile} */
	this.nw=null;
	/** @type {reach.road.Tile} */
	this.ne=null;
	/** @type {reach.road.Tile} */
	this.sw=null;
	/** @type {reach.road.Tile} */
	this.se=null;
	/** @type {boolean} */
	this.loading=false;
	/** @type {boolean} */
	this.loaded=false;
	/** @type {boolean} */
	this.isLeaf=false;

	/** @type {Array.<boundSW:reach.MU,boundNE:reach.MU>} */
	this.areaList=[];
	/** @type {Array.<reach.road.Tile>} */
	this.neighbours=[];
	/** @type {Array.<reach.road.Way>} */
//	this.wayList=[];
	/** @type {Object.<reach.road.Tile.Persist,Array.<reach.road.Way>>} This is to keep persistent ways when tile is unloaded. */
	this.persistWayTbl={};
	/** @type {Object.<number,reach.road.Node>} */
	this.nodeTbl={};
	/** @type {Array.<reach.road.Node>} */
	this.graphNodeList=null;
	/** @type {number} */
//	this.wayCount=0;
	/** @type {Array.<function(reach.road.Tile)>} */
	this.callbackList=[];

	/** @type {?string} */
	this.rawData=null;
};

/** @enum {number} */
reach.road.Tile.Persist={
	GRAPH:1,	// Data initialized only at program startup, together with routing graph.
	ROAD:2,		// Data loaded from a road network tile and easy to reload.
	TIMETABLE:4,	// Data loaded together with monthly/weekly timetables.
	QUERY:8		// Data passed as a routing query parameter, for example to test routing with additional roads.
};

/** @param {Array.<reach.MU>} ptList
  * @param {Array.<boolean>} connList
  * @param {Array.<number>} distList
  * @param {string} type
  * @param {string} name
  * @param {reach.road.Way.Access} access
  * @param {reach.road.Tile.Persist} persist
  * @param {boolean} readGeom
  * @return {reach.road.Way} */
reach.road.Tile.prototype.insertWay=function(ptList,connList,distList,type,name,access,persist,readGeom) {
	var neighbours;
	var pointNum,pointCount;
	var nodeNum;
	var ll;
	var lat,lon;
	var tileNum;
	var dist;
	var pointList;
	var pointNumList;
	var nodeDistList,geomDistList;
	var connFlag;
	var tile;
	var wayList;
	var way;
	var key;
	var node;

	neighbours=this.neighbours;
	pointCount=ptList.length;

	way=new reach.road.Way(persist);
	way.tile=this;
	way.name=name;
	way.type=type;
	way.access=access;

	pointList=[];
	nodeDistList=[];
	way.pointList=pointList;
	way.nodeDistList=nodeDistList;

	if(readGeom) {
		pointNumList=[];
		geomDistList=[];
		way.pointNumList=pointNumList;
		way.distList=geomDistList;
	}

	connFlag=true;
	nodeNum=0;
	dist=0;

	for(pointNum=0;pointNum<pointCount;pointNum++) {
		ll=ptList[pointNum];
		lat=ll.llat;
		lon=ll.llon;
		dist+=distList[pointNum];
		if(connList) connFlag=connList[pointNum];

		tile=this;
		// This flag means the point is connected to something else, so a node should be created for it.
		if(connFlag) {
			// Check if way begins or ends in another tile.
			if((pointNum==0 || pointNum==pointCount-1) && (lat<this.sEdge || lat>=this.nEdge || lon<this.wEdge || lon>=this.eEdge)) {
				tileNum=neighbours.length;
				while(tileNum--) {
					tile=neighbours[tileNum];
					if(lat>=tile.sEdge && lat<tile.nEdge && lon>=tile.wEdge && lon<tile.eEdge) break;
				}

				if(tileNum<0) {
					tile=this.tree.findTile(ll,0);
					reach.util.assert(!!tile,'Tile.insertWay','Tile containing a way node does not exist!');
					if(tile) neighbours.push(tile);
				}

				// Add reference to another tile found.
				if(nodeNum==0) way.fromTile=tile;
				else way.toTile=tile;
			}

			// Tile should never be null but check anyway in case findTile failed, then insert node in tile.
			if(tile) node=tile.insertNode(ll,persist);
			else node=null;
		} else {
			// Road network has no internal connections but check if a node has anyway already been inserted at this point.
			key=this.nodeKey(ll);
			node=this.nodeTbl[key];
			if(node) this.tree.setNodePersist(node,persist);
		}

		if(node) {
			// Bind created node and way together.
			node.addWayRef(way,nodeNum);
			if(readGeom) {
				pointList[pointNum]=node;
				pointNumList[nodeNum]=pointNum;
				geomDistList[pointNum]=dist;
			} else {
				pointList[nodeNum]=node;
			}
			nodeDistList[nodeNum]=dist;
			nodeNum++;
		} else if(readGeom) {
			// No node created so just store plain coordinates.
			pointList[pointNum]=ll;
			geomDistList[pointNum]=dist;
		}
	}

	if(readGeom) way.pointCount=pointCount;
	else way.pointCount=nodeNum;
	way.nodeCount=nodeNum;

	// Add way to tile.
//	this.wayList[this.wayCount++]=way;
//	if(persist&(reach.road.Tile.Persist.TIMETABLE|reach.road.Tile.Persist.QUERY)) this.persistWayList.push(way);
	// TODO: should do this separately for each bit set in persist!
	wayList=this.persistWayTbl[persist];
	if(!wayList) {
		wayList=[];
		this.persistWayTbl[persist]=wayList;
	}
	wayList.push(way);
	if(persist&(reach.road.Tile.Persist.TIMETABLE|reach.road.Tile.Persist.QUERY)) {
		wayList=this.tree.persistWayTbl[persist];
		if(!wayList) {
			wayList=[];
			this.tree.persistWayTbl[persist]=wayList;
		}
		wayList.push(way);
	}

	return(way);
};

/** @param {reach.road.Way} way */
/*
reach.road.Tile.prototype.removeWay=function(way) {
	var wayList;
	var wayNum,wayCount;

	wayList=this.wayList;
};
*/

/** @param {reach.MU} ll
  * @return {number} */
reach.road.Tile.prototype.nodeKey=function(ll) {
	var x,y,key;

	// The originally 30-bit coordinate pair will fit in 56 bits after about
	// 3 quadtree split levels making tile internal coordinates only (30-splits) bits.
	x=ll.llat-this.sEdge;
	y=ll.llon-this.wEdge;
	// Cantor pairing function, bijectively maps 2 integers into 1.
	// Good for JavaScript since bitwise operators are 32-bit only and slow.
	key=((x+y)*(x+y+1)/2)+y;

	return(key);
};

/** Store way and position along it in a hash based on coordinates.
  * @param {reach.MU} ll
  * @param {reach.road.Tile.Persist} persist
  * @return {reach.road.Node} */
reach.road.Tile.prototype.insertNode=function(ll,persist) {
	var node;
	var key;

	key=this.nodeKey(ll);

	// Here hasOwnProperty has been omitted, since object prototype shouldn't have numerical members.
	node=this.nodeTbl[key];
	if(!node) {
		node=new reach.road.Node(ll);
		node.wayList=[];
		node.posList=[];
//		node.wayCount=0;
		this.nodeTbl[key]=node;
	}
	if(node) this.tree.setNodePersist(node,persist);

	return(node);
};

/** @param {reach.road.Node} node
  * @param {reach.road.Tile.Persist} persist */
reach.road.Tile.prototype.bindNode=function(node,persist) {
	var key;

	key=this.nodeKey(node.ll);
	node.wayList=[];
	node.posList=[];
	this.nodeTbl[key]=node;
	this.tree.setNodePersist(node,persist);
};

/** @param {reach.road.Node} node */
reach.road.Tile.prototype.removeNode=function(node) {
	var key;

	key=this.nodeKey(node.ll);
	if(this.nodeTbl[key]!=node) return;

	// TODO: After the table gets filled with too many nulls, it should be rebuilt by inserting only non-nulls to a new table.
	this.nodeTbl[key]=null;
};

reach.road.Tile.prototype.importGraph=function() {
	var nodeList;
	var nodeNum,nodeCount;
	var node;

	nodeList=this.graphNodeList;
	if(!nodeList) return;
	nodeCount=nodeList.length;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=nodeList[nodeNum];
		this.bindNode(node,reach.road.Tile.Persist.GRAPH);
	}
};

/** @param {reach.task.Task} task
  * @param {reach.MU} ll
  * @param {function(reach.road.Tile)} callback */

reach.road.Tile.prototype.load=function(task,ll,callback) {
	/** @type {reach.road.Tile} */
	var self=this;
	var fetchTask;
	var parseTask;
	var loadTask;

	if(this.loaded) {
		if(callback) callback(this);
		return;
	}
	if(callback) this.callbackList.push(callback);
	if(this.loading) return;
	this.loading=true;

	parseTask=new reach.task.Custom('Parse tile',function(task) {
		var stream;
		var data;

		self.importGraph();

		data=(/** @type {reach.task.FetchResult} */ (fetchTask.result)).data;
		if(!data) {
			// TODO: add error handling, tile retrieval failed.
			self.loaded=true;
			return(null);
		}

		if(!self.rawData) self.rawData=data;
		stream=new reach.data.Stream(data);
		// TODO: set readGeom intelligently here! true is always safe, false saves memory when not needing full road geometry for drawing or geocoding.
		return(self.importPack(stream,true));
//		return(self.importPack(stream,false));
	});

	loadTask=new reach.task.Custom('Load tile',function(task) {
		var i,l;

		self.loading=false;
		self.loaded=true;
		l=self.callbackList.length;
		for(i=0;i<l;i++) self.callbackList[i](self);
		self.callbackList=[];
		return(null);
	});

	loadTask.addDep(parseTask);

	if(!this.rawData) {
		fetchTask=this.tree.loadTile(this,task);
		parseTask.addDep(fetchTask);
		// Make sure connections to stops are loaded first.
		// TODO: removed on 2013-05-01, verify change
		parseTask.addDep(reach.control.ModelTasks.road.refs.parse.task);
	}

	task.runChild(loadTask);

	return(loadTask);
};

/*
reach.road.Tile.prototype.free=function() {
	var wayList;
	var wayNum,wayCount;
	var way;
	var tbl=this.nodeTbl;
	var node;

//	console.log('Free '+this.path);

	// Remove links from nodes to ways, so ways are no longer connected to each other and most can be garbage collected.
	for(var n in tbl) {
		if(!tbl.hasOwnProperty(n)) continue;
		node=tbl[n];

		node.wayList=null;
		node.posList=null;
	}

	wayList=this.wayList;
	wayCount=wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		// The first and last node of way could be disconnected from the way here but only if they point to no other ways,
		// so memory savings would be minimal anyway. If they point to more ways, the nodes might be outside this tile and
		// still be needed to connect ways within tiles in use.
		way=this.wayList[wayNum];
		way.costList=null;
		way.timeList=null;
		way.srcPosList=null;
		way.srcWayList=null;
	}

	this.wayList=[];
	this.nodeTbl={};
};
*/

reach.road.Tile.prototype.freeGeometry=function() {
};

// TODO: loadTileData and loadWayTags should be parameters of this function instead of members of TileTree.
/*
reach.road.Tile.prototype.loadOSM=function() {
	var codec=new reach.data.Codec();
	var wayNum,wayCount;
//	var tileNum,tileCount;
	var dataNum,dataCount;
	var pos;
//	var neighbours;
	var wayDataList;
	var wayData;
	var wayTags;
	var way,node;
	var lat,lon;
	var ll;
	var points;
	var id;
	var type;
	var access,walk,bike;
*/
	/** @type {Object.<string,boolean>} */
/*
	var disallowAll={
		'motorway':true,
		'trunk':true,
		'motorway_link':true,
		'trunk_link':true,
		'construction':true,
		'turning_circle':true,
		'abandoned':true,
		'raceway':true,
		'bridleway':true,
		'motorway_junction':true,
		'proposed':true,
		'unused_path':true,
		'planned':true,
		'seasonal':true,
		'under_construction':true
	};
*/
	/** @type {Object.<string,boolean>} */
/*
	var disallowWalk={
		'cycleway':true
	};
*/
	/** @type {Object.<string,boolean>} */
/*
	var disallowBike={
		'steps':true,
		'elevator':true,
		'stairway':true
	};

	console.log('Loading tile '+this.path);

	wayDataList=this.tree.loadTileData(this.path);
	id=0;

	wayCount=wayDataList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		wayData=codec.decodeOld(wayDataList[wayNum].data);
		wayTags=this.tree.loadWayTags(wayDataList[wayNum].id);
		access=wayTags.access;
		walk=wayTags.walk;
		bike=wayTags.bike;
		type=wayTags.type||'';

		if(access===false || (disallowAll[type] && walk!==true && bike!==true)) continue;

		if(disallowWalk[type] && walk!==true) walk=false;
		if(disallowBike[type] && bike!==true) bike=false;
		if(walk!==false) walk=true;
		if(bike!==false) bike=true;

		points=[];
		lat=this.sEdge;
		lon=this.wEdge;

		pos=0;
		dataCount=wayData.length;
		for(dataNum=0;dataNum<dataCount;pos++) {
			lat+=wayData[dataNum++];
			lon+=wayData[dataNum++];

			ll=new reach.MU(lat,lon);
			points[pos]=ll;
		}

		way=this.insertWay(points,type,wayTags.name||'',walk,bike,false);
		way.id=id++;
	}

	this.loaded=true;
	if(this.tree.onTileLoad) this.tree.onTileLoad(this);
};
*/

/** @param {function(string)} write */
/*
reach.road.Tile.prototype.dump=function(write) {
	var nodeNum,nodeCount;
	var wayNum,wayCount;
	var way,node;
	var ll;
	var data;
	var id;

	write('WKT,id,name\n');

	id=1;
	wayCount=this.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];

		data=[];
		nodeCount=way.nodeList.length;
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			ll=node.ll.toDeg();
			data[nodeNum]=ll.llon+' '+ll.llat;
		}
		write('"LINESTRING ('+data.join(',')+')",'+(id++)+',"'+way.name+'"\n');
	}
};

reach.road.Tile.prototype.clearDumpFlag=function() {
	var nodeNum,nodeCount;
	var wayNum,wayCount;
	var way,node;

	wayCount=this.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];

		nodeCount=way.nodeList.length;
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			node.dumpId=0;
		}
	}
}
*/

/** @param {function(string)} write
  * @param {number} id
  * @return {number} */
/*
reach.road.Tile.prototype.dumpOSM=function(write,id) {
	var nodeNum,nodeCount;
	var wayNum,wayCount;
	var way;
*/
	/** @type {reach.road.Node} */
//	var node;
	/** @type {reach.Deg} */
/*
	var ll;

	wayCount=this.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];

		nodeCount=way.nodeList.length;
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			if(node.clusterRef) node=node.clusterRef;
			ll=node.ll.toDeg();
			if(!node.dumpId) {
				node.dumpId=-(id++);
				write('<node id="'+node.dumpId+'" visible="true" lat="'+ll.llat+'" lon="'+ll.llon+'"></node>\n');
				//write(node.ll.llat+'\t'+node.ll.llon+'\n');
			}
		}
		write('<way id="'+(-(id++))+'">\n');
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			if(node.clusterRef) node=node.clusterRef;
			write('\t<nd ref="'+node.dumpId+'" />\n');
		}
		write('\t<tag k="name" v="'+way.name+'" />\n');
		write('\t<tag k="type" v="'+way.type+'" />\n');
		write('\t<tag k="walk" v="'+(way.walk?'yes':'no')+'" />\n');
		write('\t<tag k="bike" v="'+(way.bike?'yes':'no')+'" />\n');
		write('</way>\n');
	}

	return(id);
};
*/

/** @param {reach.MU} ll
  * @param {number} runId
  * @return {reach.road.NearWay} */
reach.road.Tile.prototype.findWay=function(ll,runId) {
	var lat,lon;
	var nearest,maybeNearest;
	var wayList;
	var wayNum,wayCount;
	var way;

	lat=ll.llat;
	lon=ll.llon;
	nearest=null;

	for(var persist in this.persistWayTbl) {
		if(!this.persistWayTbl.hasOwnProperty(persist)) continue;
		wayList=this.persistWayTbl[(/** @type {reach.road.Tile.Persist} */ persist)];

		wayCount=wayList.length;

		for(wayNum=0;wayNum<wayCount;wayNum++) {
			way=wayList[wayNum];
			// Omit ways added to connect additional points like bus stops to the road network.
			// Otherwise new points could get connected to previous connectors rather than actual roads.
			if(way.type=='routing') continue;
			// Omit ways recently visited if searching for alternative roads when few or no bus stops were
			// reachable from the closest road.
			if(runId && way.runId && way.runId>runId) continue;

			maybeNearest=way.findNearest(ll);

			if(!nearest || maybeNearest.dist<nearest.dist) nearest=maybeNearest;
		}
	}

	return(nearest);
};

/** Calculate minimum distance from point to tile edge.
  * @param {number} lat
  * @param {number} lon
  * @return {number} */
reach.road.Tile.prototype.sqDistTo=function(lat,lon) {
	var edgeList;
	var edgeNum;
	var dlon,dlat;
	var dist,minDist;

	if(lat>=this.sEdge && lat<this.nEdge && lon>=this.wEdge && lon<this.eEdge) return(0);

	edgeList=/** @type {Array.<number>} */ [
		this.sEdge,this.wEdge,
		this.sEdge,this.eEdge,
		this.nEdge,this.wEdge,
		this.nEdge,this.eEdge
	];

	// Check distance to corners.
	dlat=lat-edgeList[0];
	dlon=lon-edgeList[1];
	minDist=dlat*dlat+dlon*dlon;

	for(edgeNum=2;edgeNum<8;) {
		dlat=lat-edgeList[edgeNum++];
		dlon=lon-edgeList[edgeNum++];

		dist=dlat*dlat+dlon*dlon;
		if(dist<minDist) minDist=dist;
	}

	// Check distance to edges.
	if(lat>=this.sEdge && lat<this.nEdge) {
		edgeList=/** @type {Array.<number>} */ [this.wEdge,this.eEdge];
		for(edgeNum=0;edgeNum<2;edgeNum++) {
			dlon=lon-edgeList[edgeNum];

			dist=dlon*dlon;
			if(dist<minDist) minDist=dist;
		}
	}

	if(lon>=this.wEdge && lon<this.eEdge) {
		edgeList=/** @type {Array.<number>} */ [this.sEdge,this.nEdge];
		for(edgeNum=0;edgeNum<2;edgeNum++) {
			dlat=lat-edgeList[edgeNum];

			dist=dlat*dlat;
			if(dist<minDist) minDist=dist;
		}
	}

	return(minDist);
};

/** @param {function(string)} write
  * @param {Array.<string>} typeList
  * @param {Object.<string,number>} typeTbl
  * @param {Array.<string>} nameList
  * @param {Object.<string,number>} nameTbl */
//reach.road.Tile.prototype.exportPack=function(write,typeList,typeTbl,nameList,nameTbl) {
	/** @type {reach.data.Codec} */
/*
	var codec=new reach.data.Codec();
	var nodeNum,nodeCount;
	var wayNum,wayCount;
	var way,node;
	var nameId,typeId;
	var lat,lon;
	var lat1,lon1,latN,lonN;
	var bit,bit1,bitN;

	wayCount=this.wayList.length;
	write(codec.encodeShort([wayCount]));

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];

		typeId=typeTbl[way.type];
		if(!typeId && typeId!==0) {
			typeId=typeList.length;
			typeList[typeId]=way.type;
			typeTbl[way.type]=typeId;
		}

		nameId=nameTbl[way.name];
		if(!nameId && nameId!==0) {
			nameId=nameList.length;
			nameList[nameId]=way.name;
			nameTbl[way.name]=nameId;
		}

		nodeCount=way.nodeList.length;
		write(codec.encodeShort([nameId,typeId,(way.bike?2:0)+(way.walk?1:0),nodeCount]));

		lat=this.sEdge;
		lon=this.wEdge;

		lat1=way.nodeList[0].ll.llat;
		lon1=way.nodeList[0].ll.llon;
		latN=way.nodeList[nodeCount-1].ll.llat;
		lonN=way.nodeList[nodeCount-1].ll.llon;

		bit1=0;
		bitN=0;
		if(lat1<this.sEdge || lat1>=this.nEdge || lon1<this.wEdge || lon1>=this.eEdge) bit1=1;
		if(latN<this.sEdge || latN>=this.nEdge || lonN<this.wEdge || lonN>=this.eEdge) bitN=1;

		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			if(node.clusterRef) node=node.clusterRef;

				bit=0;
				if(node.wayList.length>1) bit=1;
				if(nodeNum==0 || (bit1 && nodeNum==1)) bit=1;
				if(nodeNum==nodeCount-1 || (bitN && nodeNum==nodeCount-2)) bit=1;

				write(codec.encodeLong([reach.util.fromSigned(node.ll.llat-lat)*2+bit,reach.util.fromSigned(node.ll.llon-lon)]));

			lat=node.ll.llat;
			lon=node.ll.llon;
		}
	}
};
*/

/** @param {reach.data.Stream} stream
  * @param {boolean} readGeom
  * @return {function():number} */
reach.road.Tile.prototype.importPack=function(stream,readGeom) {
	/** @type {reach.road.Tile} */
	var self=this;
	var step;
	var typeList;
	var nameList;
	var wayNum,wayCount;

	/** @return {number} */
	var advance=function() {
		var len;
		var data;
		var dec;
		var code;
		var nameId,typeId;
		var flags;
		var access;
		var ptNum,ptCount;
		var pointList;
		var connList;
		var distList;
		var dist;
		var lat,lon;
		var ll,llPrev;
		var dataNum;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				len=stream.readLong(1)[0];
				data=stream.readPack(len,10000);
				typeList=data.split('\n');

				len=stream.readLong(1)[0];
				data=stream.readPack(len,10000);
				nameList=data.split('\n');

				wayNum=0;
				wayCount=stream.readShort(1)[0];
				return(wayCount);

			case 1:
				dec=stream.readShort(4);
				nameId=dec[0];
				typeId=dec[1];
				flags=dec[2];
				ptCount=dec[3];

				access=reach.road.Way.Access.NONE;
				if(flags&1) access|=reach.road.Way.Access.WALK;
				if(flags&2) access|=reach.road.Way.Access.BIKE;

				pointList=[];
				connList=[];
				distList=[];
				dist=0;
				ll=null;
				lat=self.sEdge;
				lon=self.wEdge;

				dec=stream.readLong(ptCount*2);
				dataNum=0;

				for(ptNum=0;ptNum<ptCount;ptNum++) {
					code=dec[dataNum++];
					lat+=reach.util.toSigned(code>>1);
					lon+=reach.util.toSigned(dec[dataNum++]);

					llPrev=ll;
					ll=new reach.MU(lat,lon);
					if(llPrev) dist=ll.distTo(llPrev);
					pointList[ptNum]=ll;
					connList[ptNum]=(ptNum==0 || ptNum==ptCount-1 || code&1);
					distList[ptNum]=dist;
				}

				self.insertWay(pointList,connList,distList,typeList[typeId],nameList[nameId],access,reach.road.Tile.Persist.ROAD,readGeom);
				wayNum++;
				return(wayCount-wayNum);
		}
	};

	step=0;
	return(advance);
};

/** @param {function(reach.road.Tile)} handler */
reach.road.Tile.prototype.forEach=function(handler) {
	/** @param {reach.road.Tile} tile */
	function rec(tile) {
		if(!tile) return;
		handler(tile);

		rec(tile.nw);
		rec(tile.ne);
		rec(tile.sw);
		rec(tile.se);
	}

	rec(this);
};
