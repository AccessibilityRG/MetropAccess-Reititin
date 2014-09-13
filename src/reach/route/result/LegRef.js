goog.provide('reach.route.result.LegRef');
goog.require('reach.route.result.Leg');

/** @constructor
  * @param {reach.route.result.Leg} leg
  * @param {reach.route.result.Leg.Dir} dir */
reach.route.result.LegRef=function(leg,dir) {
	/** @type {reach.route.result.Leg} */
	this.leg=leg;
	/** @type {reach.route.result.Leg.Dir} */
	this.dir=dir;
	/** @type {number} */
	this.startTime=0;
};

/** @return {reach.route.result.LegRef} */
reach.route.result.LegRef.prototype.copy=function() {
	var ref;

	ref=new reach.route.result.LegRef(this.leg,this.dir);
	ref.startTime=this.startTime;

	return(ref);
};
