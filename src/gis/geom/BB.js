/** @fileoverview Bounding box defined by coordinates of two corners. */

goog.provide('gis.geom.BB');
goog.require('gis.Obj');

/** @constructor
  * @param {number} x1 South edge latitude.
  * @param {number} y1 West edge longitude.
  * @param {number} x2 North edge latitude.
  * @param {number} y2 East edge longitude. */
gis.geom.BB=function(x1,y1,x2,y2) {
    /** @type {number} */
    this.x1=x1;
    /** @type {number} */
    this.y1=y1;
    /** @type {number} */
    this.x2=x2;
    /** @type {number} */
    this.y2=y2;
};
