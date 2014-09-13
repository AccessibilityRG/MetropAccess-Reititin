goog.provide('reach.task.Trigger');
goog.require('reach.task.Task');

/** @constructor
  * @extends {reach.task.Task}
  * @param {string} name */
reach.task.Trigger=function(name) {
	reach.task.Task.call(this,name);
	/** @type {boolean} */
	this.done=false;
};

reach.inherit(reach.task.Trigger,reach.task.Task);

reach.task.Trigger.prototype.init=function() {
	if(this.done) this.success();
};
