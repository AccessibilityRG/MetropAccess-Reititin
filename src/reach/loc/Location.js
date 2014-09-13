goog.provide('reach.loc.Location');
goog.require('reach.Obj');
goog.require('reach.MU');

/** @constructor */
reach.loc.Location=function() {
	/** @type {reach.MU} */
	this.ll;
	/** @type {string} */
	this.id='';
	/** @type {number} */
	this.runId=0;
	/** @type {number} */
	this.cost=0;
	/** @type {number} */
	this.time=0;
	/** @type {reach.loc.InputSet} */
	this.inputSet;
	/** @type {Array.<string>} */
	this.fieldList;
};
