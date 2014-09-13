goog.provide('reach.data.List');
goog.require('reach.data.Link');

/** @constructor */
reach.data.List=function() {
	/** @type {reach.data.Link} */
	this.first=null;
};

/** @param {*} item
  * @return {reach.data.Link} */
reach.data.List.prototype.insert=function(item) {
	var link,next;

	link=new reach.data.Link(item);
	next=this.first;
	if(next) next.prev=link;

	link.next=next;
	this.first=link;

	return(link);
};

/** @param {reach.data.Link} link */
reach.data.List.prototype.remove=function(link) {
	if(this.first==link) this.first=link.next;

	if(link.prev) link.prev.next=link.next;
	if(link.next) link.next.prev=link.prev;
};
