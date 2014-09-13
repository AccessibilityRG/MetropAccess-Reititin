goog.provide('gis.io.Stream');
goog.require('gis.Obj');

/** @constructor */
gis.io.Stream=function() {
	/** @type {number} */
	this.pos=0;
};

/** @enum {boolean} */
gis.io.Stream.Endian={
	BIG:true,
	LITTLE:false
};
