goog.provide('reach.route.TripVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.trans.Line');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.trans.Trip} trip
  * @param {number} pos
  * @param {number} cost
  * @param {number} time
  * @param {reach.trans.Stop} srcStop
  * @param {number} tripCount Number of trips taken so far on the route. */
reach.route.TripVisitor=function(dijkstra,trip,pos,cost,time,srcStop,tripCount) {
	var line;

	reach.route.Visitor.call(this);
	line=trip.key.line;

	/** @type {reach.trans.Trip} */
	this.trip=trip;
	/** @type {reach.trans.Line} */
	this.line=line;
	/** @type {number} */
	this.pos=pos;
	/** @type {number} */
	this.cost=cost;
	/** @type {number} */
	this.pendingCost;
	/** @type {number} */
	this.time=time;
	/** @type {reach.trans.Stop} */
	this.srcStop=srcStop;

	/** @type {number} */
	this.tripCount=tripCount;

	if(line.runId!=dijkstra.runId) {
		// If this line hasn't been seen before in this Dijkstra run,
		// it may still contain old routing data from a previous run. Remove the data.
		line.runId=dijkstra.runId;
		line.firstPos=pos;
		line.costList=[];
		line.timeList=[];
//		line.srcPosList=[];
		line.srcStopList=[];
	}
globalTripVisitors++;
};

var globalTripVisitors=0;

reach.inherit(reach.route.TripVisitor,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.TripVisitor.prototype.visit=function(dijkstra) {
	var runId;
	var printMul;
	var line,trip,stop;
	var time,nextTime;
	var cost,pendingCost;
	var waitTime;
	var pos;
	var tripCount;
	var transferCost;
	var transitCost;
	var forward;

	line=this.line;
	pos=this.pos;
	cost=this.cost;

	if(line.costList[pos] && line.costList[pos]<=cost) return(reach.route.Visitor.State.OK);

	time=this.time;
	trip=this.trip;
	tripCount=this.tripCount;

	transitCost=trip.getTransitCost(dijkstra.conf);
	if(!transitCost) return(reach.route.Visitor.State.OK);

//	forward=dijkstra.conf.forward;
	forward=(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD);
	runId=dijkstra.runId;
	printMul=dijkstra.conf.timeDiv*60;
	stop=line.stopList[pos];

	line.costList[pos]=cost;
	line.timeList[pos]=time;
	if(this.srcStop) line.srcStopList[pos]=this.srcStop;
//	else line.srcPosList[pos]=pos-1;

//	if(dijkstra.onVisitLine) dijkstra.onVisitLine(dijkstra,this);

//	if(stop.runId!=runId || stop.costList.length==0 || stop.costList[0]>cost+modeCost) {
	if(this.srcStop!=stop) {
		transferCost=trip.getTransferCost(pos,!forward,dijkstra.conf);
		// Fork.
		if(forward) {
			waitTime=-trip.getTransferTime(false,dijkstra.conf);
			transferCost+=waitTime*dijkstra.conf.waitCostMul;
		} else {
			waitTime=-trip.getTransferTime(true,dijkstra.conf)-dijkstra.conf.minWait;
			transferCost-=waitTime*dijkstra.conf.waitCostMul;
		}
		dijkstra.found(reach.route.StopVisitor.create(dijkstra,stop,cost+transferCost,time+waitTime,null,trip,pos,tripCount));
	}

	pendingCost=this.pendingCost;
	if(!pendingCost) pendingCost=0;

	if(forward && pos<line.stopList.length-1) {
		pos++;
		nextTime=trip.guessArrival(pos)*printMul;
		if(nextTime<time) {
			// Arrival at next stop can happen in the past if original schedule data has errors or if compression delta
			// has kicked in so original times were 1 2 2 4, prediction was 1 3 4 4 and after applying delta 1 3 2 4.
			// TODO: best way to handle is to disable next stop if too far in the past, and detect also erroneously
			// late single arrivals in the schedule.
			if(time-nextTime>2*60*dijkstra.conf.timeDiv) {
				reach.util.assert(false,'TripVisitor.visit','Too much time travel for '+trip.key.longCode+' from '+stop.name+': '+reach.util.formatMins(time/60/dijkstra.conf.timeDiv)+' and '+reach.util.formatMins(nextTime/60/dijkstra.conf.timeDiv));
				return(reach.route.Visitor.State.OK);
			}
			pendingCost-=(time-nextTime)*dijkstra.timeDelta*transitCost;
			nextTime=time;
		}
	} else if(!forward && pos>0) {
		pos--;
		nextTime=trip.guessArrival(pos)*printMul;
		if(nextTime>time) {
			// Arrival at previous stop can happen in the future (see above case).
			if(nextTime-time>2*60*dijkstra.conf.timeDiv) {
				reach.util.assert(false,'TripVisitor.visit','Too much time travel for '+trip.key.longCode+' from '+stop.name+': '+reach.util.formatMins(time/60/dijkstra.conf.timeDiv)+' and '+reach.util.formatMins(nextTime/60/dijkstra.conf.timeDiv));
				return(reach.route.Visitor.State.OK);
			}
			pendingCost-=(nextTime-time)*dijkstra.timeDelta*transitCost;
			nextTime=time;
		}
	} else return(reach.route.Visitor.State.OK);

	pendingCost+=(nextTime-time)*dijkstra.timeDelta*transitCost;
	if(pendingCost<0) {
		pendingCost=0;
		this.pendingCost=pendingCost;
	}

	cost+=pendingCost+dijkstra.conf.transitCostAdd;
//	if(!trip.longCode) console.log('Will visit '+pos+' at '+reach.util.formatMins((nextTime)/printMul)+' with cost '+reach.util.formatMins((cost)/printMul)+' '+reach.util.formatMins(time/printMul)+'.');
	if(!line.costList[pos] || line.costList[pos]>cost) {
		this.pos=pos;
		this.cost=cost;
		this.time=nextTime;
		this.srcStop=null;
		dijkstra.found(this);
	}

	return(reach.route.Visitor.State.OK);
};
