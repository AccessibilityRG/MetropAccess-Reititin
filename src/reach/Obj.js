// Fix bug in Closure library when used uncompiled in Node.js: goog.global doesn't refer to the global environment so
// goog.require won't find this.goog to augment it with more classes, unless we explicitly set it here.
this.goog=goog;

goog.provide('reach.Obj');

/** @param {Function} subClass
  * @param {Function} parentClass */
reach.inherit=function(subClass,parentClass) {
	var Obj;

	Obj=/** @constructor */ function() {};
	Obj.prototype=parentClass.prototype;
	subClass.prototype=new Obj();
//	subClass.parentClass=parentClass;
};

reach.env={};

/** @enum {number} */
reach.env.Type={
	UNKNOWN:0,
	BROWSER:1,
	WORKER:2,
	NODE:3
};

/** @type {reach.env.Type} */
reach.env.platform;

if(typeof(process)!='undefined' && process.versions && process.versions.node) {
	reach.env.platform=reach.env.Type.NODE;
} else if((typeof(window)=='undefined' || !window.document) && typeof(self)!='undefined' && self!=window) {
	reach.env.platform=reach.env.Type.WORKER;
} else if(typeof(navigator)!='undefined') {
	reach.env.platform=reach.env.Type.BROWSER;
} else {
	reach.env.platform=reach.env.Type.UNKNOWN;
}
