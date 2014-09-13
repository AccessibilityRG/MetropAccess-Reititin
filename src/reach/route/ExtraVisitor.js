goog.provide('reach.route.ExtraVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.trans.ExtraLine');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra */
reach.route.ExtraVisitor=function(dijkstra,extraLine,pos,cost,time,srcNode,tripCount) {
	reach.route.Visitor.call(this);

	if(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD) {
		time+=globalFrequency*60*dijkstra.conf.timeDiv/2;
		cost+=globalFrequency*60*dijkstra.conf.timeDiv/2*dijkstra.conf.waitCostMul;
	}

	this.extraLine=extraLine;
	/** @type {number} */
	this.enterPos=pos;
	this.enterTime=time;
	/** @type {number} */
	this.pos=pos;
	/** @type {number} */
	this.cost=cost;
	/** @type {number} */
	this.time=time;
	/** @type {reach.road.Node} */
	this.srcNode=srcNode;

	/** @type {number} */
	this.tripCount=tripCount;

/*
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
*/
};

reach.inherit(reach.route.ExtraVisitor,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.ExtraVisitor.prototype.visit=function(dijkstra) {
	var cost;
	var pos;
	var loc;
	var runId;
	var forward;
	var node;
	var time,nextTime,timeDiff;
	var transitCost;

	time=this.time;
	cost=this.cost;
	pos=this.pos;
	loc=this.extraLine.ptList[pos];
//	console.log(this.extraLine.ptList[this.pos].name+'\t'+cost+'\t'+pos+'\t'+this.extraLine.ptList.length);

	transitCost=this.extraLine.getTransitCost(dijkstra.conf);
	if(!transitCost) return(reach.route.Visitor.State.OK);

	forward=(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD);

	runId=dijkstra.runId;
	node=loc.node;
	if(node.runId!=runId || !node.cost || node.cost>this.cost+1) {
		// Increase cost by 1 when leaving the stop because zero-cost transitions are bad luck.
		if(forward) {
			dijkstra.found(reach.route.NodeVisitor.create(dijkstra,node,this.cost+1,time,this.srcNode,null,0,this.tripCount,[this.extraLine,this.enterPos,pos,this.enterTime,time]));
		} else {
			timeDiff=globalFrequency*60*dijkstra.conf.timeDiv/2;
			dijkstra.found(reach.route.NodeVisitor.create(dijkstra,node,this.cost+1+timeDiff*dijkstra.conf.waitCostMul,time-timeDiff,this.srcNode,null,0,this.tripCount,[this.extraLine,pos,this.enterPos,time,this.enterTime]));
		}
	}

	if(forward && pos<this.extraLine.ptList.length-1) {
		nextTime=time+this.extraLine.durationList[pos]*60*dijkstra.conf.timeDiv;
		pos++;
	} else if(!forward && pos>0) {
		pos--;
		nextTime=time-this.extraLine.durationList[pos]*60*dijkstra.conf.timeDiv;
	} else return(reach.route.Visitor.State.OK);

	this.cost+=(nextTime-time)*dijkstra.timeDelta*transitCost;
/*
	if(forward && pos<this.extraLine.ptList.length-1) {
		if(this.pos==this.enterPos) {
			nextTime+=globalFrequency*60*dijkstra.conf.timeDiv/2;
			this.cost+=globalFrequency*60*dijkstra.conf.timeDiv/2*dijkstra.conf.waitCostMul;
		}
	}
*/
	this.pos=pos;
	this.cost++;
	this.time=nextTime;

	dijkstra.found(this);

	return(reach.route.Visitor.State.OK);

/*
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
*/
};
