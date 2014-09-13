goog.provide('reach.control.TaskDef');
goog.require('reach.task.Task');

// TODO: maybe these classes should be called reach.task.Def*

/** @typedef {{task:reach.task.Task,nextList:Array.<reach.task.Task>,result:reach.task.Result}} */
reach.control.TaskDef.Def;

/** @typedef {reach.control.TaskDef.Def|reach.control.TaskDef.DefGroup} */
reach.control.TaskDef.DefItem;

/** @typedef {Object.<string,reach.control.TaskDef.DefItem>} */
reach.control.TaskDef.DefGroup;
