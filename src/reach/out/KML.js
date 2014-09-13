goog.provide('reach.out.KML');

/** @constructor
  * @param {string} path
  * @param {reach.route.Conf} conf */
reach.out.KML=function(path,conf) {
	/** @type {string} */
	this.path=path;
	/** @type {reach.route.Conf} */
	this.conf=conf;
};

/** @param {reach.loc.InputSet} srcSet
  * @param {reach.loc.InputSet} dstSet
  * @param {Object.<string,reach.route.result.Route>} routeTbl */
reach.out.KML.prototype.writeRoutes=function(srcSet,dstSet,routeTbl) {
	var srcList,dstList;
	var srcNum,srcCount;
	var dstNum,dstCount;
	var srcLoc,dstLoc;
	var msg;
	var fd;

	srcList=srcSet.list;
	dstList=dstSet.list;
	srcCount=srcList.length;
	dstCount=dstList.length;

	msg='';
	msg+='<?xml version="1.0" encoding="utf-8" ?>\n';
	msg+='<kml xmlns="http://www.opengis.net/kml/2.2">\n';
	msg+='<Document>\n';
	msg+='<Style id="trans"><LineStyle><color>ff0000ff</color><width>3</width></LineStyle></Style>\n';
	msg+='<Style id="walk"><LineStyle><color>ffff00ff</color><width>3</width></LineStyle></Style>\n';

	fd=fs.openSync(this.path,'w');
	fs.writeSync(fd,msg,null,'utf8');
                
	for(srcNum=0;srcNum<srcCount;srcNum++) {
		srcLoc=srcList[srcNum];

		msg='';
		msg+='<Folder>\n';
		msg+='<name>'+'From '+srcLoc.id+'</name>\n';
		fs.writeSync(fd,msg,null,'utf8');

		for(dstNum=0;dstNum<dstCount;dstNum++) {
			dstLoc=dstList[dstNum];

			route=routeTbl[srcNum+'\t'+dstNum];
			if(route) {
				msg=this.printRoute(route,srcLoc,dstLoc);
				fs.writeSync(fd,msg,null,'utf8');
			}
		}

		msg='';
		msg+='</Folder>\n';
		fs.writeSync(fd,msg,null,'utf8');
	}

	msg='';
	msg+='</Document>\n';
	msg+='</kml>\n';
	fs.writeSync(fd,msg,null,'utf8');

	fs.closeSync(fd);
};

/** @param {reach.route.result.Route} route
  * @param {reach.loc.Outdoor} srcLoc
  * @param {reach.loc.Outdoor} dstLoc */
