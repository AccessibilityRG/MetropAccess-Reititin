goog.provide('reach.trans.Line');
goog.require('reach.trans.Stop');
goog.require('reach.trans.Trip');
goog.require('reach.util');

// TODO: Each line should have a table of transport modes used, to allow quick filterting when some transport modes are disallowed.
/** @constructor
  * @param {reach.trans.LineSet} lineSet */
reach.trans.Line=function(lineSet) {
	/** @type {reach.trans.LineSet} */
	this.lineSet=lineSet;
	/** @type {number} */
	this.id=0;

	/** @type {Array.<reach.trans.Stop>} */
	this.stopList=[];
	/** @type {Array.<reach.trans.Trip>} */
	this.tripList=[];

	/** @type {Object.<number,Object.<string,number>>} Used in compression error delta calculation to map departure times to trip numbers. */
	this.tripFirstTbl;

	/** @type {Object.<number,Array.<reach.trans.Trip>>} */
	this.tripListTbl={};
	/** @type {Array.<number>} Average time in minutes from first stop to reach each stop along the line. */
	this.meanDuration=[0];
	/** @type {Array.<number>} */
	this.variance=[0];

	/** @type {Object.<number,number>} Used to filter out line if none of its trips use an allowed mode of transportation. */
	this.transModeTbl={};

	/** @type {number} */
	this.runId=0;
	/** @type {number} */
	this.firstPos=0;
	/** @type {Array.<number>} */
	this.costList=[];
	/** @type {Array.<number>} */
	this.timeList=[];
	/** @type {Array.<number>} */
//	this.srcPosList=[];
	/** @type {Array.<reach.trans.Stop>} */
	this.srcStopList=[];

	/** @type {Array.<number>} */
	this.distList=[];

	/** @type {number} Number of departures around search start time, to evaluate line niceness. */
	this.departureCount=0;
};

reach.trans.Line.prototype.calcStats=function() {
	var stopNum,stopCount;
	var followerNum;
	var stop,prevStop;
	var duration,variance;
	var stats;

	stopCount=this.stopList.length;
	stop=this.stopList[0];

	duration=0;
	variance=0;

	for(stopNum=1;stopNum<stopCount;stopNum++) {
		prevStop=stop;
		stop=this.stopList[stopNum];

		followerNum=prevStop.followerTbl[stop.id];
		stats=prevStop.statsTo[followerNum];
//		reach.util.assert(prevStop.followerList[followerNum]==stop,'calcStats','Error in follower list.');

		duration+=stats.mean;
		variance+=stats.variance;

		this.meanDuration[stopNum]=duration;
		this.variance[stopNum]=variance;
	}
};

/*
reach.trans.Line.prototype.dump=function(valid) {
	// Has to be fixed to use tripListTbl instead of tripList!
	var statMul;
	var stopNum,stopCount;
	var i,tripNum,tripCount;
	var stop;
	var trip;
	var name;
	var txt;
	var tripList;

	statMul=this.lineSet.city.statMul;
	stopCount=this.stopList.length;

	tripList=this.tripListTbl[valid];
	trip=tripList[0];
	console.log(trip.key.shortCode+'\t'+trip.key.name+'\t'+trip.key.longCode);
	console.log((this.meanDuration[stopCount-1]/statMul)+' +- '+(this.variance[stopCount-1]/statMul));

	txt=new Array(32).join(' ');

	i=0;
	tripCount=tripList.length;
	for(tripNum=0;tripNum<tripCount;tripNum++) {
		trip=tripList[tripNum];
//		if(!(this.lineSet.validList[trip.validity][1]&32)) continue;

		name=''+trip.duration;
//		tripList[i++]=trip;

		txt+=new Array(7-name.length).join(' ')+name;
	}

	console.log(txt);

	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.stopList[stopNum];
		name=stop.name.replace(/[\u00c4\u00c5\u00d6\u00e4\u00e5\u00f6]/g,'?');
		txt=name+(new Array(32-name.length).join(' '));

		tripCount=tripList.length;
		for(tripNum=0;tripNum<tripCount;tripNum++) {
			trip=tripList[tripNum];
//			txt+=' '+reach.util.formatMins(trip.startTime+~~((this.meanDuration[stopNum]+(trip.duration*statMul-this.meanDuration[stopCount-1])*this.variance[stopNum]/this.variance[stopCount-1])/statMul+0.5));
			txt+=' '+reach.util.formatMins(trip.guessArrival(stopNum));
		}

		console.log(txt);
	}
};
*/

