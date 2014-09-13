goog.provide('gis.geom.clip.Batch');
goog.require('gis.Obj');
goog.require('gis.geom.clip.Seg');

/** @constructor */
gis.geom.clip.Batch=function(geomList) {
	/** @type {Array.<gis.osm.Way>} */
	this.geomList=geomList;
};

gis.geom.clip.Batch.prototype.run=function() {
	var geomList;
	var geomNum,geomCount;
	var geom;
	var segList;
	var bb;
	var scale;
	var segList;
	var segNum,segCount;
	var seg;
	var otherNum,other;
	var ptList;
	var pt;
	var dist;
var t=0;

	console.log(new gis.Deg(60,24).toMU().llat);
	console.log(new gis.Deg(61,25).toMU().llat);
	console.log(new gis.Deg(60,24).toMU().distTo(new gis.Deg(61,25).toMU()));

	dist=10/Math.sqrt(2);	// Right triangle legs when hypotenuse is 10 meters.
	segList=[];
	geomList=this.geomList;
	geomCount=geomList.length;
	for(geomNum=0;geomNum<geomCount;geomNum++) {
		geom=geomList[geomNum];

		bb=geom.bb;
		scale=gis.MU.getScale((bb.x1+bb.x2)/2);	// Adjust scale for Mercator distortion.
		Array.prototype.push.apply(segList,geom.getProbes(dist/scale));	// Create a dist-sized cross around each point.
t+=segList.length;
	}

	this.segList=segList;

	ptList=[];

	var x1,y1,x2,y2,x3,y3,x4,y4,t;

	segCount=segList.length;
	for(segNum=0;segNum<segCount;segNum++) {
console.log(segNum);
		seg=segList[segNum];

		x1=seg.p1.x;y1=seg.p1.y;
		x2=seg.p2.x;y2=seg.p2.y;
		if(x2<x1) t=x1;x1=x2;x2=t;
		if(y2<y1) t=y1;y1=y2;y2=t;

		for(otherNum=segNum+1;otherNum<segCount;otherNum++) {
			other=segList[otherNum];
			if(other.way==seg.way) continue;
			if(other.way.name!=seg.way.name && (other.way.name || seg.way.name)) continue;
			if(other.way.profile.layer!=seg.way.profile.layer && (other.way.profile.layer || seg.way.profile.layer)) continue;

			x3=other.p1.x;y3=other.p1.y;
			x4=other.p2.x;y4=other.p2.y;
			if(x4<x3) t=x3;x3=x4;x4=t;
			if(y4<y3) t=y3;y3=y4;y4=t;

			if(x4<x1 || y4<y1 || x3>x2 || y3>y2) continue;

			pt=seg.intersect(other);
			if(pt) ptList.push(pt);
		}
	}

	this.ptList=ptList;
};

gis.geom.clip.Batch.prototype.exportKml=function(stream) {
	var segList;
	var segNum,segCount;
	var seg;
	var ptList;
	var ptNum,ptCount;
	var pt;
	var txt;
	var deg;

	txt='<?xml version="1.0" encoding="utf-8" ?>\n'+
		'<kml xmlns="http://www.opengis.net/kml/2.2">\n'+
		'<Document>\n';
	stream.writeText(txt);

	segList=this.segList;
	segCount=segList.length;
	for(segNum=0;segNum<segCount;segNum++) {
		seg=segList[segNum];

		txt='<Placemark>\n'+
			'<name>'+segNum+'</name>\n'+
			'<LineString>\n'+
			'<coordinates>\n';
		stream.writeText(txt);

		txt='';
		deg=new gis.MU(seg.p1.x,seg.p1.y).toDeg();
		txt+=deg.llon+','+deg.llat+',0\n';
		deg=new gis.MU(seg.p2.x,seg.p2.y).toDeg();
		txt+=deg.llon+','+deg.llat+',0\n';
		stream.writeText(txt);

		txt='</coordinates>\n'+
			'</LineString>\n'+
			'</Placemark>\n';
		stream.writeText(txt);
	}

	ptList=this.ptList;
	ptCount=ptList.length;
	for(ptNum=0;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];
	    deg=new gis.MU(pt.x,pt.y).toDeg();

		txt='<Placemark>\n'+
			'<name>'+ptNum+'</name>\n'+
			'<Point>\n'+
			'<coordinates>\n'+
			deg.llon+','+deg.llat+',0\n'+
			'</coordinates>\n'+
			'</Point>\n'+
			'</Placemark>\n';
		stream.writeText(txt);
	}

	txt='</Document>\n'+
		'</kml>\n';
	stream.writeText(txt);
};
