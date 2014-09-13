/** @fileoverview Sweep line algorithm works by jumping between events in sorted order. */

goog.provide('gis.geom.clip.SweepEvent');
goog.require('gis.Obj');
goog.require('gis.math.Rat');

/** @constructor
  * @implements {gis.data.SplayKey}
  * @param {gis.geom.clip.Point} pt */
gis.geom.clip.SweepEvent=function(pt) {
	/** @type {gis.geom.clip.Point} Input geometry point at integer coordinates or intersection at rational coordinates. */
	this.pt=pt;
	/** @type {gis.geom.clip.SweepEvent} */
	this.next=null;
};

/** @param {gis.geom.clip.SweepEvent} other
  * @return {number} */
gis.geom.clip.SweepEvent.prototype.deltaFrom=function(other) {
	var d;

	d=other.pt.y-this.pt.y;
	if(d*d>gis.math.Rat.tol) return(d);

	if(!(this instanceof gis.geom.clip.CrossEvent || other instanceof gis.geom.clip.CrossEvent)) {
		// If neither point has rational number coordinates, just return the non-zero difference or difference along another axis.
		return(d || other.pt.x-this.pt.x);
	}

	return(other.pt.getRatY().deltaFrom(this.pt.getRatY()) || other.pt.getRatX().deltaFrom(this.pt.getRatX()));
};