reach.out.KML.prototype.printRoute=function(route,srcLoc,dstLoc) {
    var conf;
	var refList;
	var legNum,legCount;
	var ref;
	var leg;
	var tripLeg;
	var extraLeg;
	var trip;
	var extra;
	var stop;
	var loc;
	var ptList;
	var ptNum,ptCount;
	var deg;
	var msg;

	conf=this.conf;

	msg='';
	msg+='<Folder>\n';
	msg+='<name>'+'To '+dstLoc.id+'</name>\n';

	msg+='<Placemark>\n';
	msg+='<name>'+reach.util.formatMins(route.startTime/60/conf.timeDiv)+' '+srcLoc.id+'</name>\n';
	msg+='<Point>\n';
	msg+='<coordinates>\n';
	deg=srcLoc.ll.toDeg();
	msg+=deg.llon+','+deg.llat+',0\n';
	msg+='</coordinates>\n';
	msg+='</Point>\n';
	msg+='</Placemark>\n';

	refList=route.outRefList;
	legCount=refList.length;
	for(legNum=0;legNum<legCount;legNum++) {
		ref=refList[legNum];
		leg=ref.leg;
		trip=null;
		extra=null;

		if(leg.type==reach.route.result.Leg.Type.WALK) {
			name='walk '+(~~(leg.dist*10+0.5)/10)+' m';
			style='walk';
		} else if(leg.type==reach.route.result.Leg.Type.TRANS) {
			tripLeg=/** @type {reach.route.result.TripLeg} */ leg;
			trip=tripLeg.trip;
			name=trip.key.longCode;
			style='trans';
		} else if(leg.type==reach.route.result.Leg.Type.EXTRA) {
			extraLeg=/** @type {reach.route.result.ExtraLeg} */ leg;
			extra=leg.extraLine;
			name='extra '+extra.routeId;
			style='trans';
		}

		if(trip) {
			stop=tripLeg.line.stopList[tripLeg.enterPos];
			msg+='<Placemark>\n';
			msg+='<name>'+reach.util.formatMins(ref.startTime/60/conf.timeDiv)+' '+stop.name+'</name>\n';
			msg+='<Point>\n';
			msg+='<coordinates>\n';
			deg=stop.ll.toDeg();
			msg+=deg.llon+','+deg.llat+',0\n';
			msg+='</coordinates>\n';
			msg+='</Point>\n';
			msg+='</Placemark>\n';
		}

		if(extra) {
			loc=extra.ptList[extraLeg.enterPos];
			msg+='<Placemark>\n';
			msg+='<name>'+reach.util.formatMins(ref.startTime/60/conf.timeDiv)+' '+loc.name+'</name>\n';
			msg+='<Point>\n';
			msg+='<coordinates>\n';
			deg=loc.ll.toDeg();
			msg+=deg.llon+','+deg.llat+',0\n';
			msg+='</coordinates>\n';
			msg+='</Point>\n';
			msg+='</Placemark>\n';
		}

		msg+='<Placemark>\n';
		msg+='<name>'+name+'</name>\n';
		msg+='<styleUrl>'+style+'</styleUrl>\n';
		msg+='<LineString>\n';
		msg+='<coordinates>\n';

		ptList=leg.getPoints(conf,leg.dir,null);
		ptCount=ptList.length;

		for(ptNum=0;ptNum<ptCount;ptNum++) {
			deg=ptList[ptNum].toDeg();
			msg+=deg.llon+','+deg.llat+',0\n';
		}

		msg+='</coordinates>\n';
		msg+='</LineString>\n';
		msg+='</Placemark>\n';

		if(trip) {
			stop=tripLeg.line.stopList[tripLeg.leavePos];
			msg+='<Placemark>\n';
			msg+='<name>'+reach.util.formatMins((ref.startTime+leg.duration)/60/conf.timeDiv)+' '+stop.name+'</name>\n';
			msg+='<Point>\n';
			msg+='<coordinates>\n';
			deg=stop.ll.toDeg();
			msg+=deg.llon+','+deg.llat+',0\n';
			msg+='</coordinates>\n';
			msg+='</Point>\n';
			msg+='</Placemark>\n';
		}

		if(extra) {
			loc=extra.ptList[extraLeg.leavePos];
			msg+='<Placemark>\n';
			msg+='<name>'+reach.util.formatMins((ref.startTime+leg.duration)/60/conf.timeDiv)+' '+loc.name+'</name>\n';
			msg+='<Point>\n';
			msg+='<coordinates>\n';
			deg=loc.ll.toDeg();
			msg+=deg.llon+','+deg.llat+',0\n';
			msg+='</coordinates>\n';
			msg+='</Point>\n';
			msg+='</Placemark>\n';
		}
	}

	msg+='<Placemark>\n';
	msg+='<name>'+reach.util.formatMins((route.startTime+route.duration)/60/conf.timeDiv)+' '+dstLoc.id+'</name>\n';
	msg+='<Point>\n';
	msg+='<coordinates>\n';
	deg=dstLoc.ll.toDeg();
	msg+=deg.llon+','+deg.llat+',0\n';
	msg+='</coordinates>\n';
	msg+='</Point>\n';
	msg+='</Placemark>\n';

	msg+='</Folder>\n';

	return(msg);
/*
	walkStyle={'strokeColor':'#ff0000','strokeOpacity':1,'strokeWidth':4};
	rideStyle={'strokeColor':'#4080ff','strokeOpacity':1,'strokeWidth':4};

	refList=route.outRefList;
	legCount=refList.length;
	for(legNum=0;legNum<legCount;legNum++) {
		ref=refList[legNum];
		leg=ref.leg;

		if(leg.type==reach.route.result.Leg.Type.TRANS) {
		}

		ptList=leg.getPoints(conf,leg.dir,null);
		ptCount=ptList.length;
		geomList=[];

		for(ptNum=0;ptNum<ptCount;ptNum++) {
			ll=ptList[ptNum].toDeg().toGoog();
			geomList.push(new OpenLayers.Geometry.Point(ll.llon,ll.llat));
		}

		polyLine=new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(geomList),null,leg.type==reach.route.result.Leg.Type.WALK?walkStyle:rideStyle);
		map.routeLayer.addFeatures([polyLine]);
	}






    legCount=route.refList.length;
    for(legNum=0;legNum<legCount;legNum++) {
        ref=route.refList[legNum];
        leg=ref.leg;
        msg='';

        if(leg.type==reach.route.Leg.Type.WALK) {
            name='walk '+leg.dist+' m';
            style='walk';
        }

        if(leg.type==reach.route.Leg.Type.TRANS) {
            name=leg.trip.key.longCode;
            style='trans';
        }

//if(legNum==0) {
        msg+=(
            '<Placemark>\n'+
            '<name>'+name+'</name>\n'+
            '<styleUrl>'+style+'</styleUrl>\n'+
            '<LineString>\n'+
            '<coordinates>\n'
        );
//}

        ptList=leg.getPoints(conf,ref.dir);
//console.log(leg.dir+'\t'+ref.dir);
        ptCount=ptList.length;
        for(ptNum=0;ptNum<ptCount;ptNum++) {
            deg=ptList[ptNum].toDeg();
            msg+=deg.llon+','+deg.llat+',0\n';
        }
    
//if(legNum==legCount-1) {
        msg+=(
            '</coordinates>\n'+
            '</LineString>\n'+
            '</Placemark>\n'
        );

*/
};
