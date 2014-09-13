var gis={};
var reach={};
// Fix bug in Closure library when used uncompiled in Node.js: goog.global doesn't refer to the global environment so
// goog.require won't find this.reach to augment it with more classes, unless we explicitly set it here.
this.gis=gis;
this.reach=reach;
