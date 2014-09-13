goog.provide('reach.road.NearWay');

// This is basically just a struct definition.
/** @constructor */
reach.road.NearWay=function() {
	/** @type {reach.road.Way} */
	this.way;

	/** @type {reach.road.Node} */
	this.nodePrev;
	/** @type {number} */
	this.distPrev;
	/** @type {reach.road.Node} */
	this.nodeNext;
	/** @type {number} */
	this.distNext;

	/** @type {number} */
	this.dist;

	/** @type {reach.MU} */
	this.ll;
};
