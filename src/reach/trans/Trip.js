goog.provide('reach.trans.Trip');
goog.require('reach.route.Conf');

/** @constructor
  * @param {reach.trans.Line} line
  * @param {{line:reach.trans.Line,mode:number,longCode:?string,shortCode:?string,name:?string}=} key */
reach.trans.Trip=function(line,key) {
	/** @type {{line:reach.trans.Line,mode:number,longCode:?string,shortCode:?string,name:?string}} */
	this.key=key?key:{
		line:line,
		mode:0,
		longCode:null,
		shortCode:null,
		name:null
	};

	/** @type {Array.<number>|Uint32Array} Unit: minutes. */
	this.deltaList;

	/** @type {number} Unit: minutes. */
	this.startTime;
	/** @type {number} Unit: minutes. */
	this.duration;
	/** @type {number} */
	this.num;
};

/** @enum {number} */
reach.trans.Trip.Mode={
	BUS:0,
	TRAM:1,
	SUBWAY:2,
	TRAIN:3,
	BOAT:4
};

/** @param {Object.<string,*>|boolean} row
  * @param {Array.<string>} data
  * @param {number} valid */
reach.trans.Trip.prototype.importKalkati=function(row,data,valid) {
	var first,last,duration;
	var mins,prevMins;
	var stop,prevStop;
	var dataLen;
	var i,l;

	this.id=+row['servid'];
	this.key.mode=row['mode'];
	this.key.longCode=row['long'];
	this.key.shortCode=row['short'];
	this.key.name=row['name'];
	this.validity=valid;

	dataLen=data.length;

	// Read departure time from first stop in hhmm format and convert to minutes from midnight.
	first=+data[1];
	first=~~(first/100)*60+(first%100);

	// Read departure time from last stop in hhmm format and convert to minutes from midnight.
	last=+data[dataLen-1];
	last=~~(last/100)*60+(last%100);

	duration=last-first;
	if(duration<0) {
		// If arrival time at last stop is before first stop, it's probably the next day so check if the difference is over 12 hours.
		if(duration<-12*60) duration+=24*60;
		// If the difference is smaller, there must be an error and not much we can do.
		else duration=0;
	}
	if(duration>12*60) duration=0;

	this.startTime=first;
	this.duration=duration;

	prevStop=this.key.line.stopList[0];
	prevMins=first;
	l=data.length;
	for(i=3;i<dataLen;i+=2) {
		stop=this.key.line.stopList[(i-1)>>1];
		mins=+data[i];
		mins=~~(mins/100)*60+(mins%100);
		duration=mins-prevMins;

		if(duration<0) {
			// If arrival time at previous stop is before current stop, it's probably the next day so check if the difference is over 12 hours.
			if(duration<-12*60) duration+=24*60;
			// If the difference is smaller, there must be an error and not much we can do.
			else duration=0;
		}
		if(duration>12*60) duration=0;

		prevStop.addFollower(stop,duration);

		prevStop=stop;
		prevMins=mins;
	}
};

/** @param {number} stopNum
  * @return {number} Minutes from midnight. */
reach.trans.Trip.prototype.guessArrival=function(stopNum) {
	var statMul;
	var stopCount;
	var totalMeanDuration,totalVarianceSum;
	var correction,delta;
	var line;

	line=this.key.line;
	stopCount=line.stopList.length;
	totalMeanDuration=line.meanDuration[stopCount-1];
	totalVarianceSum=line.variance[stopCount-1];
	statMul=line.lineSet.city.statMul;

	if(totalVarianceSum==0) correction=0;
	else correction=(this.duration*statMul-totalMeanDuration)*line.variance[stopNum]/totalVarianceSum;

	if(this.deltaList && (delta=(/** @type {Array.<number>} */ this.deltaList)[stopNum>>2])) delta=((delta>>>((stopNum&3)*8))&255)-128;
	else delta=0;

//if(dbg && this.deltaList) console.log(this.startTime+'\t'+line.meanDuration[stopNum]+'\t'+correction+'\t'+delta+'\t'+this.duration+'\t'+statMul+'\t'+totalMeanDuration+'\t'+line.variance[stopNum]+'\t'+totalVarianceSum+'\t'+this.deltaList);

	return(this.startTime+~~((line.meanDuration[stopNum]+correction)/statMul+0.5)+delta);
};

/** @param {number} pos
  * @param {boolean} enter
  * @param {reach.route.Conf} conf
  * @return {number} */
reach.trans.Trip.prototype.getTransferCost=function(pos,enter,conf) {
	var transferCost;

	transferCost=0;

	if(enter) {
		if(conf.enterModeCost) transferCost=conf.enterModeCost[this.key.mode];
		if(!transferCost) transferCost=conf.enterCost;
	} else {
		if(conf.leaveModeCost) transferCost=conf.leaveModeCost[this.key.mode];
		if(!transferCost) transferCost=conf.leaveCost;
	}

	transferCost*=60*conf.timeDiv*(1/2+1/(2+2*this.key.line.stopList[pos].departureCount/conf.niceDepartures));
	transferCost=~~(transferCost+0.5);
	if(transferCost==0) transferCost=1;

	return(transferCost);
};

/** @param {reach.route.Conf} conf
  * @return {number} */
reach.trans.Trip.prototype.getTransitCost=function(conf) {
	if(conf.transitJoreCost) {
		for(var i in conf.transitJoreCost) {
			if(this.key.longCode && this.key.longCode.substr(0,i.length)==i) return(conf.transitJoreCost[i]);
		}
	}

	if(conf.transitModeCost) {
//console.log(this.key.mode+' '+conf.transitModeCost[this.key.mode]);
		if(conf.transitModeCost.hasOwnProperty(this.key.mode)) return(conf.transitModeCost[this.key.mode]);
	}

//console.log(conf.transitCost);
	return(conf.transitCost);
};

/** @param {boolean} enter
  * @param {reach.route.Conf} conf
  * @return {number} */
reach.trans.Trip.prototype.getTransferTime=function(enter,conf) {
	if(enter) {
		if(conf.enterModeTime && conf.enterModeTime.hasOwnProperty(this.key.mode)) return(conf.enterModeTime[this.key.mode]);
		else return(conf.enterTime);
	} else {
		if(conf.leaveModeTime && conf.leaveModeTime.hasOwnProperty(this.key.mode)) return(-conf.leaveModeTime[this.key.mode]);
		else return(-conf.leaveTime);
	}
};
