goog.provide('gis.data.SplayKey');
goog.require('gis.Obj');

/** @interface */
gis.data.SplayKey=function() {};

/** @param {gis.data.SplayKey} other
  * @return {number} */
gis.data.SplayKey.prototype.deltaFrom=function(other) {};
