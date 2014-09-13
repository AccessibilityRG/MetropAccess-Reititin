goog.provide('gis.enc.Util');
goog.provide('gis.enc.util');

/** @constructor */
gis.enc.Util=function() {};

/** @param {Array|ArrayBuffer|Uint8Array} data
  * @return {Array|Uint8Array} */
gis.enc.Util.prototype.toArray8=function(data) {
	if(gis.env.arrayBuffer && data instanceof ArrayBuffer) data=new Uint8Array(data);
	return(/** @type {Array|Uint8Array} */ data);
}

gis.enc.util=new gis.enc.Util();
