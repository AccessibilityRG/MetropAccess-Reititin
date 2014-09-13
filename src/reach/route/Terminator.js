goog.provide('reach.route.Terminator');
goog.require('reach.route.Visitor');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra
  * @param {number} cost */
reach.route.Terminator=function(dijkstra,cost) {
	reach.route.Visitor.call(this);
	/** @type {number} */
	this.cost=cost;
};

//reach.route.Terminator.prototype=new reach.route.Visitor();
reach.inherit(reach.route.Terminator,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.Terminator.prototype.visit=function(dijkstra) {
//console.log('Terminate @ '+this.cost);
	dijkstra.stop();
};
