goog.provide('reach.task.Image');
goog.require('reach.task.ImageResult');
goog.require('reach.task.Task');

/** @constructor
  * @extends {reach.task.Task}
  * @param {string} name
  * @param {string} url */
reach.task.Image=function(name,url) {
	reach.task.Task.call(this,name);

	/** @type {string} */
	this.url=url;

	/** @type {reach.task.ImageResult} */
	this.result=new reach.task.ImageResult();
};

reach.inherit(reach.task.Image,reach.task.Task);

reach.task.Image.prototype.init=function() {
	/** @type {reach.task.Image} */
	var self=this;
	/** @type {Image} */
	var img;

	if(typeof(Image)!='undefined') {
		img=new Image();

		img.onload=function() {
			self.result.img=img;
			self.success();
		};

		img.onerror=function() {
			self.result.img=null;
			self.success();
		};

		img.src=this.url;
	}

	this.block();
};
