goog.provide('reach.task.ImageResult');
goog.require('reach.task.Result');

/** @constructor
  * @extends {reach.task.Result} */
reach.task.ImageResult=function() {
	/** @type {Image} */
	this.img;
};

reach.inherit(reach.task.ImageResult,reach.task.Result);
