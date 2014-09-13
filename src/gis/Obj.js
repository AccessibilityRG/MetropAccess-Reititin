goog.provide('gis.Obj');

/** @param {Function} subClass
  * @param {Function} parentClass */
gis.inherit=function(subClass,parentClass) {
	var Obj;

	Obj=/** @constructor */ function() {};
	Obj.prototype=parentClass.prototype;
	subClass.prototype=new Obj();
//	subClass.parentClass=parentClass;
};

gis.env={};

/** @enum {number} */
gis.env.Type={
	UNKNOWN:0,
	BROWSER:1,
	WORKER:2,
	NODE:3
};

/** @type {gis.env.Type} */
gis.env.platform;

if(typeof(process)!='undefined' && process.versions && process.versions.node) {
	gis.env.platform=gis.env.Type.NODE;
} else if((typeof(window)=='undefined' || !window.document) && typeof(self)!='undefined' && self!=window) {
	gis.env.platform=gis.env.Type.WORKER;
} else if(typeof(navigator)!='undefined') {
	gis.env.platform=gis.env.Type.BROWSER;
} else {
	gis.env.platform=gis.env.Type.UNKNOWN;
}
