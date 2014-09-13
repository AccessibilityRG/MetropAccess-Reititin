goog.provide('reach.route.result.Leg');
goog.require('reach.Obj');

/** @constructor */
reach.route.result.Leg=function() {
	/** @type {number} */
//	this.startTime=0;
	/** @type {number} Cost of this route leg. */
	this.cost=1;
	/** @type {number} Duration in time units. */
	this.duration=0;
	/** @type {number} Distance in meters. */
	this.dist=0;
	/** @type {boolean} */
//	this.invert=false;
	/** @type {reach.route.result.Leg.Type} */
	this.type;
};

/** Mode of travel.
  * @enum {number} */
reach.route.result.Leg.Type={
	NONE:0,
    WALK:1,
    TRANS:2,
	EXTRA:3
};

/** @enum {boolean} */
reach.route.result.Leg.Dir={
	FORWARD:true,
	BACKWARD:false
};

/** @param {reach.route.result.Leg} leg
  * @return {reach.route.result.Leg} */
/*
reach.route.result.Leg.prototype.copy=function(leg) {
	if(!leg) leg=new reach.route.result.Leg();

    leg.startTime=this.startTime;
	leg.cost=this.cost;
	leg.duration=this.duration;
	leg.dist=this.dist;
	leg.type=this.type;

    return(leg);
};
*/

reach.route.result.Leg.prototype.dir=reach.route.result.Leg.Dir.FORWARD;

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @param {Array.<reach.MU>} prev
  * @return {Array.<reach.MU>} */
reach.route.result.Leg.prototype.getPoints=function(conf,dir,prev) {
	return([]);
};

/*
reach.route.result.Leg.prototype.reverse=function() {
	this.invert=!this.invert;
};
*/
