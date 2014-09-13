goog.provide('reach.XY');

/** @constructor
  * @param {number} x
  * @param {number} y */
reach.XY=function(x,y) {
	/** @type {number} */
	this.xx=x;
	/** @type {number} */
	this.yy=y;
};

reach.XY.prototype.toString=function() {
    return(this.xx+','+this.yy);
};
