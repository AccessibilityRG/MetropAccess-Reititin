goog.provide('reach.data.HeapItem');

/** @interface */
reach.data.HeapItem=function() {};

/** @type {number} */
reach.data.HeapItem.prototype.heapIndex;

/** @type {number} Travel cost for reaching this stop. */
reach.data.HeapItem.prototype.cost;

/** @type {reach.data.HeapItem} */
reach.data.HeapItem.prototype.heapPrev;

/** @type {reach.data.HeapItem} */
reach.data.HeapItem.prototype.heapNext;
