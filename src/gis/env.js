goog.provide('gis.Env');
goog.provide('gis.env');

/** @constructor */
gis.Env=function() {
	var platform;

	if(typeof(process)!='undefined' && process.versions && process.versions.node) {
		platform=gis.Env.Platform.NODE;
	} else if((typeof(window)=='undefined' || !window.document) && typeof(self)!='undefined' && self!=window) {
		platform=gis.Env.Platform.WORKER;
	} else if(typeof(navigator)!='undefined') {
		platform=gis.Env.Platform.BROWSER;
	} else {
		platform=gis.Env.Platform.UNKNOWN;
	}

	/** @type {gis.Env.Platform} */
	this.platform=platform;

	/** @type {boolean} */
	this.uint8Array=typeof(Uint8Array)!='undefined';
	/** @type {boolean} */
	this.arrayBuffer=typeof(ArrayBuffer)!='undefined' && this.uint8Array;
};

/** @enum {number} */
gis.Env.Platform={
	UNKNOWN:0,
	BROWSER:1,
	WORKER:2,
	NODE:3
};

gis.env=new gis.Env();
