goog.provide('gis.osm.Node');
goog.require('gis.Obj');
goog.require('gis.MU');

/** @constructor
  * @param {gis.MU} ll */
gis.osm.Node=function(ll) {
	/** @type {gis.MU} */
	this.ll=ll;
	/** @type {Array.<gis.osm.Way>} */
	this.wayList=[];
	/** @type {Array.<number>} */
	this.posList=[];
};

/** @param {gis.osm.Way} way
  * @param {number} pos */
gis.osm.Node.prototype.addWay=function(way,pos) {
	this.wayList.push(way);
	this.posList.push(pos);
};
