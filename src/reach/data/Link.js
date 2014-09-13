goog.provide('reach.data.Link');

/** @constructor
  * @param {*} item */
reach.data.Link=function(item) {
	/** @type {reach.data.Link} */
	this.prev=null;
	/** @type {reach.data.Link} */
	this.next=null;
	/** @type {*} */
	this.item=item;
};
