'use strict';

//require('fibers');
//var sqlite3=require('sqlite3');
var repl=require('repl');
//var path=require('path');
var fs=require('fs');
var proc=require('child_process');
var searchConf;
var extra;
var reach={};

var goog={
	provide:function(x) {
		var a,i,o;
		a=x.split('.');
		o=reach;
		for(i=1;i<a.length;i++) {
			if(!o[a[i]]) o[a[i]]={};
			o=o[a[i]];
		}
	},
	require:function() {}
};
goog.provide('goog');
goog.provide('main');

function init() {
	proc.exec('ogr2ogr -f "GeoJSON" -t_srs EPSG:4326 /dev/stdout extra.shp',function(err,stdout,stderr) {
console.log(err);
		console.log('out: '+stdout);
	});
}

init();
