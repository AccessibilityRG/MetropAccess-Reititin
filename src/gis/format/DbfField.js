goog.provide('gis.format.DbfField');
goog.require('gis.Obj');

/** @constructor */
gis.format.DbfField=function() {
	/** @type {string} */
	this.name;
	/** @type {gis.format.DbfField.Type} */
	this.type;
	/** @type {number} */
	this.len;
	/** @type {number} */
	this.digitCount;
};

/** @enum {number} */
gis.format.DbfField.Type={
	NUMBER:0,
	STRING:1
};
