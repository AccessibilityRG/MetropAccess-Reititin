goog.provide('reach.task.FetchResult');
goog.require('reach.task.Result');

/** @constructor
  * @extends {reach.task.Result} */
reach.task.FetchResult=function() {
	/** @type {?string} */
	this.data;
};

reach.inherit(reach.task.FetchResult,reach.task.Result);
