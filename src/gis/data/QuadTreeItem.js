goog.provide('gis.data.QuadTreeItem');
goog.require('gis.Obj');
goog.require('gis.geom.BB');

/** @interface */
gis.data.QuadTreeItem=function() {};

/** @return {gis.geom.BB} */
gis.data.QuadTreeItem.prototype.getBB=function() {};
