goog.provide('reach.out.AVG');

/** @constructor
  * @param {string} path
  * @param {reach.route.Conf} conf */
reach.out.AVG=function(path,conf) {
	/** @type {string} */
	this.path=path;
	/** @type {reach.route.Conf} */
	this.conf=conf;
};

/** @param {reach.loc.InputSet} srcSet
  * @param {reach.loc.InputSet} dstSet
  * @param {Object.<string,reach.route.result.Route>} routeTbl */
reach.out.AVG.prototype.writeRoutes=function(srcSet,dstSet,routeTbl) {
	var conf;
	var srcList,dstList;
	var srcNum,srcCount;
	var dstNum,dstCount;
	var srcLoc,dstLoc;
	var srcFields,dstFields;
	var fieldNum,srcFieldCount,dstFieldCount;
	var route;
	var txt;
	var msg;
	var buf;
	/** @type {FileDescriptor} */
	var fd;

	conf=this.conf;
	srcFieldCount=srcSet.fieldList.length;
	dstFieldCount=dstSet.fieldList.length;

	msg='';

	msg+=(
		'from_id;'+
		'to_id;'+
		'fromid_toid;'+
		'route_number;'+
		'at;'+
		'from_x;'+
		'from_y;'
	);

	for(fieldNum=3;fieldNum<srcFieldCount;fieldNum++) {
		msg+='from_'+srcSet.fieldList[fieldNum].replace(/[. ]/g,'_')+';';
	}

	msg+=(
		'to_x;'+
		'to_y;'
	);

	for(fieldNum=3;fieldNum<dstFieldCount;fieldNum++) {
		msg+='to_'+dstSet.fieldList[fieldNum].replace(/[. ]/g,'_')+';';
	}

	msg+=(
		'total_route_time;'+
		'route_time;'+
		'route_distance;'+
		'route_walks_total_time;'+
		'route_walks_total_distance;'+
		'route_total_lines;'+
		'departure_datetime;'+
		'first_walk_time;'+
		'first_walk_distance;'+
		'first_stop_name;'+
		'first_stop_code;'+
		'last_stop_name;'+
		'last_stop_code;'+
		'last_walk_time;'+
		'last_walk_distance;'+
		'arrival_datetime;'+

		'WALK;'+
		'walk1_departure_time;'+
		'walk1_arrival_time;'+
		'walk1_distance;'+
		'LINE;'+
		'line1_departure_time;'+
		'line1_arrival_time;'+
		'line1_distance;'+
		'line1_code;'+
		'line1_type;'+
		'line1_name;'+
		'line1_first_stop_name;'+
		'line1_first_stop_code;'+
		'line1_last_stop_name;'+
		'line1_last_stop_code;'
	);

	msg+='\n';

	fd=fs.openSync(this.path,'w');
	fs.writeSync(fd,msg,null,'utf8');

	srcList=srcSet.list;
	dstList=dstSet.list;
	srcCount=srcList.length;
	dstCount=dstList.length;
                
	for(srcNum=0;srcNum<srcCount;srcNum++) {
		srcLoc=srcList[srcNum];
		for(dstNum=0;dstNum<dstCount;dstNum++) {
			dstLoc=dstList[dstNum];

			route=routeTbl[srcNum+'\t'+dstNum];

			msg='';
			msg+=srcLoc.id+';';
			msg+=dstLoc.id+';';
			msg+=srcLoc.id+'_'+dstLoc.id+';';
			msg+=1+';';
			if(route) msg+=reach.util.formatMins(route.queryTime/60/conf.timeDiv)+';';
			else msg+='-99999.99;';

			for(fieldNum=1;fieldNum<srcFieldCount;fieldNum++) {
				txt=srcLoc.fieldList[fieldNum];
				if(!txt) txt='';
				msg+=txt+';';
			}

			for(fieldNum=1;fieldNum<dstFieldCount;fieldNum++) {
				txt=dstLoc.fieldList[fieldNum];
				if(!txt) txt='';
				msg+=txt+';';
			}

			if(route && route.outRefList.length>0) {
//console.log(srcLoc.id+' to '+dstLoc.id+' cost '+route.cost);
				msg+=this.printRoute(route);
			} else {
				for(fieldNum=0;fieldNum<16;fieldNum++) msg+='-99999.99;';
			}

			msg+='\n';
			if(typeof(iconv)!='undefined') {
//				buf=new Iconv('UTF-8','ISO-8859-1//IGNORE').convert(msg);
				buf=iconv.encode(msg,'ISO-8859-1');
				fs.writeSync(fd,buf,0,buf.length,null);
			} else {
				fs.writeSync(fd,msg,null,'utf8');
			}
		}
	}

	fs.closeSync(fd);
};

