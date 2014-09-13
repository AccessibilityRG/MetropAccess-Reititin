goog.provide('reach.task.Task');
goog.provide('reach.task.State');
goog.require('reach.Obj');
goog.require('reach.data.Link');
goog.require('reach.task.Result');

/** @constructor
  * @param {string} name */
reach.task.Task=function(name) {
	var self=this;

	/** @type {number} */
	this.id;

	/** @type {string} */
	this.name=name;

	/** @type {reach.task.Task} */
//	this.parent;
	/** @type {Array.<reach.task.Task>} */
//	this.children;

	/** @type {reach.data.Link} */
	this.runPtr=null;
	/** @type {number} Number of times a task should be polled between checking the system clock. */
	this.pollCount=1;

	/** @type {Array.<reach.task.Task>} */
	this.depList=[];
	/** @type {Array.<reach.task.Task>} */
//	this.depOnceList=[];
	/** @type {Array.<reach.task.Task>} */
	this.nextList=[];
	/** @type {Object.<number|string,boolean>} */
	this.nextTbl={};

	/** @type {reach.control.Dispatch} */
	this.dispatch=null;

	/** @type {number} */
	this.startTime=0;
	/** @type {number} */
	this.endTime=0;
	/** @type {number} */
	this.runTime=0;

	/** @type {reach.task.State} */
	this.state=reach.task.State.NONE;

	/** @type {reach.task.Result} */
	this.result=/** @type {reach.task.Result} */ {};

	/** @type {function():number} */
	this.advance;
};

/** @enum {number} */
reach.task.State={
	NONE:0,
	FUZZY:1,
	RUN:2,
	WAIT:3,
	BLOCK:4,
	DONE:5
};

/** @enum {number} */
reach.task.Health={
	OK:0,
	WARN:1,
	ERR:2
};

/** @param {reach.task.Task} dep */
reach.task.Task.prototype.addDep=function(dep) {
	this.depList.push(dep);
	dep.nextList.push(this);
/*
	if(!dep.dispatch) {
		dep.dispatch=this.dispatch;
		dep.id=this.dispatch.maxTaskId++;
		this.dispatch.taskList[dep.id]=dep;
	}

	if(!this.dispatch) {
		this.dispatch=dep.dispatch;
		this.id=dep.dispatch.maxTaskId++;
		dep.dispatch.taskList[task.id]=task;
	}
*/
};

/** @param {reach.task.Task} dep */
/*
reach.task.Task.prototype.addDepOnce=function(dep) {
	this.depOnceList.push(dep);
};
*/

/** @param {reach.task.Task} next */
reach.task.Task.prototype.addNextOnce=function(next) {
//console.log('Added '+this.name+' ('+this.id+') '+' -> '+next.name+' ('+next.id+')');
	this.nextTbl[next.id]=true;
};

// Called when system wants to start the task, but its dependencies may not be ready.
reach.task.Task.prototype.preInit=function() {};

// Called when task is ready to start.
reach.task.Task.prototype.init=function() {};

reach.task.Task.prototype.run=function() {
	if(this.dispatch) this.dispatch.runTask(this);
};

/** @param {reach.task.Task} child */
reach.task.Task.prototype.runChild=function(child) {
	if(this.dispatch) this.dispatch.runTask(child);
};

/** @return {number} */
reach.task.Task.prototype.block=function() {
	if(this.dispatch) this.dispatch.blockTask(this);
	return(-1);
};

/** @return {number} */
reach.task.Task.prototype.unblock=function() {
	if(this.dispatch) this.dispatch.unblockTask(this);
	return(-1);
};

/** @return {number} */
reach.task.Task.prototype.success=function() {
	if(this.dispatch) this.dispatch.finishTask(this);
	return(0);
};

/** @return {number} */
reach.task.Task.prototype.advance=function() {
    return(0);
};

/** @param {reach.task.Health} code
  * @param {string} msg */
reach.task.Task.prototype.showMessage=function(code,msg) {
	console.log(msg);
};
