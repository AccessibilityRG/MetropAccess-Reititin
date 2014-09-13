var gis={};
var reach={};
this.gis=gis;
this.reach=reach;

var goog={
	global:this,
	provide:function(x) {
		var a,i,o;
		if(x=='goog' || x=='main') return;
		a=x.split('.');
		o=goog.global;
		for(i=0;i<a.length;i++) {
			if(!o[a[i]]) o[a[i]]={};
			o=o[a[i]];
		}
	},
	require:function() {}
};
