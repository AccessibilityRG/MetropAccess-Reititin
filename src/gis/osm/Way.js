goog.provide('gis.osm.Way');
goog.require('gis.Obj');
goog.require('gis.osm.WayProfile');
goog.require('gis.osm.Node');
goog.require('gis.geom.BB');
goog.require('gis.MU');

/** @constructor
  * @implements {gis.data.QuadTreeItem} */
gis.osm.Way=function() {
	/** @type {gis.geom.BB} */
	this.bb;
	/** @type {Array.<number|gis.osm.Node>} */
	this.ptList;

	/** @type {string} */
	this.name;
	/** @type {gis.osm.WayProfile} */
	this.profile;
};

/*
gis.osm.Way.Type={
	NONE:0,
	HIGHWAY:1,
	FASTCARS:2,
	SLOWCARS:3,
	PARKING:4,
	HOMEZONE:5,
	CARPATH:6,
	CYCLEWAY:7,
	FOOTWAY:8,
	PATH:9,
	STAIRS:10,
	TRANSIT:11,
	AIR:12
};
*/

/** @param {Array.<number|gis.osm.Node>} ptList */
//gis.osm.Way.prototype.reshape=function(ptList) {
//	this.ptList=ptList;
//};

/** @return {gis.geom.BB} */
gis.osm.Way.prototype.getBB=function() {
	return(this.bb);
};

/** @param {Array.<gis.MU>} ptList
  * @return {gis.geom.BB} */
gis.osm.Way.prototype.makeBB=function(ptList) {
	var ptNum,ptCount;
	var ll;
	var lat,lon;
	var boundS,boundW;
	var boundN,boundE;

	ptCount=ptList.length;
	ll=ptList[0];
	boundS=ll.llat;
	boundN=ll.llat;
	boundW=ll.llon;
	boundE=ll.llon;

	for(ptNum=1;ptNum<ptCount;ptNum++) {
		ll=ptList[ptNum];
		lat=ll.llat;
		lon=ll.llon;
		if(lat<boundS) boundS=lat;
		if(lat>boundN) boundN=lat;
		if(lon<boundW) boundW=lon;
		if(lon>boundE) boundE=lon;
	}

	this.bb=new gis.geom.BB(boundS,boundW,boundN,boundE);
	return(this.bb);
};

/*
gis.osm.Way.prototype.updateBB=function() {
	var ptList;
	var ptNum,ptCount;
	var pt;
	var lat,lon;

	ptList=this.ptList;
	ptCount=ptList.length;

	for(ptNum=1;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];

		if(typeof(pt)=='number') {
		} else {
		}
	}
};
*/

/** @param {function(number,number,boolean)} func */
gis.osm.Way.prototype.forPoints=function(func) {
	var ptList;
	var ptNum,ptCount;
	var boundS,boundW;
	var lat,lon;
	var node;

	ptList=this.ptList;
	ptCount=ptList.length;

	boundS=this.bb.x1;
	boundW=this.bb.y1;

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		node=ptList[ptNum];
		if(typeof(node)=='number') {
			lat=boundS+~~(node/ (1<<gis.osm.WaySet.hashKeyBits)  );
			lon=boundW+  (node&((1<<gis.osm.WaySet.hashKeyBits)-1));
			func(lat,lon,null);
		} else {
			func(node.ll.llat,node.ll.llon,node);
		}
	}
};

/** @param {number} dist */
gis.osm.Way.prototype.getProbes=function(dist) {
	var self=this;
	var segList;
	var prevPt;
	var seg;
	var pos;

	segList=[];
	prevPt=null;

	pos=0;
	this.forPoints(function(lat,lon,node) {
		var pt,p1,p2;

		pt=new gis.geom.clip.Point(lat,lon);
		if(prevPt) {
			seg=new gis.geom.clip.Seg(prevPt,pt);
			seg.type=0;
			seg.way=self;
			seg.pos=pos-1;
			segList.push(seg);
		}
		prevPt=pt;

		p1=new gis.geom.clip.Point(lat-dist,lon-dist);
		p2=new gis.geom.clip.Point(lat+dist,lon+dist);
		seg=new gis.geom.clip.Seg(p1,p2);
		seg.type=1;
		seg.way=self;
		seg.pos=pos;
		segList.push(seg);

		p1=new gis.geom.clip.Point(lat+dist,lon-dist);
		p2=new gis.geom.clip.Point(lat-dist,lon+dist);
		seg=new gis.geom.clip.Seg(p1,p2);
		seg.type=1;
		seg.way=self;
		seg.pos=pos;
		segList.push(seg);

		pos++;
	});

	return(segList);
};