/** @param {number} departTime Unit: minutes from midnight.
  * @return {number} */
reach.trans.Line.prototype.findDeparture=function(departTime) {
	var first,last,mid;
	var trip;

	mid=0;
	first=0;
	last=this.tripList.length-1;
	// Binary search to find when the next bus of this line arrives.
	while(first<=last) {
		mid=(first+last)>>1;
		trip=this.tripList[mid];
		if(trip.startTime<departTime) first=mid+1;
		else if(trip.startTime>departTime) last=mid-1;
		else break;
	}

	return(mid);
};

/** @param {number} time
  * @param {number} stopNum
  * @param {number} tripNum
  * @param {number} arrivalTime
  * @param {number} delta
  * @param {number} last
  * @param {reach.route.Conf} conf
  * @return {Array.<number>} */
reach.trans.Line.prototype.nextArrival=function(time,stopNum,tripNum,arrivalTime,delta,last,conf) {
	var prevTime;
	var prevNum;
	var trip;
	var transferTime;

	prevNum=tripNum;
	prevTime=arrivalTime;
	tripNum+=delta;

	for(;tripNum>=0 && tripNum<=last;tripNum+=delta) {
		trip=this.tripList[tripNum];
		if(!trip.getTransitCost(conf)) continue;
		transferTime=trip.getTransferTime(conf.forward,conf);

		arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
		if((time+transferTime-arrivalTime)*delta>0) {
			prevNum=tripNum;
			prevTime=arrivalTime;
		} else return([tripNum,arrivalTime,prevNum,prevTime]);
	}

	return([tripNum,arrivalTime,prevNum,prevTime]);
}

/** @param {number} stopNum   
  * @param {number} time   
  * @param {reach.route.Conf} conf   
  * @return {?{trip:reach.trans.Trip,time:number}} */
reach.trans.Line.prototype.guessArrival=function(stopNum,time,conf) {
	/** @type {reach.trans.Line} */
	var self=this;
	var departTime,arrivalTime,prevTime;
	var trip;
	var tripNum,last;
	var forward;
	var transitCost;
	var transferTime;
	var prevNum;
	var near;

	if(this.tripList.length==0) return(null);

	forward=conf.forward;
	departTime=time/(60*conf.timeDiv)-this.meanDuration[stopNum]/this.lineSet.city.statMul;

	tripNum=this.findDeparture(departTime);
	trip=this.tripList[tripNum];
	// These crazy variables are here because technically different trips on the same could have different modes of transport...
	// Should get rid of them and split the line to two different ones if something that insane happens in the data.
	transitCost=trip.getTransitCost(conf);
	transferTime=trip.getTransferTime(forward,conf);

	arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
	last=this.tripList.length-1;

	prevNum=tripNum;
	prevTime=arrivalTime;

	if((forward && arrivalTime>time+transferTime) || (!forward && arrivalTime<time+transferTime) || !transitCost) {
		// Check if there's an even earlier arrival.
		near=this.nextArrival(time+transferTime,stopNum,tripNum,prevTime,forward?-1:1,last,conf);
		tripNum=near[2];
		arrivalTime=near[3];

		trip=this.tripList[tripNum];
		transitCost=trip.getTransitCost(conf);
		transferTime=trip.getTransferTime(forward,conf);
	}

	if((forward && arrivalTime<time+transferTime) || (!forward && arrivalTime>time+transferTime) || !transitCost) {
		// The transport went already so find a later arrival.
		near=this.nextArrival(time+transferTime,stopNum,tripNum,prevTime,forward?1:-1,last,conf);
		tripNum=near[0];
		arrivalTime=near[1];
		if(tripNum<0 || tripNum>last) return(null);

		trip=this.tripList[tripNum];
		transitCost=trip.getTransitCost(conf);
		transferTime=trip.getTransferTime(forward,conf);
	}

	if((forward && arrivalTime<time+transferTime) || (!forward && arrivalTime>time+transferTime) || !transitCost) return(null);

	return({trip:trip,time:arrivalTime,tripNum:tripNum});
};
