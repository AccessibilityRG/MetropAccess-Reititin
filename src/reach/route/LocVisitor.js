goog.provide('reach.route.LocVisitor');
goog.require('reach.route.Visitor');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.loc.Location} loc
  * @param {number} cost
  * @param {reach.route.result.WalkLeg} srcLeg
  * @param {number} tripCount */
reach.route.LocVisitor=function(dijkstra,loc,cost,time,srcLeg,tripCount) {
	reach.route.Visitor.call(this);
	/** @type {reach.loc.Location} */
	this.loc=loc;
	/** @type {number} */
	this.cost=cost;
	/** @type {number} */
	this.time=time;
	/** @type {number} */
	this.tripCount=tripCount;

	if(loc.runId!=dijkstra.runId) {
		loc.runId=dijkstra.runId;
		loc.cost=0;
		loc.srcLeg=null;
    }
};

reach.inherit(reach.route.LocVisitor,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.LocVisitor.prototype.visit=function(dijkstra) {
	var loc;
	var cost;
	var tripCount;
	var walkList;
	var walkNum,walkCount;
	var node;

	loc=this.loc;
	cost=this.cost;

	if(loc.cost && loc.cost<=cost) return(reach.route.Visitor.State.OK);
	loc.cost=cost;

	if(dijkstra.onVisitLoc) dijkstra.onVisitLoc(dijkstra,this,loc);
/*
	if(loc.inputSet.mode==reach.loc.InputSet.Type.EXTRA) {
		tripCount=this.tripCount;
		walkList=loc.walkList[reach.loc.Outdoor.Type.GRAPH];
		walkCount=walkList.length;
		for(walkNum=0;walkNum<walkCount;walkNum++) {
			walk=walkList[walkNum].leg;
			node=walk.startNode;
			if(node.cost>cost) {
//				console.log(walk.startNode);
//				dijkstra.found(new reach.route.StopVisitor(dijkstra,stop,cost+transferCost,time+waitTime,null,trip,pos,tripCount));
				dijkstra.found(reach.route.NodeVisitor.create(dijkstra,node,cost+1,this.time,null,null,0,tripCount));
			}
		}
	}
*/

	return(reach.route.Visitor.State.OK);
};
