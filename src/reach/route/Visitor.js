goog.provide('reach.route.Visitor');
goog.require('reach.Obj');
goog.require('reach.data.HeapItem');

/** @constructor
  * @implements {reach.data.HeapItem} */
reach.route.Visitor=function() {
	/** @type {number} */
	this.cost=0;
	/** @type {number} */
	this.time=0;
	/** @type {number} Index of this stop in Dijkstra's heap. */
	this.heapIndex;
	/** @type {reach.route.Visitor} */
	this.heapPrev=null;
	/** @type {reach.route.Visitor} */
	this.heapNext=null;
};

/** @param {reach.route.Dijkstra} dijkstra
  * @return {reach.route.Visitor.State} */
reach.route.Visitor.prototype.visit=function(dijkstra) {};

/** @enum {number} */
reach.route.Visitor.State={
	OK:0,
	WAIT:-1
};
