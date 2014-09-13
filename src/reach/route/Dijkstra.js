goog.provide('reach.route.Dijkstra');
goog.require('reach.route.Visitor');
goog.require('reach.route.WayVisitor');
goog.require('reach.route.NodeVisitor');
goog.require('reach.route.StopVisitor');
goog.require('reach.route.LocVisitor');
goog.require('reach.road.Node');
goog.require('reach.road.Tile');
goog.require('reach.data.RadixHeap');

/** Dijkstra's algorithm, the core of the reachability analysis.
  * @constructor */
reach.route.Dijkstra=function() {
	/** @type {reach.route.Conf} */
	this.conf=null;
	/** @type {reach.data.RadixHeap} */
	this.heap=null;
	/** @type {number} */
	this.runId=0;

	/** @type {?function(reach.route.Dijkstra,reach.route.WayVisitor)} */
//	this.onVisitRoad=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.NodeVisitor)} */
//	this.onVisitNode=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.StopVisitor)} */
//	this.onVisitStop=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.TripVisitor)} */
//	this.onVisitLine=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.WayVisitor,reach.road.Node)} */
	this.onVisitGraphNode=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.WayVisitor,reach.road.Node,reach.trans.Stop)} */
	this.onVisitStopNode=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.LocVisitor,reach.loc.Location)} */
	this.onVisitLoc=null;

	/** @type {Array.<reach.road.Node>} */
	this.visitList=[];
	/** @type {number} */
	this.visitCount=0;

	/** @type {number} */
	this.clusterDist=10;
//	this.clusterDist=15;

	/** @type {Array.<{stop:reach.trans.Stop,cost:number,time:number}>} */
	this.visitStopList=[];

//	this.finalData=[];

	/** @type {function(reach.road.Tile)} */
	this.loadTile;

	/** @type {number} Stop Dijkstra when cost becomes too large */
	this.maxCost=0;
	/** @type {number} Currently only used to check if search explored the entire road graph (happens on islands and isolated graph segments).
      * Then if too few stops were found, routing would fail and it's better to find another nearest road outside the segment. */
	this.finalCost=0;

	/** @type {number} Unit: Time Units/m */
	this.walkCostPerM=0;

	/** @type {reach.route.Dijkstra.Dir} Direction of time as cost increases, boolean enum. */
	this.dir=reach.route.Dijkstra.Dir.FORWARD;
	/** @type {number} Direction of time as cost increases, multiplication factor 1 or -1. */
	this.timeDelta=1;

	/** @type {boolean} True if we will search in both directions to get optimal departure and arrival time. */
	this.optimal=false;
};

/** @enum {boolean} */
reach.route.Dijkstra.Dir={
    FORWARD:true,
    BACKWARD:false
};

/** @constructor Exception object returned on IO error when trying to load a road network tile.
  * @param {reach.road.Tile} tile
  * @param {reach.MU} ll */
reach.route.Dijkstra.LoadTileException=function(tile,ll) {
	/** @type {reach.road.Tile} */
	this.tile=tile;
	/** @type {reach.MU} */
	this.ll=ll;
};

/** Method to stop Dijkstra execution. */
reach.route.Dijkstra.prototype.stop=function() {
	this.maxCost=1;
};

/** Start from a road network tile node. Search for stops and routing graph nodes up to maxWalk meters. The batch process will retry binding to a
  * different road if too few stops are found (less than conf.stopNearMin). TODO: consider only stops with departures in Batch.js
  * @param {reach.road.Node} node
  * @param {reach.route.Conf} conf
  * @param {function(reach.road.Tile)} loadTile Callback function to load another map tile. */
