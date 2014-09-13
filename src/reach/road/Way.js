goog.provide('reach.road.Way');
goog.require('reach.road.WayIterator');
goog.require('reach.road.Node');
goog.require('reach.util');

/** @constructor
  * @param {reach.road.Tile.Persist} persist */
reach.road.Way=function(persist) {
	/** @type {reach.road.Tile} Tile that this road segment belongs to. */
	this.tile=null;
	/** @type {reach.road.Tile} Tile containing the first node of this road segment if it continues from outside.
		Tiles may be far enough to not even touch if way nodes are far apart. */
	this.fromTile=null;
	/** @type {reach.road.Tile} Tile containing the last node of this segment if it continues outside its own tile. */
	this.toTile=null;
	/** @type {?string} Street name or special value 'routing' for virtual road segments connecting stops to road network. */
	this.name=null;
	/** @type {?string} OSM highway tag value, currently stored but unused. */
	this.type=null;
	/** @type {Array.<reach.MU|reach.road.Node>} List of nodes and coordinates of intermediate geometry. */
	this.pointList=null;
	/** @type {number} Length of pointList. */
	this.pointCount=0;
	/** @type {Array.<number>} Index of each node in the point list. List of nodes is formed by pointList[pointNumList[0...nodeCount-1]]
		or simply pointList[0...nodeCount-1] if pointNumList is null. */
	this.pointNumList=null;
	/** @type {number} Number of nodes = length of pointNumList or if it's null then length of pointList. */
	this.nodeCount=0;
	/** @type {Array.<number>} Cumulative distances of points along way. Unit: meters. */
	this.distList=null;
	/** @type {Array.<number>} Cumulative distances of nodes along way. Unit: meters. */
	this.nodeDistList=null;
	/** @type {reach.road.Tile.Persist} Used when freeing nodes to check that they're loaded from the compressed road tile instead of persistent data
      * loaded only at program initialization (such as virtual roads connecting all stops to the road network). */
	this.persist=persist;

	// Variables modified during Dijkstra.
	/** @type {number} Number of Dijkstra execution that last visited this way, to detect if old invalid Dijkstra state data may remain. */
	this.runId=-1;
	/** @type {Array.<number>} Costs for reaching nodes along this way. Node cost is duplicated in each way it touches, but
		this allows having a cost for turning to a different road which may delay the user having to spend effort looking for it. */
	this.costList;
	/** @type {Array.<number>} Times when nodes along this way are reached. USELESS? */
//	this.timeList;
	/** @type {Array.<reach.road.Way>} For each node along the way, previous way that was traveled to reach it. */
	this.srcWayList;
	/** @type {Array.<number>} Index of the node along the previous way, that connected to this node. */
	this.srcPosList;

	/** @type {reach.road.Way.Access} */
	this.access=reach.road.Way.Access.NONE;
};

/** @enum {number} */
reach.road.Way.Access={
	NONE:0,
	WALK:1,
	BIKE:2,
	TRANSIT:4,
	CAR:8
};

// TODO: Actually splitting a way can affect 3 tiles: those containing the new node and both nodes around it along the way.
// Those represents the 2 previously existing entry points to that part of the way, and the newly added one.
/** @param {number} where
  * @param {reach.road.Node} node */
/*
reach.road.Way.prototype.split=function(where,node) {
	var llPrev,ll,llNext;

	llPrev=this.nodeList[where].ll.toDeg();
	ll=node.ll.toDeg();
	llNext=this.nodeList[where+1].ll.toDeg();

	this.nodeList.splice(where+1,0,node);
	this.distList.splice(where,1,reach.util.vincenty(llPrev,ll),reach.util.vincenty(ll,llNext));
};
*/

/** @param {reach.MU} ll
  * @return {reach.road.NearWay} */
reach.road.Way.prototype.findNearest=function(ll) {
	var nodeNum,nodeCount;
	var node;
	var searchLat,searchLon;
	var bestLat,bestLon;
	var bestDist,bestPos;
	var iterator;
	var ll;
	var lat,prevLat;
	var lon,prevLon;
	var dlat,dlon,dist;
	var nearest;
	var pos;

	searchLat=ll.llat;
	searchLon=ll.llon;

	bestLat=0;
	bestLon=0;
	bestDist=-1;
	bestPos=0;

	iterator=this.iterateNodes();
	ll=iterator.next();

	lat=ll.llat;
	lon=ll.llon;

	while((ll=iterator.next())) {
		prevLat=lat;
		prevLon=lon;
		lat=ll.llat;
		lon=ll.llon;

		dlat=lat-prevLat;
		dlon=lon-prevLon;
		dist=dlat*dlat+dlon*dlon;

		pos=0;
		if(dist>0) {
			// Find position along line (prevLat,prevLon)-(lat,lon) closest to ll.
			pos=((searchLat-prevLat)*dlat+(searchLon-prevLon)*dlon)/dist;
			// If the position lies outside the line segment, move it to one of the end points.
			if(pos<0) pos=0;
			if(pos>1) pos=1;
		}

		dlat=(prevLat+dlat*pos)-searchLat;
		dlon=(prevLon+dlon*pos)-searchLon;
		dist=dlat*dlat+dlon*dlon;

		if(bestDist<0 || dist<bestDist) {
//			nearest={way:this,nodeNum:nodeNum-1,dist:dist,pos:pos,ll:null};
			bestLat=searchLat+dlat;
			bestLon=searchLon+dlon;
			bestDist=dist;
			bestPos=pos;
			iterator.mark();
		}
	}

//	if(nearest) nearest.ll=new reach.MU(bestLat,bestLon);
	if(bestDist<0) return(null);
	iterator.getDist(bestPos);

	nearest=/** @type {reach.road.NearWay} */ {
		way:this,
		nodePrev:iterator.nodePrev,
		distPrev:iterator.distPrev,
		nodeNext:iterator.nodeNext,
		distNext:iterator.distNext,
		dist:bestDist,
		ll:new reach.MU(bestLat,bestLon)
	};

	return(nearest);
};

/** @return {reach.road.WayIterator} */
reach.road.Way.prototype.iterateNodes=function() {
	return(new reach.road.WayIterator(this));
};
