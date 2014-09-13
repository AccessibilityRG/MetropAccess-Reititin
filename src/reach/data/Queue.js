goog.provide('reach.data.Queue');

/** @constructor */
reach.data.Queue=function() {
	/** @type {Array.<reach.road.Node>} */
	this.list=[];
	/** @type {number} */
	this.allocated=0;
	/** @type {number} */
	this.offset=0;
};

/** @param {reach.road.Node} item */
reach.data.Queue.prototype.insert=function(item) {
	this.list[this.allocated++]=item;
};

/** @return {reach.road.Node} */
reach.data.Queue.prototype.extract=function() {
	var item;

	if(this.allocated==0) return(null);

	item=this.list[this.offset];
	this.list[this.offset++]=null;

	if(this.offset*2>this.allocated) {
		this.list=this.list.slice(this.offset);
		this.allocated-=this.offset;
		this.offset=0;
	}

	return(item);
};