reach.route.Dijkstra.prototype.startWayNode=function(node,conf,loadTile) {
	var wayNum,wayCount;
	var visitor;

	this.runId++;
	this.conf=conf;
	this.loadTile=loadTile;
	// Heap used as a priority queue. The radix "heap" isn't actually a heap...
	this.heap=new reach.data.RadixHeap(conf.maxCost);

	this.walkCostPerM=conf.walkTimePerM*conf.walkCostMul;
	// Note: maxWalk only affects distance up to which walks are guaranteed to have optimal geometry
	// in the beginning and end of routes or when transferring to custom transit lines.
	this.maxCost=conf.maxWalk*this.walkCostPerM;

	wayCount=node.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		// Starting cost is 1 because 0 can have strange special meanings
		// (mainly because undefined and 0 both evaluate to boolean false in tests).
		visitor=new reach.route.WayVisitor(this,node.wayList[wayNum],node.posList[wayNum],1,null,0);
		this.heap.insert(visitor,~~(visitor.cost+0.5));
	}
};

/** @param {reach.loc.Outdoor} loc
  * @param {number} startTime
  * @param {reach.route.Dijkstra.Dir} dir
  * @param {reach.route.Conf} conf */
reach.route.Dijkstra.prototype.startOutdoor=function(loc,startTime,dir,conf) {
	var walkList;
	var legNum,legCount;
	var leg;
	var visitor;

	reach.route.NodeVisitor.freeItem=null;
	reach.route.StopVisitor.freeItem=null;

	// TODO: This is a kludge. Nothing should read conf.forward I think, it should be deprecated.
	conf.forward=(dir==reach.route.Dijkstra.Dir.FORWARD);

	if(dir==reach.route.Dijkstra.Dir.FORWARD) {
		this.timeDelta=1;
	} else {
		this.timeDelta=-1;
	}
	this.runId++;
	this.dir=dir;
	this.conf=conf;
	// Heap used as a priority queue. The radix "heap" isn't actually a heap...
	this.heap=new reach.data.RadixHeap(conf.maxCost);

//	this.walkCostPerM=conf.walkTimePerM*conf.walkCostMul;
	this.maxCost=conf.maxCost;

	walkList=loc.walkList[reach.loc.Outdoor.Type.GRAPH];
	if(walkList) {
		legCount=walkList.length;
		for(legNum=0;legNum<legCount;legNum++) {
			leg=/** @type {reach.route.result.WalkLeg} */ walkList[legNum].leg;
			leg.startNode.firstWalk=walkList[legNum];

			// Note: leg.cost must be >=1! If dijkstra starting cost is 0, bad things happen because 0 evaluates to false in tests.
			if(leg.cost<1) leg.cost++;
			visitor=reach.route.NodeVisitor.create(this,leg.startNode,leg.cost,startTime+leg.duration*this.timeDelta,null,null,0,0);
			this.heap.insert(visitor,~~(visitor.cost+0.5));
		}
	}
};

/** @param {reach.route.Visitor} visitor */
reach.route.Dijkstra.prototype.found=function(visitor) {
//	this.heap.insert(visitor,~~(visitor.cost+0.5));
	this.heap.insert(visitor,visitor.cost);
	return(true);
};

/** Advance Dijkstra's algorithm by one step, visiting one stop.
  * @return {number} 0 means the function can be called again,
  * 1 means search is done and -1 means we need to wait for some callback (mainly loadTile) to fire before continuing. */
reach.route.Dijkstra.prototype.step=function() {
	var visitor;
	var ret;

	visitor=/** @type {reach.route.Visitor} */ this.heap.extractMin();
	// Checking maxCost here instead of step so search can be stopped immediately by lowering it.
	if(!visitor || (this.maxCost>0 && visitor.cost>this.maxCost)) {
		// Save memory by allowing the heap to be garbage collected.
		this.heap=null;
		if(visitor) this.finalCost=visitor.cost;
		else this.finalCost=0;
		return(1);
	}
	ret=visitor.visit(this);
	if(ret==reach.route.Visitor.State.WAIT) {
		// The visitor was interrupted, likely to wait for more data to load.
		// Put it back in the heap so it's visited again next when routing can continue.
		this.heap.insert(visitor,~~(visitor.cost+0.5));
		return(-1);
	}

	return(0);
};
