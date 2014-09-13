goog.provide('reach.route.Conf');
goog.require('reach.road.Way');

/** @constructor
  * @param {reach.trans.City} city */
reach.route.Conf=function(city) {
	/** @type {reach.core.Date} */
	this.date;
	/** @type {string} */
	this.dateText;
	/** @type {number} Number of TU (Time Units) per one second, defining accuracy. */
	this.timeDiv=10;
	/** @type {number} Maximum travel cost. Unit: 1/timeDiv seconds. */
	this.maxCost=this.timeDiv*60*60* 2;	// 2 hours.
	/** @type {number} Sentinel value representing infinite cost. Unit: 1/timeDiv seconds. */
//	this.infCost=this.timeDiv*60*60* 24;	// 24 hours.
	this.infCost=this.maxCost*2;	// Any number bigger than maxCost.
	/** @type {number} Maximum difference at each stop between optimal (latest) arrival time and earliest possible arrival time.
		Unit: 1/timeDiv seconds. */
	this.altRouteTimeSpan=this.timeDiv*60*60* 1;	// 1 hour. This should be bigger than the maximum interval of any transit line.

	this.srid='EPSG:4326';	// Default projection, EPSG 4326 is WGS84.
	this.outPath='out.csv';

	/** @type {number} */
	this.nodeNearMax=25;
	/** @type {number} Number of nearby stops to bound new locations to. */
	this.stopNearMax=5;
	/** @type {number} */
	this.stopNearMin=3;
	/** @type {number} Number of times to try of less than stopNearMin stops found. */
	this.bindRetryMax=3;

	// Note: when bracketing for shortest travel time, brackets should be optimal Golomb rulers (maybe multiplied by a constant
	// to extend the range) for best results, for example:
	// 0 3 12 18 (biggest gap 9, biggest error 12 for 30min interval)
	// 0 4 14 16 22 (biggest gap 10, missing delta 20, biggest error 10 for 30min interval).
	// 0 2  8 18 22 (biggest gap 10, missing delta 12, biggest error 10 for 30min interval).
	/** @type {Array.<number>} List of start times for routing, default to 8 AM. */
	this.timeList=[
		(8*60+ 0)*60*this.timeDiv
//		(8*60+ 3)*60*this.timeDiv,
//		(8*60+12)*60*this.timeDiv,
//		(8*60+18)*60*this.timeDiv
/*
		(8*60+2)*60*this.timeDiv,
		(8*60+4)*60*this.timeDiv,
		(8*60+6)*60*this.timeDiv,
		(8*60+8)*60*this.timeDiv,
		(8*60+10)*60*this.timeDiv
*/
	];

//	this.timeList=[];for(var i=0;i<60;i+=2) this.timeList.push((8*60+i)*60*this.timeDiv);

	/** @type {number} Walking speed. Unit: TU/m */
	this.walkTimePerM=60*this.timeDiv/ 70	// 70 m/min
//	this.walkTimePerM=3.6*this.timeDiv/ 5;	// 5 km/h
	/** @type {number} Biking speed. Unit: TU/m */
	this.bikeTimePerM=3.6*this.timeDiv/ 15;	// 15 km/h
	/** @type {number} */
	this.midWalkTimePerM=this.walkTimePerM;
	/** @type {number} */
	this.midBikeTimePerM=this.bikeTimePerM;
	/** @type {number} */
	this.startWalkTimePerM=this.walkTimePerM;
	/** @type {number} */
	this.startBikeTimePerM=this.bikeTimePerM;
	/** @type {number} */
	this.endWalkTimePerM=this.walkTimePerM;
	/** @type {number} */
	this.endBikeTimePerM=this.bikeTimePerM;

	/** @type {boolean} */
	this.saveTrack=true;

	/** @type {Array.<{way:reach.road.Way,pos:number,time:number,cost:number}>} */
	this.startRoadList=[];
	/** @type {Array.<{node:reach.road.Node,time:number,cost:number}>} */
	this.startWayNodeList=[];
	/** @type {Array.<{node:reach.road.Node,time:number,cost:number}>} */
	this.startGraphNodeList=[];
	/** @type {Array.<{stop:reach.trans.Stop,time:number,cost:number}>} */
	this.startStopList=[];
	/** @type {Array.<reach.road.Node>} */
	this.endGraphNodeList=[];
	/** @type {Array.<reach.route.Visitor>} */
	this.visitorList=null;

	/** @type {number} Extra cost to travel between stops, to avoid useless travel that doesn't cause other harm. Unit: 1/timeDiv seconds. */
	this.transitCostAdd=1;
	/** @type {number} Unit: multiplication factor. */
	this.transitCost=1;
	/** @type {?Object.<number,number>} Unit: multiplication factor. */
	this.transitModeCost=null;
	/** @type {?Object.<string,number>} Unit: multiplication factor. */
	this.transitJoreCost=null;
	/** @type {number} Unit: multiplication factor. */
	this.walkCostMul=1.2;
	/** @type {number} Unit: multiplication factor. */
	this.waitCostMul=1;
	/** @type {number} Do not touch. Unit: multiplication factor. */
	this.initWaitCostMul=this.waitCostMul;
	/** @type {number} Cost for departing later when bracketing. Unit: multiplication factor. */
	this.bracketWaitCostMul=2/60;
//	this.initWaitCostMul=0.25;
	/** @type {number} Unit: 1/timeDiv seconds. Don't set to zero or routes will have duplicate nodes in corners! */
	this.walkTurnCost=1;
	/** @type {number} Minimum wait time at transport stops. Unit: 1/timeDiv seconds. */
	this.minWait=this.timeDiv*60* 3;	// 3 minutes.
	/** @type {number} Wait time at first transport stop along route. */
	this.firstWait=this.timeDiv*60* 0;

	/** @type {number} Unit: minutes. */
	this.enterCost=3;
	/** @type {?Object.<number,number>} */
	this.enterModeCost=null;

	/** @type {number} Unit: minutes. */
	this.enterTime=0;
	/** @type {?Object.<number,number>} */
	this.enterModeTime=null;

	/** @type {number} Unit: minutes. */
	this.leaveCost=0;
	/** @type {?Object.<number,number>} */
	this.leaveModeCost=null;

	/** @type {number} Unit: minutes. */
	this.leaveTime=0;
	/** @type {?Object.<number,number>} */
	this.leaveModeTime=null;

	/** @type {number} Unit: 1/timeDiv seconds. */
//	this.leaveTime=this.timeDiv*60* 0 + 1;	// 0 minutes, 1/timeDiv seconds.
	/** @type {number} How many departures within an hour to make a stop one point nicer for transfers.
		(decreasing stop's enterCost and leaveCost by 25%) */
	this.niceDepartures=25;
	/** @type {number} Time span from start time to search for departures while evaluating stop niceness. Unit: minutes. */
	this.niceDepartureSpan=60;

	/** @type {number} Maximum walking distance to search for nearby stops or direct routes to targets. Unit: meters.
		If this is too low (1000 is too low), then it often suggests swimming out of an island even though there's a bridge. */
	this.maxWalk=2000;

	/** @type {boolean} */
	this.forward=true;

	/** @type {number} Maximum great circle distance to search for a road nearest to a point. Unit: meters. */
	this.snapDist=200;

	// snapDist must be under maxWalk because only tiles closer than maxWalk will be loaded
	// when binding input points to the road network.
	if(this.snapDist>this.maxWalk) this.snapDist=this.maxWalk;

	// Visualization options.
	/** @type {number} */
	this.colorInterval=300;
};

