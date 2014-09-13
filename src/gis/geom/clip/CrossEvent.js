/** @fileoverview Point at the intersection of two line bundles. */

goog.provide('gis.geom.clip.CrossEvent');

/** @constructor
  * @param {number} x Float approximation.
  * @param {number} y Float approximation.
  * @param {gis.geom.clip.Bundle} a First bundle.
  * @param {gis.geom.clip.Bundle} b Second bundle. */
gis.geom.clip.CrossEvent=function(x,y,a,b) {
	/** @type {number} Float approximation. */
	this.x=x;
	/** @type {number} Float approximation. */
	this.y=y;
	/** @type {gis.geom.BigInt} Cached exact homogeneous coordinate. */
	this.bigX;
	/** @type {gis.geom.BigInt} Cached exact homogeneous coordinate. */
	this.bigY;
	/** @type {gis.geom.BigInt} Cached exact homogeneous coordinate. */
	this.bigW;
	/** @type {gis.geom.clip.Bundle} First bundle. */
	this.a=a;
	/** @type {gis.geom.clip.Bundle} Second bundle. */
	this.b=b;
};

/** @return {{x:number,y:number}|{x:gis.geom.Rat,y:gis.geom.Rat}} */
gis.geom.clip.CrossEvent.prototype.getRat=function() {
	if(!this.ratX) {
		// Calculate and cache coordinates as rational numbers.
		// TODO: Make it calculate the intersection point.
		this.ratX=new gis.geom.Rat(this.x,1);
		this.ratY=new gis.geom.Rat(this.y,1);
	}

	return({x:this.ratX,y:this.ratY});
};
