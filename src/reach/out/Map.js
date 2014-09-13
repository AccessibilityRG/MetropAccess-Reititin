goog.provide('reach.out.Map');

/** @constructor
  * @param {reach.map.OpenLayers} map
  * @param {reach.route.Conf} conf */
reach.out.Map=function(map,conf) {
	/** @type {reach.map.OpenLayers} */
	this.map=map;
	/** @type {reach.route.Conf} */
	this.conf=conf;
};

/** @param {reach.loc.InputSet} srcSet
  * @param {reach.loc.InputSet} dstSet
  * @param {Object.<string,reach.route.result.Route>} routeTbl */
reach.out.Map.prototype.writeRoutes=function(srcSet,dstSet,routeTbl) {
	var srcList,dstList;
	var srcNum,srcCount;
	var dstNum,dstCount;
	var srcLoc,dstLoc;

	this.map.routeLayer.removeAllFeatures();

	srcList=srcSet.list;
	dstList=dstSet.list;
	srcCount=srcList.length;
	dstCount=dstList.length;
                
	for(srcNum=0;srcNum<srcCount;srcNum++) {
		srcLoc=srcList[srcNum];
		for(dstNum=0;dstNum<dstCount;dstNum++) {
			dstLoc=dstList[dstNum];

			route=routeTbl[srcNum+'\t'+dstNum];
			if(route) this.drawRoute(route);
		}
	}
};

/** @param {reach.route.result.Route} route */
reach.out.Map.prototype.drawRoute=function(route) {
    var conf;
	var map;
	var refList;
	var legNum,legCount;
	var ref;
	var leg;
	var ptList;
	var ptNum,ptCount;
	var geomList;
	var polyLine;

	conf=this.conf;
	map=this.map;
	walkStyle={'strokeColor':'#ff0000','strokeOpacity':1,'strokeWidth':4};
	rideStyle={'strokeColor':'#4080ff','strokeOpacity':1,'strokeWidth':4};
globalRoute=route;

	refList=route.outRefList;
	legCount=refList.length;
	for(legNum=0;legNum<legCount;legNum++) {
		ref=refList[legNum];
		leg=ref.leg;

		if(leg.type==reach.route.result.Leg.Type.TRANS) {
//console.log(leg);
var tripLeg;
var trip;
var stop;
tripLeg=/** @type {reach.route.result.TripLeg} */ leg;
trip=tripLeg.trip;
console.log(trip.key.longCode);
stop=tripLeg.line.stopList[tripLeg.enterPos];
console.log(reach.util.formatMins(ref.startTime/60/conf.timeDiv)+' '+stop.name);
stop=tripLeg.line.stopList[tripLeg.leavePos];
console.log(reach.util.formatMins((ref.startTime+leg.duration)/60/conf.timeDiv)+' '+stop.name);
		}

		ptList=leg.getPoints(conf,leg.dir,null);
		ptCount=ptList.length;
		geomList=[];

		for(ptNum=0;ptNum<ptCount;ptNum++) {
			ll=ptList[ptNum].toDeg().toGoog();
/*
			DON'T REMOVE THIS PART, IT'S USEFUL FOR DEBUGGING
			i++;
			map.routeLayer.addFeatures([
				new OpenLayers.Feature.Vector(
					OpenLayers.Geometry.Polygon.createRegularPolygon(
						new OpenLayers.Geometry.Point(ll.llon,ll.llat),
						i,8
					),
					null,rideStyle
				)
			]);
*/
			geomList.push(new OpenLayers.Geometry.Point(ll.llon,ll.llat));
		}

		polyLine=new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(geomList),null,leg.type==reach.route.result.Leg.Type.WALK?walkStyle:rideStyle);
		map.routeLayer.addFeatures([polyLine]);
	}
};
