goog.provide('reach.route.TripReVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.trans.Stop} stop
  * @param {number} cost
  * @param {number} dataNum */
reach.route.TripReVisitor=function(dijkstra,stop,cost,dataNum) {
	reach.route.Visitor.call(this);
	/** @type {reach.trans.Stop} */
	this.stop=stop;
	/** @type {number} */
	this.cost=cost;
	/** @type {number} */
	this.dataNum=dataNum;
};

//reach.route.TripReVisitor.prototype=new reach.route.Visitor();
reach.inherit(reach.route.TripReVisitor,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.TripReVisitor.prototype.visit=function(dijkstra) {
	var cost;
	var enterCostTbl,leaveCostTbl;
	var modeCost;
	var stop,prevStop;
	var data;
	var trip;
	var line;
	var transCost;
	var firstTime,visitTime,waitTime;
	var pos;

	stop=this.stop;
	data=stop.reverseDataList[this.dataNum];
//console.log(this.cost+'\t'+data.cost+'\t'+data.trip.key.longCode);
	if(this.cost>data.cost) return(reach.route.Visitor.State.OK);

	trip=data.trip;
	pos=data.pos;

	line=trip.key.line;
	transCost=dijkstra.conf.getTransCost(trip);

	enterCostTbl=dijkstra.conf.enterModeCost;
	leaveCostTbl=dijkstra.conf.leaveModeCost;
	if(!enterCostTbl) enterCostTbl={};
	if(!leaveCostTbl) leaveCostTbl={};

	firstTime=data.time;
	while(pos--) {
		visitTime=trip.guessArrival(pos,1)*60*dijkstra.conf.timeDiv;
		prevStop=line.stopList[pos];

		cost=this.cost+(firstTime-visitTime)*transCost;

		// Add transfer cost.
		modeCost=enterCostTbl[trip.key.mode];
		if(!modeCost) modeCost=dijkstra.conf.enterCost;
/*
try {
		modeCost*=60*dijkstra.conf.timeDiv*(1/2+1/(2+2*prevStop.departureCount/dijkstra.conf.niceDepartures));
} catch(e) {
console.log(pos+'\t'+line.stopList.length+'\t'+stop.runId+'\t'+dijkstra.runId);
throw('foo');
}
*/
		cost+=modeCost;

//		if(prevStop.runId!=dijkstra.runId || !prevStop.cost || prevStop.cost>cost) {
// Test on following line allows entering transit only where it was entered on the first Dijkstra run.
// It speeds up calculation a lot but gives slightly worse results.
// TODO: Make this a command line option:
// Do only first dijkstra run / Get transit entrypoints only from first Dijkstra run / Free entry points / Full backwards Dijkstra (very slow)
//if(line.srcStopList[pos]) {
			// Minimum wait time before boarding the vehicle.
			waitTime=prevStop.time-prevStop.node.time;
			//console.log('\t'+reach.util.formatSecs(visitTime/dijkstra.conf.timeDiv)+'\t'+prevStop.name+'\t'+prevStop.cost+'\t'+(cost+waitTime*dijkstra.conf.waitCostMul)+'\t'+cost+'\t'+waitTime+'\t'+prevStop.runId+'\t'+dijkstra.runId);
			dijkstra.found(new reach.route.StopReVisitor(dijkstra,prevStop,cost+waitTime*dijkstra.conf.waitCostMul,visitTime-waitTime,stop,this.dataNum,null,null));
//}
//		}
	}

	return(reach.route.Visitor.State.OK);
};
