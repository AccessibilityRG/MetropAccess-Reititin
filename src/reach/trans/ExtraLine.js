goog.provide('reach.trans.ExtraLine');

/** @constructor
  * @param {Array.<reach.loc.Outdoor>} extraPtList */
reach.trans.ExtraLine=function(extraPtList) {
	/** @type {number} */
	this.runId=0;
	/** @type {Array.<number>} */
	this.costList=[];
	/** @type {Array.<number>} */
	this.timeList=[];
	/** @type {Array.<reach.road.Node>} */
	this.srcNodeList=[];
	this.ptList=extraPtList;
	this.durationList=[];

	/** @type {number} Number of departures around search start time, to evaluate line niceness. */
	this.departureCount=0;
	this.freq=3;
};

/** @param {reach.route.Conf} conf
  * @return {number} */
reach.trans.ExtraLine.prototype.getTransitCost=function(conf) {
	var id;

	id=''+this.routeId;

	if(conf.transitJoreCost) {
		for(var i in conf.transitJoreCost) {
			if(id && id.substr(0,i.length)==i) return(conf.transitJoreCost[i]);
		}
	}

	return(conf.transitCost);
};

