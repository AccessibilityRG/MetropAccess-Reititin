goog.provide('reach.route.StopVisitor');
goog.require('reach.route.TripVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.StopVisitor=function() {
	reach.route.Visitor.call(this);
	/** @type {reach.trans.Stop|reach.route.StopVisitor} Stop to visit or for unused visitors the next visitor. */
	this.stop;
	/** @type {reach.road.Node} */
	this.srcNode;
	/** @type {reach.trans.Trip} */
	this.srcTrip;
	/** @type {number} Which stop along the trip this is. */
	this.srcPos;
	/** @type {number} */
	this.tripCount;
};

reach.inherit(reach.route.StopVisitor,reach.route.Visitor);

/** @type {reach.route.StopVisitor} */
reach.route.StopVisitor.freeItem=null;

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.trans.Stop} stop
  * @param {number} cost
  * @param {number} time
  * @param {reach.road.Node} srcNode
  * @param {reach.trans.Trip} srcTrip
  * @param {number} srcPos
  * @param {number} tripCount */
reach.route.StopVisitor.create=function(dijkstra,stop,cost,time,srcNode,srcTrip,srcPos,tripCount) {
	var self;

	self=reach.route.StopVisitor.freeItem;
	if(self) {
		reach.route.StopVisitor.freeItem=/** @type {reach.route.StopVisitor} */ self.stop;
	} else {
		self=new reach.route.StopVisitor();
	}

	self.stop=stop;
	self.cost=cost;
	self.time=time;
	self.srcNode=srcNode;
	self.srcTrip=srcTrip;
	self.srcPos=srcPos;
	self.tripCount=tripCount;

	if(stop.runId!=dijkstra.runId) {
		// If this node hasn't been seen before in this Dijkstra run,
		// it may still contain old routing data from a previous run. Remove the data.
		stop.runId=dijkstra.runId;
//		stop.costList=[];
//		stop.timeList=[];
		stop.cost=0;
		stop.srcNodeList=[];
		stop.srcTripList=[];
		stop.srcPosList=[];
	}

	return(self);
};

reach.route.StopVisitor.prototype.free=function() {
	this.stop=reach.route.StopVisitor.freeItem;
	reach.route.StopVisitor.freeItem=this;
	return(reach.route.Visitor.State.OK);
};

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.StopVisitor.prototype.visit=function(dijkstra) {
	var runId;
	var arrivalData;
	var testTime,departTime,arrivalTime;
	var waitTime;
	var lineNum,lineCount;
	var minuteMul,printMul;
	var cost;
	var line;
	/** @type {reach.trans.Trip} */
	var trip;
	var node;
	var stop;
	var pos;
	var first,last,mid,prevMid;
	var tripCount;
	var forward;
	var transferCost;

	stop=/** @type {reach.trans.Stop} */ this.stop;
	if(stop.disabled) return(this.free());

	forward=(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD);

	if(dijkstra.optimal) {
		// Check if time is different enough from previous entry.
//		if(stop.costList.length>1 && stop.timeList[0]+1*60*dijkstra.conf.timeDiv*60<=this.time) return;
		if(forward) {
			if(stop.cost && stop.time<this.time-dijkstra.conf.altRouteTimeSpan) return(this.free());
		} else {
			if(stop.cost && stop.time>this.time+dijkstra.conf.altRouteTimeSpan) return(this.free());
		}
	} else {
		// Exit if stop has already been reached with lower cost.
		if(stop.cost && stop.cost<=this.cost) return(this.free());
	}

	// Store current source node and stop as possible ways to reach this stop regardless of whether cost is better than found before.
	// This is to allow searching for alternative later departure times after initial Dijkstra is done.
	if(this.srcNode) stop.srcNodeList.push(this.srcNode);
	if(this.srcTrip) {
		stop.srcTripList.push(this.srcTrip);
		stop.srcPosList.push(this.srcPos);
	}

	// Exit if stop has already been reached with lower cost.
	if(stop.cost && stop.cost<=this.cost) return(this.free());

	// Not used for routing.
//	if(dijkstra.onVisitStop) dijkstra.onVisitStop(dijkstra,this);

	tripCount=this.tripCount;
	runId=dijkstra.runId;
	node=stop.node;
	if(node.runId!=runId || !node.cost || node.cost>this.cost+1) {
		// Increase cost by 1 when leaving the stop because zero-cost transitions are bad luck.
		dijkstra.found(reach.route.NodeVisitor.create(dijkstra,stop.node,this.cost+1,this.time,null,stop,0,tripCount));
	}

	if(forward) testTime=this.time+(tripCount>0?dijkstra.conf.minWait:dijkstra.conf.firstWait);
	else testTime=this.time;

	stop.cost=this.cost;
	// To handle minimum wait time while backtracking, include it in stop visit time.
	stop.time=testTime;

	lineCount=stop.lineList.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=stop.lineList[lineNum];
		pos=stop.posList[lineNum];
		reach.util.assert(line.stopList[pos]==stop,'StopVisitor.visit','Incorrect line or pos '+pos+', '+stop.name+' != '+line.stopList[pos].name+'.');
		// No point even checking for opportunities to enter buses at earlier stops if they've already been entered at later stops.
		// There's a tolerance of 1 stop because sometimes it might be possible to catch an earlier bus by walking to the previous stop
		// instead of a closer stop following it.
		if(line.runId==runId && ((forward && line.firstPos>pos+1) || (!forward && line.firstPos<pos-1))) continue;

		arrivalData=line.guessArrival(pos,testTime,dijkstra.conf);
		if(!arrivalData) continue;

		trip=arrivalData.trip;
		arrivalTime=arrivalData.time;

		waitTime=(arrivalTime-this.time)*dijkstra.timeDelta;
		reach.util.assert(waitTime>=0,'StopVisitor','Negative wait time! '+this.time+' '+arrivalTime);

		if(tripCount>0) cost=waitTime*dijkstra.conf.waitCostMul;
		else cost=waitTime*dijkstra.conf.initWaitCostMul;

		transferCost=trip.getTransferCost(pos,forward,dijkstra.conf);
		cost+=this.cost+transferCost;

//		if(line.runId!=runId || ((!forward || line.firstPos<=pos) && (!line.costList[pos] || line.costList[pos]>cost))) {
		if(line.runId!=runId || !line.costList[pos] || line.costList[pos]>cost) {
			// Fork.
			dijkstra.found(new reach.route.TripVisitor(dijkstra,trip,pos,cost,arrivalTime,this.stop,tripCount+1));
		}
	}

	return(this.free());
};
