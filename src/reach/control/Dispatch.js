goog.provide('reach.control.Dispatch');
goog.require('reach.task.Task');
goog.require('reach.data.List');

/** @constructor */
reach.control.Dispatch=function() {
	/** @type {number} Number of running tasks. */
	this.runCount=0;
	/** @type {number} Number of tasks waiting for dependencies. */
	this.waitCount=0;
	/** @type {number} Number of tasks blocked waiting for IO. */
	this.blockCount=0;
	/** @type {number} Number of tasks queued for unblocking. */
	this.unblockCount=0;

	/** @type {reach.data.List} Linked list of tasks doing background processing. Tasks are frequently added and removed. */
	this.runList=new reach.data.List();

	/** @type {?number} ID of timer for deactivating it. */
	this.timerId=null;
	/** @type {boolean} Flag set if calculation is running during a timer firing. */
	this.advancing=false;
	/** @type {number} How many timer firings with nothing to do, until timer gets deactivated. */
	this.idleMax=5;
	/** @type {number} Consecutive timer firing count with no tasks calculating. */
	this.idleNum=0;
	/** @type {number} Timer firing interval in milliseconds. */
	this.interval=200;

	/** @type {reach.data.Link} */
	this.latestLink=null;

	/** @type {number} Total time for calculations in milliseconds per timer firing. */
	this.quotaTotal=200;
	/** @type {number} Unused calculation time during previous timer firing. */
	this.quotaFree=this.quotaTotal;

	/** @type {number} */
	this.maxTaskId=1;
	/** @type {Array.<reach.task.Task>} */
	this.taskList=[];
	/** @type {Array.<reach.task.Task>} */
	this.unblockList=[];
};

