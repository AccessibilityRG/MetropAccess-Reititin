goog.provide('reach.trans.Stop');
goog.require('reach.road.Node');
goog.require('reach.util');
goog.require('reach.MU');
goog.require('reach.data.QuadTreeItem');

/** @constructor
  * @implements {reach.data.QuadTreeItem}
  * @param {number} id
  * @param {string} origId
  * @param {string} name
  * @param {reach.MU} ll */
reach.trans.Stop=function(id,origId,name,ll) {
	/** @type {number} */
	this.id=id;
	/** @type {string} */
	this.origId=origId;
	/** @type {string} */
	this.name=name;
	/** @type {number} */
	this.nameId;
	/** @type {reach.MU} */
	this.ll=ll;

	// Links connecting stop to transit network.
	/** @type {Array.<reach.trans.Line>} Transit lines passing by this stop. */
	this.lineList=[];
	/** @type {Array.<number>} How many stops are passed along each transit line before reaching this stop. */
	this.posList=[];

    /** @type {Object.<reach.trans.Trip.Mode,boolean>} */
    this.transModeTbl;

	// Routing data to store how stop was reached etc.
	/** @type {number} */
	this.runId;
	/** @type {number} */
	this.cost;
	/** @type {number} */
	this.time;
	/** @type {Array.<reach.road.Node>} Street network node that led to this stop. */
	this.srcNodeList;
	/** @type {Array.<reach.trans.Trip>} Trip along a transit line that led to this stop. */
	this.srcTripList;
	/** @type {Array.<number>} Offset of this stop along source trip. */
	this.srcPosList;

	// For backtracking.
	/** @type {number} */
	this.lastVisitTime;
	/** @type {Array.<number>} */
	this.lastTimeList;
	/** @type {Array.<reach.trans.Trip>} */
	this.lastTripList;
	/** @type {Array.<{time:number,cost:number,trip:reach.trans.Trip}>} */
	this.reverseDataList;
	/** @type {reach.route.result.LegRef} */
//	this.endWalk;

	// Links connecting stop to road network.
	/** @type {reach.road.Node} Nearest fast road graph node. */
	this.node;

	// Time table statistics used when compressing and decompressing.
	/** @type {Array.<reach.trans.Stop>} */
	this.followerList=[];
	/** @type {Object.<number,number>} */
	this.followerTbl={};
	/** @type {Array.<Array.<number>>} */
	this.durationsTo;
	/** @type {Array.<{mean:number,variance:number}>} */
	this.statsTo=[];

	/** @type {?number} */
	this.packFollowers;
	/** @type {Object.<number,number>} */
	this.packTbl;

	/** @type {reach.loc.Location} */
	this.loc;

	/** @type {number} Number of departures around search start time, to evaluate stop niceness. */
	this.departureCount;

	/** @type {boolean} */
	this.disabled;
};

/** @param {reach.trans.Stop} next
  * @param {number} duration */
reach.trans.Stop.prototype.addFollower=function(next,duration) {
	var followerNum;

	if(!this.durationsTo) this.durationsTo=/** @type {Array.<Array.<number>>} */ [];
	followerNum=this.followerTbl[next.id];
	if(!followerNum && followerNum!==0) {
		followerNum=this.followerList.length;
		this.followerTbl[next.id]=followerNum;
		this.followerList.push(next);
		this.durationsTo.push(/** @type {Array.<number>} */ ([duration]));
	} else {
		this.durationsTo[followerNum].push(duration);
	}
};

// This is only used for compressing data.
/** @param {number} statMul */
reach.trans.Stop.prototype.calcStats=function(statMul) {
	var followerNum,followerCount;
	var i,sampleCount;
	var stats;
	var mean,stdDev;
	var duration,err;
	var durations,filteredDurations;

	if(!this.durationsTo) return;
	followerCount=this.durationsTo.length;

	for(followerNum=0;followerNum<followerCount;followerNum++) {
		durations=this.durationsTo[followerNum];
		stats=reach.util.getStats(durations);

		// Try to find errors if variance is over 1 minute.
		if(stats.variance>1) {
			stdDev=Math.sqrt(stats.variance);
			sampleCount=stats.count;
			mean=stats.mean;

			filteredDurations=[];

			for(i=0;i<sampleCount;i++) {
				duration=durations[i];
				err=(duration-mean)/stdDev;
				if(err<0) err=-err;

				// If difference from mean is 3 sigma or less, accept data point.
				if(err<=3) filteredDurations.push(duration);
			}

			stats=reach.util.getStats(filteredDurations);
		}

		for(var stat in stats) {
			if(stat!='count') stats[stat]=~~(stats[stat]*statMul+0.5);
		}

		this.statsTo[followerNum]=stats;
	}
};
