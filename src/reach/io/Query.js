goog.provide('reach.io.Query');

/** @constructor */
reach.io.Query=function() {
	/** @type {Fiber.Fiber} */
	this.fiber=Fiber.current;
};

/** @param {Object.<string,string|number>} row */
reach.io.Query.prototype.addRow=function(row) {
	this.fiber.run(row);
};

reach.io.Query.prototype.finish=function() {
	this.fiber.run(null);
};

/** @return {?Object.<string,string|number>} */
reach.io.Query.prototype.getRow=function() {
	return(/** @type {?Object.<string,string|number>} */ global.yield());
};