/** @param {Object.<string,number>} conf */
reach.route.Conf.prototype.read=function(conf) {
	var timeNum,timeCount;
	var d;

	if(conf['date']) this.dateText=conf['date'];
	if(conf.hasOwnProperty('maxCost')) this.maxCost=60*this.timeDiv*conf['maxCost'];

	if(conf['srid']) this.srid=conf['srid'];

	if(searchConf['time']) {
		this.timeList=[];
		timeCount=(/** @type {Array.<string>} */ (searchConf['time'])).length;
		for(timeNum=0;timeNum<timeCount;timeNum++) {
			d=(/** @type {string} */ searchConf['time'][timeNum]).split(':');
			this.timeList[timeNum]=((+d[0])*60+(+d[1]))*60*this.timeDiv;
		}
	}

	if(conf.hasOwnProperty('walkSpeed')) this.midWalkTimePerM=60*this.timeDiv/conf['walkSpeed'];
	if(conf.hasOwnProperty('bikeSpeed')) this.midBikeTimePerM=60*this.timeDiv/conf['bikeSpeed'];
	if(conf.hasOwnProperty('startWalkSpeed')) this.startWalkTimePerM=60*this.timeDiv/conf['startWalkSpeed'];
	if(conf.hasOwnProperty('startBikeSpeed')) this.startBikeTimePerM=60*this.timeDiv/conf['startBikeSpeed'];
	if(conf.hasOwnProperty('endWalkSpeed')) this.endWalkTimePerM=60*this.timeDiv/conf['endWalkSpeed'];
	if(conf.hasOwnProperty('endBikeSpeed')) this.endBikeTimePerM=60*this.timeDiv/conf['endBikeSpeed'];

	this.walkTimePerM=this.midWalkTimePerM;
	this.bikeTimePerM=this.midBikeTimePerM;

	if(conf.hasOwnProperty('transCost')) this.transitCost=conf['transCost'];
	if(conf.hasOwnProperty('transModeCost')) this.transitModeCost=/** @type {?Object.<number,number>} */ conf['transModeCost'];
	if(conf.hasOwnProperty('transJoreCost')) this.transitJoreCost=/** @type {?Object.<string,number>} */ conf['transJoreCost'];
	if(conf.hasOwnProperty('walkCost')) this.walkCostMul=conf['walkCost'];
	if(conf.hasOwnProperty('waitCost')) this.waitCostMul=conf['waitCost'];
	if(conf.hasOwnProperty('initCost')) this.initWaitCostMul=conf['initCost'];
	if(conf.hasOwnProperty('minWait')) this.minWait=60*this.timeDiv*conf['minWait'];
	if(conf.hasOwnProperty('firstWait')) this.firstWait=60*this.timeDiv*conf['firstWait'];

	if(conf.hasOwnProperty('enterCost')) this.enterCost=conf['enterCost'];
	if(conf.hasOwnProperty('leaveCost')) this.leaveCost=conf['leaveCost'];
	if(conf.hasOwnProperty('enterModeCost')) this.enterModeCost=/** @type {?Object.<number,number>} */ conf['enterModeCost'];
	if(conf.hasOwnProperty('leaveModeCost')) this.leaveModeCost=/** @type {?Object.<number,number>} */ conf['leaveModeCost'];

	if(conf.hasOwnProperty('leaveTime')) this.leaveTime=this.timeDiv*conf['leaveTime'];
	if(conf.hasOwnProperty('maxWalk')) this.maxWalk=conf['maxWalk'];
	if(conf.hasOwnProperty('backwards')) this.forward=!conf['backwards'];

	if(conf.hasOwnProperty('snapDist')) this.snapDist=conf['snapDist'];
};
