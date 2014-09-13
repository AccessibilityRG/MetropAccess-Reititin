goog.provide('gis.test.clipArea');
goog.require('gis.env');

/** @constructor */
gis.test.clipArea=function(shadeElem) {
	var gc;
	var data;
	var buf;
	var x,y,p;

	gc=shadeElem.getContext('2d');

	data=gc.getImageData(0,0,64,64);
	buf=data.data;
	p=0;
	for(y=0;y<64;y++) {
		for(x=0;x<64;x++) {
			buf[p++]=128 + ~~(127 * (63+63-x) * (63+63-y) / (63*63*4));
			buf[p++]=128 + ~~(127 * (63+x) * (63+63-y) / (63*63*4));
			buf[p++]=128 + ~~(127 * (y*4) / (63*4));
			buf[p++]=255;
		}
	}
	gc.putImageData(data,0,0);
}
