/** @fileoverview Basic point with coordinates in integers, or rationals combined with float approximations. */

goog.provide('gis.geom.clip.Point');
goog.require('gis.Obj');
goog.require('gis.math.Rat');

/** @constructor
  * @implements {gis.data.SplayKey}
  * @param {number} x
  * @param {number} y */
gis.geom.clip.Point=function(x,y) {
	/** @type {number} */
	this.x=x;
	/** @type {number} */
	this.y=y;
};

/** Get bounding box.
  * @return {gis.geom.BB} */
gis.geom.clip.Point.prototype.getBB=function() {
	return(new gis.geom.BB(this.x,this.y,this.x,this.y));
};

/** @return {{x:number,y:number}|{x:gis.math.Rat,y:gis.math.Rat}} */
gis.geom.clip.Point.prototype.getRat=function() {
	return(this);
};

/** @param {gis.geom.Point} other
  * @return {number} */
gis.geom.clip.Point.prototype.deltaFrom=function(other) {
	var rat,otherRat;

	d=this.x-other.x;
	if(d*d>gis.math.Rat.tol) return(d);

	rat=this.getRat();
	otherRat=other.getRat();

	d=gis.math.Rat.minusSign(rat.x,otherRat.x);
	if(d) return(d);

	d=this.y-other.y;
	if(d*d>gis.math.Rat.tol) return(d);

	return(gis.math.Rat.minusSign(rat.y,otherRat.y));
};