/** @param {reach.control.TaskDef.Def|Object} def */
reach.control.Dispatch.prototype.run=function(def) {
	def=/** @type {reach.control.TaskDef.Def} */ def;
	this.runTask(def.task);
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.runTask=function(task) {
	var depNum,depCount;
	var dep;
	var depWaitCount;

	// Note that tasks marked as done can't be restarted here, because this function may get called several times when dependencies finish.
	if(task.state!=reach.task.State.NONE && task.state!=reach.task.State.WAIT) return;
	if(!task.dispatch) {
		task.dispatch=this;
		task.id=this.maxTaskId++;
		this.taskList[task.id]=task;
	}
	task.preInit();
	// Task can finish before it even gets run, if its init function calls finishTask through its success method.
	if(task.state!=reach.task.State.NONE && task.state!=reach.task.State.WAIT) return;
	if(task.state==reach.task.State.WAIT) this.waitCount--;

	// Task is not yet running and other tasks finishing shouldn't alter its state.
	task.state=reach.task.State.FUZZY;

	// Check if the task's dependencies have finished running and start them if necessary.
	// Effectively this is a topological sort of the dependency graph.
	depWaitCount=0;
	depCount=task.depList.length;
	for(depNum=0;depNum<depCount;depNum++) {
		dep=task.depList[depNum];
		if(!dep.dispatch) {
			dep.dispatch=this;
			dep.id=this.maxTaskId++;
			this.taskList[dep.id]=dep;
		}
		if(dep.state!=reach.task.State.DONE) {
			// A dependency is not done yet. If it's never been run, run it now.
			if(dep.state==reach.task.State.NONE) this.runTask(dep);
			// After scheduling dep to run, it might already have been marked finished by its init function.
			if(dep.state!=reach.task.State.DONE) {
				// Will have to wait for dep to finish first, so tell it to run this task when done.
				depWaitCount++;
				dep.addNextOnce(task);
			}
		}
	}

//	console.log(task.name+(depWaitCount?' waiting.':' running.'));

	if(depWaitCount==0) {
		task.runPtr=this.runList.insert(task);
		task.state=reach.task.State.RUN;
		this.runCount++;
		// Tell the task that its dependencies are ready.
		task.init();

		if(task.state==reach.task.State.RUN) this.advance();
	} else {
		task.state=reach.task.State.WAIT;
		this.waitCount++;
	}
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.runFollowers=function(task) {
	var next;

	for(var nextNum in task.nextTbl) {
		next=this.taskList[nextNum];
//console.log(task.name+' ('+task.id+')'+' -> '+next.name+' ('+next.id+') '+nextNum);
		this.runTask(next);
	}

	task.nextTbl={};
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.finishTask=function(task) {
	var memUsed;

	if(task.state==reach.task.State.DONE) return;
//	if(task.onSuccess) task.onSuccess();
	task.endTime=new Date().getTime();

	if(task.runTime>200) {
		if(typeof(window)!='undefined' && window.gc) {
			window.gc();
		} else if(typeof(global)!='undefined' && global.gc) {
			global.gc();
		}
	}

	if(task.runTime>200 && task.name!='') {
		memUsed=0;

		if(typeof(window)!='undefined' && window.performance && window.performance.memory) memUsed=window.performance.memory.usedJSHeapSize;
		if(typeof(process)!='undefined' && process.memoryUsage) memUsed=process.memoryUsage()['heapUsed'];

		console.log('Task '+task.name+' done, run time '+task.runTime+', heap now '+~~(memUsed/1024/1024+0.5)+' megs.');
	}

	if(task.state==reach.task.State.BLOCK) this.blockCount--;
	if(task.state==reach.task.State.WAIT) this.waitCount--;
	if(task.state==reach.task.State.RUN) this.runCount--;
	if(task.runPtr) {
		this.runList.remove(task.runPtr);
		task.runPtr=null;
	}
	task.state=reach.task.State.DONE;

//	console.log(task.name+' done.');
	this.runFollowers(task);

//	if(this.progress) this.progress.showFinish(task);
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.blockTask=function(task) {
	if(task.state==reach.task.State.BLOCK) return;
	if(task.state==reach.task.State.WAIT) this.waitCount--;
	if(task.state==reach.task.State.RUN) this.runCount--;
	if(task.runPtr) {
		this.runList.remove(task.runPtr);
		task.runPtr=null;
	}
	task.state=reach.task.State.BLOCK;
	this.blockCount++;

//	console.log(task.name+' blocked.');
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.unblockTask=function(task) {
	this.unblockList[this.unblockCount++]=task;
	// This will return if advance is already running, and so task will be unblocked on next tick.
	// Tick timer will be restarted if necessary.
	this.advance();
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.reallyUnblockTask=function(task) {
	// The same task can be queued for unblocking several times so this counter should decrease also for already unblocked tasks.
	this.unblockCount--;
	if(task.state!=reach.task.State.BLOCK) return;
	this.blockCount--;

	task.runPtr=this.runList.insert(task);
	task.state=reach.task.State.RUN;
	this.runCount++;
	this.advance();
};

reach.control.Dispatch.prototype.tick=function() {
//	console.log('tick');
	if(this.runCount>0 || this.unblockCount>0) {
		this.quotaFree=this.quotaTotal;
		// There are tasks running so let them continue processing.
		this.advance();
	} else {
		this.idleNum++;
		if(this.idleNum>=this.idleMax || this.runCount+this.waitCount+this.blockCount==0) {
			// If there are no pollable tasks for a while or active tasks of any kind, stop timer.
			clearInterval(this.timerId);
			this.timerId=null;
		}
	}
};

// Called every <interval> milliseconds and spends <quota> milliseconds advancing the first active task that needs polling.
reach.control.Dispatch.prototype.advance=function() {
	/** @type {reach.control.Dispatch} */
	var self=this;
	var link;
	var task;
	var startTime,time,taskStartTime;
	var stepsRemaining;
	var pollNum,pollCount;
	var fraction;
	var quota;

	// Avoid recursive calls to advance (when a task pauses regularly waiting for another). Otherwise stack runs out.
	if(this.advancing) return;
	this.advancing=true;

	// Handle all tasks queued for unblocking.
	// The loop variable is updated inside the function call.
	while(this.unblockCount) this.reallyUnblockTask(this.unblockList[this.unblockCount-1]);
	this.unblockList=[];

//	console.log('Event loop start.');
	quota=this.quotaFree;

	startTime=new Date().getTime();
	time=startTime;

	link=this.latestLink;
	// Get first running task.
	if(!link || (/** @type {reach.task.Task} */ link.item).state!=reach.task.State.RUN) link=this.runList.first;
	while(time<startTime+quota) {
		if(!link) {
			link=this.runList.first;
			if(!link) break;
		}

		task=/** @type {reach.task.Task} */ link.item;
		reach.util.assert(task.state==reach.task.State.RUN,'Dispatch.advance','Incorrect task state '+task.state);

		// Get next task now in case current task list item gets removed if the task terminates.
		link=link.next;

		stepsRemaining=1;
		pollCount=task.pollCount;

//		TODO: uncomment try/catch block.
//		try {
			// Repeat until task is done or quota is used.
			while(stepsRemaining>0 && time<startTime+quota) {
				taskStartTime=time;
				pollNum=pollCount;
				// Advance task <pollCount> steps.
				while(stepsRemaining>0 && pollNum--) stepsRemaining=task.advance();

				time=new Date().getTime();

				// If less than 1/16th of time quota was used, double <pollCount> to do more steps before next quota check.
				// Otherwise halve <pollCount>.
				if(time-taskStartTime<quota/16) pollCount*=2;
				else if(pollCount>1) pollCount/=2;
				task.runTime+=time-taskStartTime;
			}
//		} catch(e) {
//			this.blockTask(task);
//			console.log(e);
//		}

		// Save number of steps between quota checks, to re-use when timer fires next.
		task.pollCount=pollCount;

		if(stepsRemaining>0) {
			//if(this.progress) this.progress.show(task,stepsRemaining);
		} else if(stepsRemaining<0) {
			//if(this.progress) this.progress.show(task,-stepsRemaining);
			if(task.state!=reach.task.State.BLOCK) this.blockTask(task);
		} else {
			if(task.state!=reach.task.State.DONE) this.finishTask(task);
		}
	}

	this.latestLink=link;

	quota-=time-startTime;
	if(quota<0) quota=0;
//	console.log('Event loop end quota '+quota+'.');
	// Store quota left unused and allow entering this function again.
	this.quotaFree=quota;
	if((this.runCount || this.unblockCount) && !this.timerId) {
		if(task) console.log(task.name+' activate timer.');
		this.timerId=setInterval(function() {return(self.tick());},this.interval);
	}
	this.advancing=false;
};
