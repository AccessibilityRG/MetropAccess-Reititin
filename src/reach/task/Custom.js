goog.provide('reach.task.Custom');
goog.require('reach.task.Task');

/** @constructor
  * @extends {reach.task.Task}
  * @param {string} name
  * @param {function(reach.task.Task):?function():number} init */
reach.task.Custom=function(name,init) {
	reach.task.Task.call(this,name);

	/** @type {function(reach.task.Task):?function():number} */
	this.onInit=init;
};

reach.inherit(reach.task.Custom,reach.task.Task);

reach.task.Custom.prototype.init=function() {
	var advance;

	advance=this.onInit(this);
	if(advance) this.advance=advance;
	else this.success();
};
