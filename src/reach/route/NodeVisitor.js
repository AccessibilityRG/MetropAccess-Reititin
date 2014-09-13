goog.provide('reach.route.NodeVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.route.StopVisitor');
goog.require('reach.route.ExtraVisitor');
goog.require('reach.road.Node');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.NodeVisitor=function() {
	reach.route.Visitor.call(this);
	/** @type {reach.road.Node|reach.route.NodeVisitor} Node to visit or for unused visitors the next visitor. */
	this.node;
	/** @type {reach.road.Node} */
	this.srcNode;
	/** @type {reach.trans.Stop} */
	this.srcStop;
	/** @type {reach.trans.Extra} */
	this.srcExtra;
	/** @type {number} */
	this.srcDist;
	/** @type {number} */
	this.tripCount;
};

//var globalNew=0;

reach.inherit(reach.route.NodeVisitor,reach.route.Visitor);

/** @type {reach.route.NodeVisitor} */
reach.route.NodeVisitor.freeItem=null;

/** Initialization separated from constructor so existing objects can be recycled instead of calling new.
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.road.Node} node
  * @param {number} cost
  * @param {number} time
  * @param {reach.road.Node} srcNode
  * @param {reach.trans.Stop} srcStop
  * @param {number} srcDist
  * @param {number} tripCount */
reach.route.NodeVisitor.create=function(dijkstra,node,cost,time,srcNode,srcStop,srcDist,tripCount,srcExtra) {
	var self;

	self=reach.route.NodeVisitor.freeItem;
	if(self) {
		reach.route.NodeVisitor.freeItem=/** @type {reach.route.NodeVisitor} */ self.node;
	} else {
		self=new reach.route.NodeVisitor();
//console.log(globalNew++);
	}

	self.node=node;
	self.cost=cost;
	self.time=time;
	self.srcNode=srcNode;
	self.srcStop=srcStop;
	self.srcExtra=srcExtra;
	self.srcDist=srcDist;
	self.tripCount=tripCount;

	if(node.runId!=dijkstra.runId) {
		// If this node hasn't been seen before in this Dijkstra run,
		// it may still contain old routing data from a previous run. Remove the data.
		node.runId=dijkstra.runId;
//		node.cost=dijkstra.conf.infCost;
		node.cost=0;
		node.time=0;	// For isochrones.
		node.srcNode=null;
		node.srcStop=null;
		node.srcExtra=null;
		node.srcDist=0;
	}

	return(self);
};

reach.route.NodeVisitor.prototype.free=function() {
	this.node=reach.route.NodeVisitor.freeItem;
	reach.route.NodeVisitor.freeItem=this;
	return(reach.route.Visitor.State.OK);
};

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.NodeVisitor.prototype.visit=function(dijkstra) {
	var runId;
	var stopNum,stopCount;
	var followerNum,followerCount;
	var cost,otherCost;
	var time,duration;
	var dist;
	var node,next;
	var stop;
	var tripCount;
	var forward;
	var walkList;
	var walkNum;
	var leg;
	var loc;

	node=/** @type {reach.road.Node} */ this.node;
	cost=this.cost;

	// Exit if node has already been reached with lower cost.
	if(node.cost && node.cost<=cost) return(this.free());
//	if(node.cost<=cost) return(this.free());

	time=this.time;
	tripCount=this.tripCount;
	forward=(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD);

	runId=dijkstra.runId;
	node.cost=cost;
	node.time=time;	// For isochrones.
	node.srcNode=this.srcNode;
	node.srcStop=this.srcStop;
//if(this.srcExtra) console.log(this.srcExtra);
	node.srcExtra=this.srcExtra;
	// Store distance to previous node because otherwise recovering it would require going through previous node's followerList.
	node.srcDist=this.srcDist;

	// Not used for routing.
//	if(dijkstra.onVisitNode) dijkstra.onVisitNode(dijkstra,this);

	walkList=node.walkList;
	if(walkList) {
		walkNum=walkList.length;
		while(walkNum--) {
			leg=/** @type {reach.route.result.WalkLeg} */ walkList[walkNum].leg;
			loc=leg.endLoc;
			if(loc.runId!=runId || !loc.cost || loc.cost>cost+leg.cost) {
				dijkstra.found(new reach.route.LocVisitor(dijkstra,loc,cost+1,time,leg,tripCount));
			}
		}
	}

	// Check transit stops connected to this node.
	if(node.stopList) {
		stopCount=node.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=node.stopList[stopNum];
//			if(stop.runId!=runId || !stop.costList[0] || stop.costList[0]>cost+1) dijkstra.found(new reach.route.StopVisitor(dijkstra,stop,cost+1,time,node,null,0,tripCount));
			if(this.srcStop!=stop) {
				// Increase cost by 1 when entering the stop because zero-cost transitions are bad luck.
				dijkstra.found(reach.route.StopVisitor.create(dijkstra,stop,cost+1,time,node,null,0,tripCount));
			}
		}
	}

	if(node.extraLine) {
//		console.log(node.extraLine+' '+node.ll+' '+node.cost+' '+cost);
		dijkstra.found(new reach.route.ExtraVisitor(dijkstra,node.extraLine,node.extraPos,cost+1,time,node,tripCount+1));
	}

	this.free();
	// Look for surrounding nodes to walk to.
	followerCount=node.followerCount;
	for(followerNum=0;followerCount;followerNum++) {
		// List might have gaps but there's still followerCount items. (TODO: Can there actually be gaps nowadays???)
		next=node.followerList[followerNum];
		if(!next) continue;
		followerCount--;
//		if(next.runId==runId && next.cost && next.cost<=otherCost) continue;
		// Shortcut, we don't even need to calculate distance to the next node if its cost is less than current node's.
		if(next.runId==runId && next.cost && next.cost<=otherCost) continue;

		dist=node.distList[followerNum];
		duration=dist*dijkstra.conf.walkTimePerM;
		otherCost=cost+duration*dijkstra.conf.walkCostMul;
		if(otherCost<cost+1) otherCost=cost+1;
		if(!forward) duration=-duration;

		if(next.runId!=runId || !next.cost || next.cost>otherCost) {
//		if(next.runId!=runId || next.cost>otherCost) {
			dijkstra.found(reach.route.NodeVisitor.create(dijkstra,next,otherCost,time+duration,node,null,dist,tripCount));
		}
	}

	return(reach.route.Visitor.State.OK);
};