/** @param {reach.route.result.Route} route
  * @return {string} */
reach.out.AVG.prototype.printRoute=function(route) {
	var conf;
	var refNum,refCount;
//	var waitsDuration;
	var totalDist;
	var totalWalkDuration;
	var totalWalkDist;
	var leg;
	var tripLeg;
	var extraLeg;
	var ref,firstTripRef,lastTripRef;
	var msg;

	conf=this.conf;

//	if(conf.forward) waitsDuration=route.startTime+route.duration-route.queryTime;
//	else waitsDuration=route.queryTime-route.startTime;

	firstTripRef=null;
	lastTripRef=null;

	totalDist=0;
	totalWalkDuration=0;
	totalWalkDist=0;

	refCount=route.outRefList.length;
	for(refNum=0;refNum<refCount;refNum++) {
		ref=route.outRefList[refNum];
		leg=ref.leg;

		if(leg.type==reach.route.result.Leg.Type.WALK) {
			totalWalkDuration+=leg.duration;
			totalWalkDist+=leg.dist;
		} else if(leg.type==reach.route.result.Leg.Type.TRANS || leg.type==reach.route.result.Leg.Type.EXTRA) {
			if(!firstTripRef) firstTripRef=ref;
			lastTripRef=ref;
		}

		totalDist+=leg.dist;
	}

	msg='';
	// total_route_time
//	msg+=reach.util.formatMins((route.totalTime/route.sampleCount)/60/conf.timeDiv+0.5)+';';
	msg+=~~((route.totalTime/route.sampleCount)/60/conf.timeDiv+0.5)+';';
	// route_time
//	msg+=reach.util.formatMins(route.duration/60/conf.timeDiv+0.5)+';';
	msg+=~~(route.duration/60/conf.timeDiv+0.5)+';';
	// route_distance
	msg+=(~~(totalDist*10+0.5)/10)+';';
	// route_walks_total_time
//	msg+=reach.util.formatMins(totalWalkDuration/60/conf.timeDiv+0.5)+';';
	msg+=~~(totalWalkDuration/60/conf.timeDiv+0.5)+';';
	// route_walks_total_distance
	msg+=(~~(totalWalkDist*10+0.5)/10)+';';
	// route_total_lines
	msg+=route.tripCount+';';
	// departure.datetime
	msg+=conf.date.year+'-'+conf.date.month+'-'+conf.date.day+' '+reach.util.formatMins(route.startTime/60/conf.timeDiv)+';';

	leg=route.outRefList[0].leg;
	if(leg.type==reach.route.result.Leg.Type.WALK) {
//		walkLeg=/** @type {reach.route.result.OutWalkLeg} */ (ref.leg);
		// first_walk_time
//		msg+=reach.util.formatMins(leg.duration/60/conf.timeDiv+0.5)+';';
		msg+=~~(leg.duration/60/conf.timeDiv+0.5)+';';
		// first_walk_distance
		msg+=(~~(leg.dist*10+0.5)/10)+';';
	} else {
		// first_walk_time
		msg+=';';
		// first_walk_distance
		msg+=';';
	}

	ref=firstTripRef;
	if(ref) {
		if(ref.leg.type==reach.route.result.Leg.Type.EXTRA) {
			// first_stop_name
			msg+=ref.leg.extraLine.ptList[ref.leg.enterPos].name+';';
			// first_stop_code
			msg+=';';
		} else {
			tripLeg=/** @type {reach.route.result.TripLeg} */ (ref.leg);
			// first_stop_name
			msg+=tripLeg.line.stopList[tripLeg.enterPos].name+';';
			// first_stop_code
			msg+=tripLeg.line.stopList[tripLeg.enterPos].origId+';';
		}
	} else {
		// first_stop_name
		msg+=';';
		// first_stop_code
		msg+=';';
	}

	ref=lastTripRef;
	if(ref) {
		if(ref.leg.type==reach.route.result.Leg.Type.EXTRA) {
			// first_stop_name
			msg+=ref.leg.extraLine.ptList[ref.leg.leavePos].name+';';
			// first_stop_code
			msg+=';';
		} else {
			tripLeg=/** @type {reach.route.result.TripLeg} */ (ref.leg);
			// last_stop_name
			msg+=tripLeg.line.stopList[tripLeg.leavePos].name+';';
			// last_stop_code
			msg+=tripLeg.line.stopList[tripLeg.leavePos].origId+';';
		}
	} else {
		// last_stop_name
		msg+=';';
		// last_stop_code
		msg+=';';
	}

	leg=route.outRefList[route.outRefList.length-1].leg;
	if(leg.type==reach.route.result.Leg.Type.WALK && (route.outRefList.length>1 || route.outRefList[0].leg.type!=reach.route.result.Leg.Type.WALK)) {
//		walkLeg=/** @type {reach.route.result.OutWalkLeg} */ (ref.leg);
		// last_walk_time
//		msg+=reach.util.formatMins(leg.duration/60/conf.timeDiv+0.5)+';';
		msg+=~~(leg.duration/60/conf.timeDiv+0.5)+';';
		// last_walk_distance
		msg+=(~~(leg.dist*10+0.5)/10)+';';
	} else {
		// last_walk_time
		msg+=';';
		// last_walk_distance
		msg+=';';
	}

	// arrival_datetime
	msg+=conf.date.year+'-'+conf.date.month+'-'+conf.date.day+' '+reach.util.formatMins((route.startTime+route.duration)/60/conf.timeDiv)+';';

	var routeSep='#';

	for(refNum=0;refNum<refCount;refNum++) {
		ref=route.outRefList[refNum];
		leg=ref.leg;

		if(leg.type==reach.route.result.Leg.Type.WALK) {
//			walkLeg=/** @type {reach.route.result.OutWalkLeg} */ leg;
			msg+='WALK'+routeSep;
			msg+=reach.util.formatMins(ref.startTime/60/conf.timeDiv)+routeSep;
			msg+=reach.util.formatMins((ref.startTime+leg.duration)/60/conf.timeDiv)+routeSep;
			msg+=(~~(leg.dist*10+0.5)/10)+routeSep;
		} else if(leg.type==reach.route.result.Leg.Type.TRANS) {
			tripLeg=/** @type {reach.route.result.TripLeg} */ leg;
			msg+='LINE'+routeSep;
			msg+=reach.util.formatMins(ref.startTime/60/conf.timeDiv)+routeSep;
			msg+=reach.util.formatMins((ref.startTime+leg.duration)/60/conf.timeDiv)+routeSep;
			msg+=(~~(leg.dist*10+0.5)/10)+routeSep;
			msg+=tripLeg.trip.key.longCode+routeSep;
			msg+=tripLeg.trip.key.mode+routeSep;
			msg+=tripLeg.trip.key.shortCode+routeSep;
			msg+=tripLeg.line.stopList[tripLeg.enterPos].name+routeSep;
			msg+=tripLeg.line.stopList[tripLeg.enterPos].origId+routeSep;
			msg+=tripLeg.line.stopList[tripLeg.leavePos].name+routeSep;
			msg+=tripLeg.line.stopList[tripLeg.leavePos].origId+routeSep;
		} else if(leg.type==reach.route.result.Leg.Type.EXTRA) {
			extraLeg=/** @type {reach.route.result.ExtraLeg} */ leg;
			msg+='LINE'+routeSep;
			msg+=reach.util.formatMins(ref.startTime/60/conf.timeDiv)+routeSep;
			msg+=reach.util.formatMins((ref.startTime+leg.duration)/60/conf.timeDiv)+routeSep;
//			msg+=(~~(leg.dist*10+0.5)/10)+routeSep;
			msg+=routeSep;
//			msg+=tripLeg.trip.key.longCode+routeSep;
//			msg+=tripLeg.trip.key.mode+routeSep;
//			msg+=tripLeg.trip.key.shortCode+routeSep;
			msg+=routeSep+routeSep;
			msg+=ref.leg.extraLine.routeId+routeSep;
//			msg+=tripLeg.line.stopList[tripLeg.enterPos].name+routeSep;
//			msg+=tripLeg.line.stopList[tripLeg.enterPos].origId+routeSep;
//			msg+=tripLeg.line.stopList[tripLeg.leavePos].name+routeSep;
//			msg+=tripLeg.line.stopList[tripLeg.leavePos].origId+routeSep;
			msg+=extraLeg.extraLine.ptList[extraLeg.enterPos].name+routeSep;
			msg+=routeSep;
			msg+=extraLeg.extraLine.ptList[extraLeg.leavePos].name+routeSep;
			msg+=routeSep;
		}
	}

	return(msg);
};
