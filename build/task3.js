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
goog.provide('goog');
goog.provide('reach.data.Link');

/** @constructor
  * @param {*} item */
reach.data.Link=function(item) {
	/** @type {reach.data.Link} */
	this.prev=null;
	/** @type {reach.data.Link} */
	this.next=null;
	/** @type {*} */
	this.item=item;
};
goog.provide('reach.task.Result');

/** @constructor */
reach.task.Result=function() {};
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
goog.provide('reach.task.Task');
goog.provide('reach.task.State');
goog.require('reach.Obj');
goog.require('reach.data.Link');
goog.require('reach.task.Result');

/** @constructor
  * @param {string} name */
reach.task.Task=function(name) {
	var self=this;

	/** @type {number} */
	this.id;

	/** @type {string} */
	this.name=name;

	/** @type {reach.task.Task} */
//	this.parent;
	/** @type {Array.<reach.task.Task>} */
//	this.children;

	/** @type {reach.data.Link} */
	this.runPtr=null;
	/** @type {number} Number of times a task should be polled between checking the system clock. */
	this.pollCount=1;

	/** @type {Array.<reach.task.Task>} */
	this.depList=[];
	/** @type {Array.<reach.task.Task>} */
//	this.depOnceList=[];
	/** @type {Array.<reach.task.Task>} */
	this.nextList=[];
	/** @type {Object.<number|string,boolean>} */
	this.nextTbl={};

	/** @type {reach.control.Dispatch} */
	this.dispatch=null;

	/** @type {number} */
	this.startTime=0;
	/** @type {number} */
	this.endTime=0;
	/** @type {number} */
	this.runTime=0;

	/** @type {reach.task.State} */
	this.state=reach.task.State.NONE;

	/** @type {reach.task.Result} */
	this.result=/** @type {reach.task.Result} */ {};

	/** @type {function():number} */
	this.advance;
};

/** @enum {number} */
reach.task.State={
	NONE:0,
	FUZZY:1,
	RUN:2,
	WAIT:3,
	BLOCK:4,
	DONE:5
};

/** @enum {number} */
reach.task.Health={
	OK:0,
	WARN:1,
	ERR:2
};

/** @param {reach.task.Task} dep */
reach.task.Task.prototype.addDep=function(dep) {
	this.depList.push(dep);
	dep.nextList.push(this);
/*
	if(!dep.dispatch) {
		dep.dispatch=this.dispatch;
		dep.id=this.dispatch.maxTaskId++;
		this.dispatch.taskList[dep.id]=dep;
	}

	if(!this.dispatch) {
		this.dispatch=dep.dispatch;
		this.id=dep.dispatch.maxTaskId++;
		dep.dispatch.taskList[task.id]=task;
	}
*/
};

/** @param {reach.task.Task} dep */
/*
reach.task.Task.prototype.addDepOnce=function(dep) {
	this.depOnceList.push(dep);
};
*/

/** @param {reach.task.Task} next */
reach.task.Task.prototype.addNextOnce=function(next) {
//console.log('Added '+this.name+' ('+this.id+') '+' -> '+next.name+' ('+next.id+')');
	this.nextTbl[next.id]=true;
};

// Called when system wants to start the task, but its dependencies may not be ready.
reach.task.Task.prototype.preInit=function() {};

// Called when task is ready to start.
reach.task.Task.prototype.init=function() {};

reach.task.Task.prototype.run=function() {
	if(this.dispatch) this.dispatch.runTask(this);
};

/** @param {reach.task.Task} child */
reach.task.Task.prototype.runChild=function(child) {
	if(this.dispatch) this.dispatch.runTask(child);
};

/** @return {number} */
reach.task.Task.prototype.block=function() {
	if(this.dispatch) this.dispatch.blockTask(this);
	return(-1);
};

/** @return {number} */
reach.task.Task.prototype.unblock=function() {
	if(this.dispatch) this.dispatch.unblockTask(this);
	return(-1);
};

/** @return {number} */
reach.task.Task.prototype.success=function() {
	if(this.dispatch) this.dispatch.finishTask(this);
	return(0);
};

/** @return {number} */
reach.task.Task.prototype.advance=function() {
    return(0);
};

/** @param {reach.task.Health} code
  * @param {string} msg */
reach.task.Task.prototype.showMessage=function(code,msg) {
	console.log(msg);
};
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
			if(typeof(Iconv)!='undefined') {
				buf=new Iconv('UTF-8','ISO-8859-1//IGNORE').convert(msg);
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
goog.provide('reach.Deg');

/** @constructor
  * @param {number} lat
  * @param {number} lon */
reach.Deg=function(lat,lon) {
	/** @type {number} */
	this.llat=lat;
	/** @type {number} */
	this.llon=lon;
};

/** @return {string} */
reach.Deg.prototype.format=function() {
	return(reach.util.round(this.llat,100000)+(this.llat<0?'S':'N')+', '+reach.util.round(this.llon,100000)+(this.llon<0?'W':'E'));
};

reach.Deg.prototype.toString=reach.Deg.prototype.format;

/** @return {reach.MU} */
reach.Deg.prototype.toMU=function() {
	var r=reach.MU.range/2;

	return(new reach.MU(
		~~((Math.log(Math.tan((this.llat+90)*Math.PI/360))/Math.PI+1)*r),
		~~((this.llon/180+1)*r)
	));
};

/** @return {{llat:number,llon:number}} */
reach.Deg.prototype.toGoog=function() {
	var r=reach.MU.major;

	return(/** @lends {reach.Deg.prototype} */ {
		llat:Math.log(Math.tan((this.llat+90)*Math.PI/360))*r,
		llon:this.llon/180*Math.PI*r
	});
};

/** @param {number} lat
  * @param {number} lon
  * @return {reach.Deg} */
reach.Deg.fromGoog=function(lat,lon) {
	var r=reach.MU.major;

	return(new reach.Deg(Math.atan(Math.exp(lat/r))*360/Math.PI-90,lon*180/r/Math.PI));
};
goog.provide('reach.MU');
goog.require('reach.Deg');

/** @constructor
  * @param {number} lat
  * @param {number} lon */
reach.MU=function(lat,lon) {
	/** @type {number} */
	this.llat=lat;
	/** @type {number} */
	this.llon=lon;
};

/** @type {number} */
reach.MU.range=1<<30;
/** @type {number} */
reach.MU.flatten=1/298.257223563;
/** @type {number} */
reach.MU.major=6378137;
/** @type {number} */
reach.MU.minor=reach.MU.major*(1-reach.MU.flatten);

/** @return {string} */
reach.MU.prototype.toString=function() {
	return(this.llat+','+this.llon);
};

/** @return {string} */
reach.MU.prototype.pretty=function() {
	return('('+this.llat+', '+this.llon+')');
};

reach.MU.prototype.toDebug=function() {
	var deg;

	deg=this.toDeg();

	return({lat:deg.llat,lon:deg.llon});
};

/** @return {reach.Deg} */
reach.MU.prototype.toDeg=function() {
	return(new reach.Deg(
		Math.atan(Math.exp((this.llat/reach.MU.range*2-1)*Math.PI))*360/Math.PI-90,
		(this.llon/reach.MU.range*2-1)*180
	));
};

/** @param {number} north Movement northward in meters.
  * @param {number} east Movement eastward in meters.
  * @return {reach.MU} */
reach.MU.prototype.offset=function(north,east) {
	var scale;
	var f,t;

	// Tangent of latitude.
	t=Math.exp((this.llat/reach.MU.range*2-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=reach.MU.range/(reach.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=reach.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	return(new reach.MU(
		this.llat+scale/(1+( t*3-f )/2)*north,
		this.llon+scale/(1+( t+f )/2)*east
	));
};

/** Fast approximate distance calculation on ellipsoidal surfaces, intended for points <1km apart and not right on the polar ice caps.
  * @param {reach.MU} ll
  * @return {number} Distance in meters. */
reach.MU.prototype.distTo=function(ll) {
	var scale;
	var f,t;
	var north,east;

	// Tangent of average latitude.
	t=Math.exp(((this.llat+ll.llat)/reach.MU.range-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=reach.MU.range/(reach.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=reach.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	// Calculate displacement in rectangular coordinates in meters.
	north=(ll.llat-this.llat)*(1+( t*3-f )/2)/scale;
	east=(ll.llon-this.llon)*(1+( t+f )/2)/scale;

	return(Math.sqrt(north*north+east*east));
};

/*
function getMetersPerOsmUnit(lat) {
    var r=536870912;
    var x=Math.exp((lat-r)*2*Math.PI/r);
    var scale=2/Math.sqrt(2+1/x+x); // Note: cosh(lat)=(1/x+x)/2

    return(reach.conf.earthRadiusMeters*Math.PI/r*scale);
}
*/
goog.provide('reach.XY');

/** @constructor
  * @param {number} x
  * @param {number} y */
reach.XY=function(x,y) {
	/** @type {number} */
	this.xx=x;
	/** @type {number} */
	this.yy=y;
};

reach.XY.prototype.toString=function() {
    return(this.xx+','+this.yy);
};
goog.provide('reach.util');
goog.require('reach.XY');
goog.require('reach.MU');

/** @constructor */
reach.util=function() {};

/** @param {string} msg */
reach.util.warn=function(msg) {
	console.log('WARNING: '+msg);
};

/** @param {number} a
  * @param {number} b
  * @return {number} */
reach.util.zip=function(a,b) {
	a=(a|(a<<4))&0x0f0f;
	a=(a|(a<<2))&0x3333;
	a=(a|(a<<1))&0x5555;

	b=(b|(b<<4))&0x0f0f;
	b=(b|(b<<2))&0x3333;
	b=(b|(b<<1))&0x5555;

	return((a<<1)|b);
};

/** @param {number} b
  * @return {Array.<number>} */
reach.util.unzip=function(b) {
	var a;

	a=(b>>1)&0x5555;
	b&=0x5555;

	a=(a|(a>>1))&0x3333;
	a=(a|(a>>2))&0x0f0f;
	a=(a|(a>>4))&0x00ff;

	b=(b|(b>>1))&0x3333;
	b=(b|(b>>2))&0x0f0f;
	b=(b|(b>>4))&0x00ff;

	return([a,b]);
};

/** @param {number} t
  * @return {string} */
reach.util.formatMins=function(t) {
	var h,m;

	h=~~(t/60);
	m=~~(t%60+0.5);

	if(m==60) {
		h++;
		m=0;
	}

	if(h<10) h='0'+h;
	if(m<10) m='0'+m;

	return(h+':'+m);
};

/** @param {number} t
  * @return {string} */
reach.util.formatSecs=function(t) {
	var h,m,s;

	t=~~(t+0.5);

	s=t%60;
	t=(t-s)/60;
	m=t%60;
	t=(t-m)/60;
	h=t;

	if(h<10) h='0'+h;
	if(m<10) m='0'+m;
	if(s<10) s='0'+s;

	return(h+':'+m+':'+s);
};

/** @param {number} t
  * @return {string} */
reach.util.formatMilli=function(t) {
	var h,m,s,milli;

	if(t<0) t=0;

	milli=t%1000;
	t=(t-milli)/1000;
	s=t%60;
	t=(t-s)/60;
	m=t%60;
	t=(t-m)/60;
	h=t;

	return((h?reach.util.pad(h,2)+':':'')+reach.util.pad(m,2)+':'+reach.util.pad(s,2)+'.'+reach.util.pad(milli,3));
};

/** @param {boolean} ok
  * @param {string} func
  * @param {string} msg */
reach.util.assert=function(ok,func,msg) {
	if(!ok) console.log('Assert failed in function '+func+': '+msg);
};

/** @param {number} n
  * @return {number} */
reach.util.fromSigned=function(n) {
	return(n<0?(((-n)<<1)-1):(n<<1));
};

/** @param {number} n
  * @return {number} */
reach.util.toSigned=function(n) {
	return((n&1)?-(n>>1)-1:(n>>1));
};

/** @param {number|string} n
  * @param {number} width
  * @return {string} */
reach.util.pad=function(n,width) {
	var len;

	n=''+n;
	len=n.length;
	if(len>=width) return(n);

	return(new Array(width-n.length+1).join('0')+n);
};

/** @param {number|string} txt
  * @param {number} width
  * @param {boolean} rightAlign
  * @return {string} */
reach.util.padSpace=function(txt,width,rightAlign) {
	var len;

	txt=''+txt;
	len=txt.length;
	if(len>width) {
		if(width<3) return(txt.substr(0,width));
		return(txt.substr(0,width-3)+'...');
	}

	if(rightAlign) return(new Array(width-txt.length+1).join(' ')+txt);
	return(txt+new Array(width-txt.length+1).join(' '));
};

/** @param {number} n
  * @param {number} prec
  * @return {number} */
reach.util.round=function(n,prec) {
	if(n<0) prec=-prec;
	return(~~(n*prec+0.5)/prec);
};

/** @param {Array.<number>} data
  * @return {{count:number,mean:number,variance:number,low:number,high:number}} */
reach.util.getStats=function(data) {
	var i,count;
	var x,sum;
	var mean,variance;
	var low,high;

	count=data.length;

	sum=0;
	for(i=0;i<count;i++) sum+=data[i];
	mean=sum/count;

	sum=0;
	low=data[0];
	high=low;

	for(i=0;i<count;i++) {
		x=data[i];
		if(x<low) low=x;
		if(x>high) high=x;
		x-=mean;
		sum+=x*x;
	}
	variance=sum/count;

	return({count:count,mean:mean,variance:variance,low:low,high:high});
};

/** @param {Element|Document} elem
  * @param {string} name
  * @param {string} type
  * @param {function(Event,Element|Document,string)} handler
  * @return {function(Event)} */
reach.util.bindEvent=function(elem,name,type,handler) {
	/** @param {Event} evt */
	function wrapper(evt) {
		if(!evt) evt=/** @type {Event} */window.event;
		handler(evt,elem,name);
	}

	elem.addEventListener(type,wrapper,true);

	return(wrapper);
};

/** @param {Element|Document} elem
  * @param {string} name
  * @param {string} type
  * @param {function(Event)} wrapper */
reach.util.releaseEvent=function(elem,name,type,wrapper) {
	elem.removeEventListener(type,wrapper,true);
};

/** @param {Event} evt
  * @param {Element} elem
  * @return {reach.XY} */
reach.util.getEventXY=function(evt,elem) {
	var x,y;

	x=0;
	y=0;

	if(evt.pageX || evt.pageY) {
		x=evt.pageX;
		y=evt.pageY;
	} else if(evt.clientX || evt.clientY) {
		x=evt.clientX+document.body.scrollLeft+document.documentElement.scrollLeft;
		y=evt.clientY+document.body.scrollTop+document.documentElement.scrollTop;
	}

	x-=elem.offsetLeft;
	y-=elem.offsetTop;

	return(new reach.XY(x,y));
};

/** @param {reach.Deg} ll1
  * @param {reach.Deg} ll2
  * @return {?number} Distance in meters. */
reach.util.vincenty=function(ll1,ll2) {
	// Adapted from http://www.movable-type.co.uk/scripts/latlong-vincenty.html
	// MIT-licensed JavaScript code in GeographicLib gives more accuracy but takes over 1000 lines of code.

	var f=reach.MU.flatten;
	var a=reach.MU.major;
	var b=reach.MU.minor;
	var lonDiff=(ll2.llon-ll1.llon)*Math.PI/180;
	var U1=Math.atan((1-f)*Math.tan(ll1.llat*Math.PI/180));
	var U2=Math.atan((1-f)*Math.tan(ll2.llat*Math.PI/180));
	var sinU1U2,cosU1U2;
	var sinU1=Math.sin(U1),cosU1=Math.cos(U1);
	var sinU2=Math.sin(U2),cosU2=Math.cos(U2);
	var sigma,sinAlpha,cosAlpha2;
	var lambda,lambdaPrev;
	var sinLambda,cosLambda;
	var sinSigma,cosSigma;
	var iterLimit;
	var ss1,ss2;
	var cos2SigmaM;
	var A,B,C;
	var u2;

	lambda=lonDiff;
	iterLimit=16;

	sinU1U2=sinU1*sinU2;
	cosU1U2=cosU1*cosU2;

	do {
		sinLambda=Math.sin(lambda);
		cosLambda=Math.cos(lambda);

		ss1=cosU2*sinLambda;
		ss2=cosU1*sinU2 - sinU1*cosU2*cosLambda;

		sinSigma=Math.sqrt(ss1*ss1 + ss2*ss2);
		if(sinSigma==0) return(0);	// Both points are equal.
		cosSigma=sinU1U2 + cosU1U2*cosLambda;
		sigma=Math.atan2(sinSigma,cosSigma);

		sinAlpha=cosU1U2*sinLambda/sinSigma;
		cosAlpha2=1-sinAlpha*sinAlpha;
		if(cosAlpha2==0) cos2SigmaM=0;	// Crossing Equator.
		else cos2SigmaM=cosSigma-2*sinU1U2/cosAlpha2;
		C=f/16*cosAlpha2*(4+f*(4-3*cosAlpha2));

		lambdaPrev=lambda;
		lambda=lonDiff + (1-C)*f*sinAlpha*(
			sigma + C*sinSigma*(
				cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)
			)
		);
	} while(Math.abs(lambda-lambdaPrev)>1e-12 && iterLimit--);

	if(iterLimit==0) return(null);		// Didn't converge to a result.

	u2=cosAlpha2*(a*a - b*b)/(b*b);
	A=1 + u2/16384*(4096+u2*(-768+u2*(320-175*u2)));
	B=u2/1024*(256+u2*(-128+u2*(74-47*u2)));

	return(
		b*A*(sigma-(
			B*sinSigma*(
				cos2SigmaM+B/4*(
					cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)
					-
					B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)
				)
			)
		))
	);
};
goog.provide('reach.task.FetchResult');
goog.require('reach.task.Result');

/** @constructor
  * @extends {reach.task.Result} */
reach.task.FetchResult=function() {
	/** @type {?string} */
	this.data;
};

reach.inherit(reach.task.FetchResult,reach.task.Result);
goog.provide('reach.task.Fetch');
goog.require('reach.task.FetchResult');
goog.require('reach.task.Task');

/** @constructor
  * @extends {reach.task.Task}
  * @param {string} name
  * @param {string} url
  * @param {string?} encoding */
reach.task.Fetch=function(name,url,encoding) {
	reach.task.Task.call(this,name);

	/** @type {string} */
	this.url=url;

	if(!encoding) encoding='utf8';
	/** @type {string} */
	this.encoding=encoding;

	/** @type {reach.task.FetchResult} */
	this.result=new reach.task.FetchResult();
};

reach.inherit(reach.task.Fetch,reach.task.Task);

reach.task.Fetch.prototype.init=function() {
	/** @type {reach.task.Fetch} */
	var self=this;

	this.advance=function() {
		/** @type {XMLHttpRequest} */
		var http;

		if(typeof(XMLHttpRequest)!='undefined') {
			http=new XMLHttpRequest();
			http.onreadystatechange=function() {
				if(http.readyState==4) {
					if(http.status==200) {
						self.result.data=http.responseText;
						self.success();
					} else {
						// TODO: add more error handling.
						self.result.data=null;
						self.success();
					}
				}
			};

			http.open('GET',self.url,true);
			http.send(null);
		} else if(typeof(fs)!='undefined') {
			/** It's important not to pass encoding to readFile, so it'll return raw bytes for proper charset conversion.
			  * @param {{errno:number,code:string,path:string}} err
			  * @param {string} data */
			fs.readFile(self.url,function(err,data) {
				if(!err) {
					self.state.stepCount=data.length;
					if(typeof(Iconv)!='undefined') {
						self.result.data=new Iconv(self.encoding,'UTF-8//IGNORE').convert(data).toString();
					} else {
						self.result.data=data.toString();
					}
					self.success();
				} else if(err.code=='EMFILE') {
					// Out of file handles, should retry on next tick.
					self.unblock();
				}
			});
		}

		return(self.block());
	}
};
goog.provide('reach.data.Codec');

/** @constructor */
reach.data.Codec=function() {
	//                  1         2         3         4         5         6         7         8         9
	//        0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
	var tbl="\n!#$%()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~";
//	var b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	/** @type {Array.<string>} */
//	var enc=[];
	/** @type {Array.<number>} */
	var dec=[];
	var i;

	for(i=0;i<tbl.length;i++) {
		dec[tbl.charCodeAt(i)]=i;
//		enc[i]=tbl.charAt(i);
	}

	/** @type {Array.<string>} */
	this.encTbl=tbl.split('');
	/** @type {Array.<number>} */
	this.decTbl=dec;
	/** @type {number} */
	this.extra=tbl.length-64;

//	dec=/** @type {Array.<number>} */ [];
//	for(i=0;i<b64.length;i++) {
//		dec[b64.charCodeAt(i)]=i;
//	}

	/** @type {Array.<number>} */
//	this.oldDecTbl=dec;

	/** @type {number} */
	this.minRefLen=2;
};

/*
reach.data.Codec.test=function() {
	var codec=new reach.data.Codec();
	var i,j,n;
	var txt,code;

	for(j=0;j<100000;j++) {
		n=Math.random()*32;
		txt='';
		for(i=0;i<n;i++) txt+=Math.random()<0.5?'0':'1';
		code=codec.encodeShort(codec.validBitsToList(txt));
		if(codec.validListToBits(codec.decodeShort(code,0,-1).slice(1))!=txt) {
			console.log('error');
		}
	}
};
*/

/** @param {string} txt
  * @return {Array.<number>} */
reach.data.Codec.prototype.validBitsToList=function(txt) {
	var data;
	var i,len;
	var n;

	len=txt.length;
	data=[len];
	n=0;

	for(i=0;i<len;i++) {
		n<<=1;
		if(txt.charAt(i)!=0) n++;
		if(i%6==5) {
			data.push(n);
			n=0;
		}
	}

	i%=6;
	if(i) data.push(n<<(6-i));

	return(data);
};

/** @param {Array.<number>} data
  * @return {string} */
reach.data.Codec.prototype.validListToBits=function(data) {
	var n,bits;
	var i,len;

	len=data[0];
	bits=[];

	n=data[1];
	for(i=0;i<len;i++) {
		bits[i]=(n&32)?'1':'0';
		n<<=1;
		if(i%6==5) n=data[(i+7)/6];
	}

	return(bits.join(''));
};

/** @param {Array.<number>} data
  * @return {string} */
reach.data.Codec.prototype.encodeShort=function(data) {
	var enc=this.encTbl;
	var extra=this.extra;
	var c;
	var i,l,x;
	var result;

	result=/** @type {Array.<string>} */ [];

	l=data.length;
	i=l;
	while(i--) {
		x=data[i];
		result.push(enc[x&63]);
		x>>=6;

		while(x) {
			c=x%extra;
			x=(x-c)/extra;
			result.push(enc[c+64]);
		}
	}

	result.reverse();
	return(result.join(''));
};

/** @param {Array.<number>} data
  * @return {string} */
reach.data.Codec.prototype.encodeLong=function(data) {
	var enc=this.encTbl;
	var extra=this.extra;
	var c;
	var i,l,x;
	var result;

	result=/** @type {Array.<string>} */ [];

	l=data.length;
	i=l;
	while(i--) {
		x=data[i];
		c=x%extra;
		x=(x-c)/extra;
		result.push(enc[c+64]);

		while(x) {
			result.push(enc[x&63]);
			x>>=6;
		}
	}

	result.reverse();
	return(result.join(''));
};

/** @param {string} data
  * @param {number} pos
  * @param {number} count -1 for unlimited
  * @return {Array.<number>} */
reach.data.Codec.prototype.decodeShort=function(data,pos,count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var c;
	var len,x,n;
	var result;

	result=/** @type {Array.<number>} */ [];
	len=data.length;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])>=64) x=x*extra+c-64;
		result[n++]=(x<<6)+c;
	}

	result[count]=pos;
	return(result);
};

/** @param {string} data
  * @param {number} pos
  * @param {number} count
  * @return {Array.<number>} */
reach.data.Codec.prototype.decodeLong=function(data,pos,count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var c;
	var len,x,n;
	var result;

	result=/** @type {Array.<number>} */ [];
	len=data.length;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])<64) x=(x<<6)+c;
		result[n++]=x*extra+c-64;
	}

	result[count]=pos;
	return(result);
};

/** @param {string} data
  * @return {Array.<number>} */
reach.data.Codec.prototype.decodeOld=function(data) {
	var dec=this.oldDecTbl;
	var result=[];
	var i,j,len;
	var c;
	var n;

	len=data.length;

	n=0;
	j=0;
	for(i=0;i<len;i++) {
		c=dec[data.charCodeAt(i)];
		n=n*32+(c&31);
		if(c<32) {
			result[j++]=(n>>1)*(1-(n&1)*2);
			n=0;
		}
	}

	return(result);
};

/** @param {string} data
  * @param {number} repLen
  * @param {number} dictSize -1 for unlimited, 0 for no compression, >0 for specific size in chars.
  * @return {string} */
reach.data.Codec.prototype.compressBytes=function(data,repLen,dictSize) {
	var minRefLen=this.minRefLen;
	var dataPos,dataLen;
	var bufLen,dictLen,plainLen;
	var buf,dict,plain;
	var len,bestLen,bestPos;
	var ref;
	var result;
	var i;

	result=[];
	buf=[];
	bufLen=0;
	dict=[];
	dictLen=0;
	plain=[];
	plainLen=0;

	dataLen=data.length;
	for(dataPos=0;dataPos<dataLen || bufLen>0;) {
		while(bufLen<repLen && dataPos<dataLen) {
			buf.push(data.charAt(dataPos++));
			bufLen++;
		}

		bestLen=0;
		bestPos=0;

		for(i=dictLen;i--;) {
			for(len=0;len<bufLen;len++) {
				if(buf[len]!=dict[i+len%(dictLen-i)]) break;
			}

			if(len-(i>dictLen-1-64?0:1)>bestLen) {
				bestLen=len;
				bestPos=i;
			}
		}

		ref='';
		if(bestLen>=minRefLen) {
			ref=this.encodeShort([reach.util.fromSigned(bestLen-minRefLen),dictLen-1-bestPos]);
		}

		if(bestLen<minRefLen || bestLen<=ref.length+(plainLen==0?0:1)) {
			plain.push(buf[0]);
			plainLen++;
			dict.push(buf[0]);
			if(dictLen==dictSize) dict.shift();
			else dictLen++;
			buf.shift();
			bufLen--;
		} else {
			if(plainLen>0) {
				result.push(this.encodeShort([reach.util.fromSigned(-plainLen)])+plain.join(''));
				plain=[];
				plainLen=0;
			}
			result.push(ref);
			buf.splice(0,bestLen);
			bufLen-=bestLen;

			if(bestLen>dictLen-bestPos) bestLen=dictLen-bestPos;
			dict.push.apply(dict,dict.slice(bestPos,bestPos+bestLen));
			dictLen+=bestLen;

			if(dictSize>=0 && dictLen>dictSize) {
				dict.splice(0,dictLen-dictSize);
				dictLen=dictSize;
			}
		}
	}

	if(plainLen>0) {
		result.push(this.encodeShort([reach.util.fromSigned(-plainLen)])+plain.join(''));
	}

	return(result.join(''));
};

/** @param {string} enc
  * @param {number} first
  * @param {number} len
  * @param {number} dictSize
  * @return {{pos:number,data:string}} */
reach.data.Codec.prototype.decompressBytes=function(enc,first,len,dictSize) {
	var minRefLen=this.minRefLen;
	var chars,store;
	var plain;
	var dict;
	var data;
	var pos,rep,count,outPos;
	var dist,ref;
	var dec;

	data=[];
	dict=[];
	pos=first;
	outPos=0;

	while(pos<first+len) {
		dec=this.decodeShort(enc,pos,1);
		pos=dec[1];
		rep=reach.util.toSigned(dec[0]);

		if(rep<0) {
			plain=enc.substr(pos,-rep);
			store=plain.split('');

			data.push(plain);
			outPos-=rep;
			pos-=rep;
		} else {
			rep+=minRefLen;
			dec=this.decodeShort(enc,pos,1);
			pos=dec[1];
			dist=dec[0]+1;
			ref=dict.length-dist;
			store=null;

			while(rep) {
				count=rep;
				if(count>dist) count=dist;

				chars=dict.slice(ref,ref+count);
				if(!store) store=chars;

				data.push(chars.join(''));
				outPos+=count;
				rep-=count;
			}
		}

		dict.push.apply(dict,store);
		if(dictSize>=0 && dict.length>dictSize) dict.splice(0,dict.length-dictSize);
	}

	return({pos:pos,data:data.join('')});
};
goog.provide('reach.data.Checksum');

/** @constructor */
reach.data.Checksum=function() {
//	var poly=0x82f63b78; (Castagnoli) Btrfs
//	var poly=0xeb31d82e; (Koopman)
//	var poly=0xedb88320; Ethernet, Gzip, PNG
	var poly=0xedb88320;
	var i,j,crc;
	var tbl;

	tbl=/** @type {Array.<number>} */ [];

	for(i=0;i<256;i++) {
		crc=i;
		for(j=8;j--;) {
			crc=((crc>>>1)^(-(crc&1)&poly))>>>0;
		}
		tbl[i]=crc;
	}

	this.tbl=tbl;
	this.crc=0xffffffff;
};

/** @param {string} data
  * @param {number} pos
  * @param {number} len
  * @return {number} */
reach.data.Checksum.prototype.append=function(data,pos,len) {
	var tbl;
	var crc;

	tbl=this.tbl;
	crc=this.crc;
	while(len--) crc=(crc>>>8)^tbl[(crc&255)^data.charCodeAt(pos++)];
	this.crc=crc;

	return((crc^0xffffffff)>>>0);
};
goog.provide('reach.data.Stream');
goog.require('reach.data.Codec');
goog.require('reach.data.Checksum');

/** @constructor
  * @param {string} data */
reach.data.Stream=function(data) {
	/** @type {string} */
	this.data=data;
	/** @type {number} */
	this.pos=0;
	/** @type {number} */
	this.len=data.length;

	/** @type {reach.data.Codec} */
	this.codec=new reach.data.Codec();
	/** @type {Array.<number>} */
	this.decTbl=this.codec.decTbl;
	/** @type {number} */
	this.extra=this.codec.extra;

	/** @type {reach.data.Checksum} */
	this.check=new reach.data.Checksum();
};

/** @param {number} count
  * @return {Array.<number>} */
reach.data.Stream.prototype.readShort=function(count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var data;
	var pos;
	var c;
	var len,x,n;
	var result;

	data=this.data;
	pos=this.pos;
	result=/** @type {Array.<number>} */ [];
	len=this.len;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])>=64) x=x*extra+c-64;
		result[n++]=(x<<6)+c;
	}

	this.pos=pos;
	return(result);
};

/** @param {number} count
  * @return {Array.<number>} */
reach.data.Stream.prototype.readLong=function(count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var data;
	var pos;
	var c;
	var len,x,n;
	var result;

	data=this.data;
	pos=this.pos;
	result=/** @type {Array.<number>} */ [];
	len=this.len;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])<64) x=(x<<6)+c;
		result[n++]=x*extra+c-64;
	}

	this.pos=pos;
	return(result);
};

/** @param {number} len
  * @param {number} dictSize
  * @return {string} */
reach.data.Stream.prototype.readPack=function(len,dictSize) {
	var dec;

	dec=this.codec.decompressBytes(this.data,this.pos,len,dictSize);
	this.pos=dec.pos;

	return(dec.data);
};

/** @param {number} len
  * @return {number} */
reach.data.Stream.prototype.verify=function(len) {
	return(this.check.append(this.data,this.pos,len));
};
goog.provide('reach.task.ImageResult');
goog.require('reach.task.Result');

/** @constructor
  * @extends {reach.task.Result} */
reach.task.ImageResult=function() {
	/** @type {Image} */
	this.img;
};

reach.inherit(reach.task.ImageResult,reach.task.Result);
goog.provide('reach.task.Image');
goog.require('reach.task.ImageResult');
goog.require('reach.task.Task');

/** @constructor
  * @extends {reach.task.Task}
  * @param {string} name
  * @param {string} url */
reach.task.Image=function(name,url) {
	reach.task.Task.call(this,name);

	/** @type {string} */
	this.url=url;

	/** @type {reach.task.ImageResult} */
	this.result=new reach.task.ImageResult();
};

reach.inherit(reach.task.Image,reach.task.Task);

reach.task.Image.prototype.init=function() {
	/** @type {reach.task.Image} */
	var self=this;
	/** @type {Image} */
	var img;

	if(typeof(Image)!='undefined') {
		img=new Image();

		img.onload=function() {
			self.result.img=img;
			self.success();
		};

		img.onerror=function() {
			self.result.img=null;
			self.success();
		};

		img.src=this.url;
	}

	this.block();
};
goog.provide('reach.core.Date');

/** @constructor
  * @param {number} jd */
reach.core.Date=function(jd) {
	var year,month,day;
	var century;
	var isoWeekDay,weekDay,yearDay,isoYear,isoWeek;
	var jd1,jd4;
	var y;

	/** @param {number} jd */
	function getYMD(jd) {
		var century,centuryDay,yearDay;

		// Make the year start on March 1st so the weird month of February is moved to the end.
		jd+=305;
		// 146097 is the number of days in 400 years.
		century=~~((jd*4+3)/146097);
		centuryDay=jd-((century*146097)>>2);
		// 1461 is the number of days in 4 years.
		year=~~((centuryDay*4+3)/1461);
		yearDay=centuryDay-((year*1461)>>2);
		// 153 is the number of days in 5-month periods Mar-Jul and Aug-Dec. Here month 0 is March.
		month=~~((5*yearDay+2)/153);

		day=yearDay-~~((month*153+2)/5)+1;
		// Offset months so counting starts from 1 and March becomes 3.
		month=(month+2)%12+1;
		// If month is Jan-Feb, increment year because it was effectively decremented when years were modified to start on March 1st.
		year=century*100+year+((18-month)>>4);
	}

	// US day of the week minus one, 0 is Sunday.
	weekDay=jd%7;
	// ISO day of the week minus one, 0 is Monday.
	isoWeekDay=(jd+6)%7;


	// Handle ISO week which belongs to the year its Thursday falls on.
	// Process Julian day on this week's Thursday.
	getYMD(jd-isoWeekDay+3);
	isoYear=/** @type {number} */ year;

	y=isoYear-1;
	century=~~(y/100);
	// Julian day of Sunday before this ISO year's January 4th.
	jd4=(century>>2)-century+(y>>2)+y*365+3;
	jd4-=jd4%7;
	// Calculate ISO week number.
    isoWeek=~~((jd-jd4+6)/7);

	getYMD(jd);

	y=year-1;
	century=~~(y/100);
	// Julian day of the last day of previous year.
	jd1=(century>>2)-century+(y>>2)+y*365;
	// Get day number of the year by comparing with last day of previous year.
	yearDay=jd-jd1;

	/** @type {number} */
	this.jd=jd;
	/** @type {number} */
	this.year=year;
	/** @type {number} */
	this.month=month;
	/** @type {number} */
	this.day=day;
	/** @type {number} */
	this.weekDay=weekDay;
	/** @type {number} */
	this.yearDay=yearDay;
	/** @type {number} */
	this.isoYear=isoYear;
	/** @type {number} */
	this.isoWeek=isoWeek;
};

/** @param {number} year
  * @param {number} month
  * @param {number} day
  * @return {reach.core.Date} */
reach.core.Date.fromYMD=function(year,month,day) {
	var y,century,leapDays;

	if(isNaN(year) || isNaN(month) || isNaN(day) || month<1 || month>12 || day<1 || day>31) return(null);

	// ((18-month)>>4)==1 if month<=2, else 0.
	// if month<=2 then this year's leap status doesn't affect julian day, so check cumulative leap years only until previous year.
	y=year-((18-month)>>4);
	century=~~(y/100);
	leapDays=(century>>2)-century+(y>>2);

	return(new reach.core.Date(~~(((month+9)%12*153+2)/5)+leapDays+y*365+day-306));
};

/** @return {string} */
reach.core.Date.prototype.toFull=function() {
	/** @type {Array.<string>} */
	var weekDays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	/** @type {Array.<string>} */
	var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

	/** @param {number} n
	  * @param {number} width
	  * @return {string} */
	function pad(n,width) {
		return(new Array(width-(''+n).length+1).join('0')+n);
	}

	return(
		pad(this.year,4)+'-'+pad(this.month,2)+'-'+pad(this.day,2)+
		' '+
		pad(this.isoYear,4)+'-W'+pad(this.isoWeek,2)+'-'+((this.weekDay+6)%7+1)+
		' '+
		this.jd+
		' '+
		weekDays[this.weekDay]+
		' '+
		this.day+' '+months[this.month-1]+' '+this.year
	);
};

/** @return {string} */
reach.core.Date.prototype.format=function() {
	/** @param {number} n
	  * @param {number} width
	  * @return {string} */
	function pad(n,width) {
		return(new Array(width-(''+n).length+1).join('0')+n);
	}

	return(pad(this.year,4)+'-'+pad(this.month,2)+'-'+pad(this.day,2));
};

reach.core.Date.prototype.toString=reach.core.Date.prototype.format;
goog.provide('reach.io.Query');

/** @constructor */
reach.io.Query=function() {
	/** @type {Fiber.Fiber} */
	this.fiber=Fiber.current;
};

/** @param {Object.<string,string|number>} row */
reach.io.Query.prototype.addRow=function(row) {
	this.fiber.run(row);
};

reach.io.Query.prototype.finish=function() {
	this.fiber.run(null);
};

/** @return {?Object.<string,string|number>} */
reach.io.Query.prototype.getRow=function() {
	return(/** @type {?Object.<string,string|number>} */ global.yield());
};
goog.provide('reach.io.SQL');
goog.require('reach.io.Query');

/** @constructor
  * @param {string} name */
reach.io.SQL=function(name) {
	this.db=new sqlite3.Database(name,sqlite3.OPEN_READONLY);
};

/** @param {string} sql
  * @return {reach.io.Query} */
reach.io.SQL.prototype.query=function(sql) {
	var query;
	var i,l;
	var arg;

	query=new reach.io.Query();

	/** @param {string} err
	  * @param {Object.<string,*>} row */
	function rowHandler(err,row) {
		(/** @type {reach.io.Query} */ query).addRow(row);
	}

	l=arguments.length;
	arg=[];
	for(i=0;i<l;i++) arg.push(arguments[i]);
	arg.push(rowHandler);
	arg.push(function() {(/** @type {reach.io.Query} */ query).finish();});

	this.db.each.apply(this.db,arg);

	return(query);
};
goog.provide('reach.road.Node');
//goog.require('reach.route.InputPoint'); Circular dependency...
//goog.require('reach.route.Dijkstra');
goog.require('reach.MU');

/** @constructor
  * @param {reach.MU} ll */
reach.road.Node=function(ll) {
	/** @type {reach.MU} Node coordinates in map units. */
	this.ll=ll;

	// Properties used for storing the physical road network.
	/** @type {Array.<reach.road.Way>} List of ways connected to this node.
	  * Never rely on length because there may be empty slots at the end. Use wayCount instead.*/
	this.wayList;
	/** @type {Array.<number>} Index of this node along each way connected to it. */
	this.posList;
	/** @type {number} Number of ways connected to this node. */
//	this.wayCount;
	/** @type {reach.road.Tile.Persist} If node has references from
	  * stops/input points/custom transit lines it shouldn't be removed when tile is unloaded. */
	this.persist;

	// Properties for storing the abstract routing graph.
	/** @type {number} */
	this.followerCount;
	/** @type {Array.<reach.road.Node>} */
	this.followerList;
	/** @type {Object.<number,?number>} */
	this.followerTbl;
	/** @type {Array.<number>} */
	this.distList;
	/** @type {boolean} */
	this.important;
	/** @type {number} */
	this.id;

	/** @type {Array.<reach.route.result.LegRef>} */
	this.walkList;
	/** @type {reach.route.result.LegRef} */
	this.firstWalk;

	// Properties used only when clustering road nodes together in preprocessing.
	/** @type {number} */
	this.clusterNum;
	/** @type {number} */
	this.clusterTestNum;
	/** @type {Array.<reach.road.Node>} */
	this.clusterMembers;
	/** @type {reach.road.Node} */
	this.clusterRef;

	/** @type {Array.<reach.trans.Stop>} */
	this.stopList;

	/** @type {number} */
	this.runId;
	/** @type {number} */
	this.cost;
	/** @type {number} */
	this.time;	// For isochrones.
	/** @type {number} */
	this.prevTime;	// For isochrones.
	/** @type {number} */
	this.groupTime;	// For isochrones.
	/** @type {reach.road.Node} */
	this.srcNode;
	/** @type {reach.trans.Stop} */
	this.srcStop;
	/** @type {reach.trans.Extra} */
	this.srcExtra;
	/** @type {number} */
	this.srcDist;

	// Used only when writing OpenStreetMap-format data dump for debugging.
	/** @type {number} */
	this.dumpId;

	/** @type {boolean} Mark if area node is already connected to neighbours. */
	this.area;

	/** @type {boolean} Node exists only for routing purposes, and may bridge road network segments not connected in real life. TODO: rename to something else?
      * Maybe this flag is not needed here since the corresponding ways added for routing always start or end at a routing node, so the flag could be moved to
      * way. */
	this.routing;

	// TODO: remove following, only used for generating Oikotie average travel time data file.
	this.timeSum;
};

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.WayVisitor} visitor */
/*
reach.road.Node.clusterVisitHandler=function(dijkstra,visitor) {
	var node;

	node=visitor.way.nodeList[visitor.pos];
	if(!node.clusterNum && node.runId!=dijkstra.runId && reach.util.vincenty(dijkstra.conf.startWayNodeList[0].node.ll.toDeg(),node.ll.toDeg())<dijkstra.clusterDist) {
		dijkstra.visitList[dijkstra.visitCount++]=node;
		node.runId=dijkstra.runId;
	}
};
*/

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Conf} conf
  * @param {number} clusterNum
  * @return {reach.road.Node} */
//reach.road.Node.prototype.makeCluster=function(dijkstra,conf,clusterNum) {
	/** @type {Array.<reach.road.Node>} */
/*
	var clusterStack=[this];
	var bestCount;
	var bestCluster;
	var bestNode;
	var visitNum;
	var stackLen;
	var node;

	dijkstra.onVisitRoad=reach.road.Node.clusterVisitHandler;
	stackLen=1;
	bestCount=0;
*/
//	bestCluster=/** @type {Array.<reach.road.Node>} */ [];
/*

	while(node=clusterStack[--stackLen]) {
		node.clusterTestNum=clusterNum;
		// Cost has to be != 0 or various tests for cost data existence will fail.
		conf.startWayNodeList=[{node:node,cost:1,time:0}];
		dijkstra.visitList=[];
		dijkstra.visitCount=0;
		dijkstra.start(conf);
		while(dijkstra.step()) {}
		if(dijkstra.visitCount>bestCount) {
			bestCount=dijkstra.visitCount;
			bestCluster=dijkstra.visitList;
			bestNode=node;

			for(visitNum=0;visitNum<bestCount;visitNum++) {
*/
//				node=/** @type {reach.road.Node} */ (bestCluster[visitNum]);
/*
				if(node.clusterTestNum!=clusterNum) {
					node.clusterTestNum=clusterNum;
					clusterStack[stackLen++]=node;
				}
			}
		}
	}

	dijkstra.onVisitRoad=null;
	bestNode.clusterMembers=bestCluster;
	for(visitNum=0;visitNum<bestCount;visitNum++) {
		node=bestCluster[visitNum];
		node.clusterNum=clusterNum;
		node.clusterRef=bestNode;
	}

	return(bestNode);
};
*/

/** @param {reach.road.Node} next */
reach.road.Node.prototype.removeFollower=function(next) {
	var followerNum;

	followerNum=this.followerTbl[next.id];
	//delete(this.followerTbl[next.id]);
//	this.followerList.splice(followerNum-1,1);
//	this.distList.splice(followerNum-1,1);

	this.followerTbl[next.id]=null;
	this.followerList[followerNum-1]=null;
//	this.distList[followerNum-1]=null;
	this.followerCount--;
};

/** @param {reach.road.Node} next
  * @param {number} dist */
reach.road.Node.prototype.connectTo=function(next,dist) {
	this.followerList.push(next);
	this.distList.push(dist);
	this.followerCount++;
//	this.followerTbl[next.id]=this.followerCount;

	next.followerList.push(this);
	next.distList.push(dist);
	next.followerCount++;
//	next.followerTbl[this.id]=next.followerCount;
};

/** @param {reach.road.Way} way */
reach.road.Node.prototype.removeWay=function(way) {
	var wayList;
	var wayNum,wayCount;

	wayList=this.wayList;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		if(wayList[wayNum]==way) {
			wayCount--;
			// Replace found way with the last way in list (unless way found is the last one, then it's just set to null),
			// allowing found way to be garbage collected if no other reference remains.
			this.posList[wayNum]=this.posList[wayCount];
			wayList[wayNum]=wayList[wayCount];
			// Remove duplicate reference to former last way in list (or the only reference if found way was the last one).
			wayList[wayCount]=null;
		}
	}
};

/** @param {reach.road.Way} way
  * @param {number} pos Node's index in way's node list. */
reach.road.Node.prototype.addWayRef=function(way,pos) {
	var wayCount;

//	wayCount=this.wayCount++;
//	wayCount=this.wayList.length;
//	this.wayList[wayCount]=way;
//	this.posList[wayCount]=pos;
	this.wayList.push(way);
	this.posList.push(pos);
};

/** @param {reach.route.result.WalkLeg} leg
  * @param {reach.route.result.Leg.Dir} dir */
reach.road.Node.prototype.addWalk=function(leg,dir) {
	var lst;

	lst=this.walkList;
	if(!lst) {
		lst=/** @type {Array.<reach.route.result.LegRef>} */[];
		this.walkList=lst;
	}

	lst.push(new reach.route.result.LegRef(leg,dir));
};
goog.provide('reach.data.QuadTreeItem');

/** @interface */
reach.data.QuadTreeItem=function() {};

/** @type {reach.MU} */
reach.data.QuadTreeItem.prototype.ll;
goog.provide('reach.trans.Stop');
goog.require('reach.road.Node');
goog.require('reach.util');
goog.require('reach.MU');
goog.require('reach.data.QuadTreeItem');

/** @constructor
  * @implements {reach.data.QuadTreeItem}
  * @param {number} id
  * @param {string} origId
  * @param {string} name
  * @param {reach.MU} ll */
reach.trans.Stop=function(id,origId,name,ll) {
	/** @type {number} */
	this.id=id;
	/** @type {string} */
	this.origId=origId;
	/** @type {string} */
	this.name=name;
	/** @type {number} */
	this.nameId;
	/** @type {reach.MU} */
	this.ll=ll;

	// Links connecting stop to transit network.
	/** @type {Array.<reach.trans.Line>} Transit lines passing by this stop. */
	this.lineList=[];
	/** @type {Array.<number>} How many stops are passed along each transit line before reaching this stop. */
	this.posList=[];

    /** @type {Object.<reach.trans.Trip.Mode,boolean>} */
    this.transModeTbl;

	// Routing data to store how stop was reached etc.
	/** @type {number} */
	this.runId;
	/** @type {number} */
	this.cost;
	/** @type {number} */
	this.time;
	/** @type {Array.<reach.road.Node>} Street network node that led to this stop. */
	this.srcNodeList;
	/** @type {Array.<reach.trans.Trip>} Trip along a transit line that led to this stop. */
	this.srcTripList;
	/** @type {Array.<number>} Offset of this stop along source trip. */
	this.srcPosList;

	// For backtracking.
	/** @type {number} */
	this.lastVisitTime;
	/** @type {Array.<number>} */
	this.lastTimeList;
	/** @type {Array.<reach.trans.Trip>} */
	this.lastTripList;
	/** @type {Array.<{time:number,cost:number,trip:reach.trans.Trip}>} */
	this.reverseDataList;
	/** @type {reach.route.result.LegRef} */
//	this.endWalk;

	// Links connecting stop to road network.
	/** @type {reach.road.Node} Nearest fast road graph node. */
	this.node;

	// Time table statistics used when compressing and decompressing.
	/** @type {Array.<reach.trans.Stop>} */
	this.followerList=[];
	/** @type {Object.<number,number>} */
	this.followerTbl={};
	/** @type {Array.<Array.<number>>} */
	this.durationsTo;
	/** @type {Array.<{mean:number,variance:number}>} */
	this.statsTo=[];

	/** @type {?number} */
	this.packFollowers;
	/** @type {Object.<number,number>} */
	this.packTbl;

	/** @type {reach.loc.Location} */
	this.loc;

	/** @type {number} Number of departures around search start time, to evaluate stop niceness. */
	this.departureCount;

	/** @type {boolean} */
	this.disabled;
};

/** @param {reach.trans.Stop} next
  * @param {number} duration */
reach.trans.Stop.prototype.addFollower=function(next,duration) {
	var followerNum;

	if(!this.durationsTo) this.durationsTo=/** @type {Array.<Array.<number>>} */ [];
	followerNum=this.followerTbl[next.id];
	if(!followerNum && followerNum!==0) {
		followerNum=this.followerList.length;
		this.followerTbl[next.id]=followerNum;
		this.followerList.push(next);
		this.durationsTo.push(/** @type {Array.<number>} */ ([duration]));
	} else {
		this.durationsTo[followerNum].push(duration);
	}
};

// This is only used for compressing data.
/** @param {number} statMul */
reach.trans.Stop.prototype.calcStats=function(statMul) {
	var followerNum,followerCount;
	var i,sampleCount;
	var stats;
	var mean,stdDev;
	var duration,err;
	var durations,filteredDurations;

	if(!this.durationsTo) return;
	followerCount=this.durationsTo.length;

	for(followerNum=0;followerNum<followerCount;followerNum++) {
		durations=this.durationsTo[followerNum];
		stats=reach.util.getStats(durations);

		// Try to find errors if variance is over 1 minute.
		if(stats.variance>1) {
			stdDev=Math.sqrt(stats.variance);
			sampleCount=stats.count;
			mean=stats.mean;

			filteredDurations=[];

			for(i=0;i<sampleCount;i++) {
				duration=durations[i];
				err=(duration-mean)/stdDev;
				if(err<0) err=-err;

				// If difference from mean is 3 sigma or less, accept data point.
				if(err<=3) filteredDurations.push(duration);
			}

			stats=reach.util.getStats(filteredDurations);
		}

		for(var stat in stats) {
			if(stat!='count') stats[stat]=~~(stats[stat]*statMul+0.5);
		}

		this.statsTo[followerNum]=stats;
	}
};
goog.provide('reach.data.QuadTree');
goog.require('reach.data.QuadTreeItem');

/** @constructor
  * @param {number} lat0
  * @param {number} lon0
  * @param {number} lat1
  * @param {number} lon1
  * @param {reach.data.QuadTree.Dup} dups */
reach.data.QuadTree=function(lat0,lon0,lat1,lon1,dups) {
	/** @type {number} */
	this.lat0=lat0;
	/** @type {number} */
	this.lon0=lon0;
	/** @type {number} */
	this.lat1=lat1;
	/** @type {number} */
	this.lon1=lon1;
	/** @type {reach.data.QuadTree.Dup} */
	this.dups=dups;
	/** @type {Array.<*>} */
	this.root=[reach.data.QuadTree.NodeType.QLEAF];
}

/** @const */
reach.data.QuadTree.maxChildren=4;

/** @enum {number} */
reach.data.QuadTree.NodeType={
	QBRANCH:0,
	QLEAF:1
};

/** @enum {number} */
reach.data.QuadTree.Dup={
	ALLOWDUP:0,
	NODUP:1
};

/** @enum {number} */
reach.data.QuadTree.Pos={
	SW:1,
	SE:2,
	NW:3,
	NE:4
};

/** @param {reach.data.QuadTreeItem} item */
reach.data.QuadTree.prototype.insert=function(item) {
	var lat0=this.lat0,lon0=this.lon0,lat1=this.lat1,lon1=this.lon1;
	var latSplit,lonSplit;
	var node=this.root,oldNode;
	var lat,lon;
	var itemNum,itemCount;
	var oldItem;
	var quadNum;

	lat=item.ll.llat;
	lon=item.ll.llon;

	while(1) {
		latSplit=(lat0+lat1)/2;
		lonSplit=(lon0+lon1)/2;

		if(node[0]==reach.data.QuadTree.NodeType.QLEAF) {
			if(this.dups==reach.data.QuadTree.Dup.NODUP) {
				itemCount=node.length;
				for(itemNum=1;itemNum<itemCount;itemNum++) {
					oldItem=/** @type {reach.data.QuadTreeItem} */ node[itemNum];
					if(oldItem.ll.llat==lat && oldItem.ll.llon==lon) return(oldItem);
				}
			}

			if(node.length<reach.data.QuadTree.maxChildren+1) {
				// Node has space, insert item.
				node[node.length]=item;
				return(item);
			} else {
				// Node is full, split.
				// Make copy of items.
				oldNode=(/** @type {Array.<*>} */ node).slice(0);
				// Change node from leaf to branch and remove items.
				node[0]=reach.data.QuadTree.NodeType.QBRANCH;
				node.length=1;
				// Split node in quads and reinsert items.
				itemCount=oldNode.length;
				for(itemNum=1;itemNum<itemCount;itemNum++) {
					quadNum=1;
					oldItem=/** @type {reach.data.QuadTreeItem} */ oldNode[itemNum];
					if(oldItem.ll.llon>=lonSplit) quadNum++;
					if(oldItem.ll.llat>=latSplit) quadNum+=2;
					if(node[quadNum]) node[quadNum][(/** @type {Array.<*>} */ (node[quadNum])).length]=oldItem;
					else node[quadNum]=[reach.data.QuadTree.NodeType.QLEAF,oldItem];
				}
			}
		}

		// Select appropriate quad containing input item.
		quadNum=1;
		if(lon>lonSplit) {quadNum++;lon0=lonSplit;} else lon1=lonSplit;
		if(lat>latSplit) {quadNum+=2;lat0=latSplit;} else lat1=latSplit;
		if(!node[quadNum]) {
			// If quad is empty, insert item and exit.
			node[quadNum]=[reach.data.QuadTree.NodeType.QLEAF,item];
			return(item);
		}

		// Move down the tree.
		node=node[quadNum];
	}
}

/** @param {number} qx0
  * @param {number} qy0
  * @param {number} qx1
  * @param {number} qy1
  * @param {function(reach.data.QuadTreeItem)} callBack */
reach.data.QuadTree.prototype.searchRect=function(qx0,qy0,qx1,qy1,callBack) {
	var node=this.root;

/** @param {Array.<*>} node
  * @param {number} lat0
  * @param {number} lon0
  * @param {number} lat1
  * @param {number} lon1 */
	function recurse(node,lat0,lon0,lat1,lon1) {
		var latSplit,lonSplit;
		var lat,lon;
		var itemNum,itemCount;
		var item;

		latSplit=(lat0+lat1)/2;
		lonSplit=(lon0+lon1)/2;

		if(node[0]==reach.data.QuadTree.NodeType.QLEAF) {
			itemCount=node.length;
			for(itemNum=1;itemNum<itemCount;itemNum++) {
				item=/** @type {reach.data.QuadTreeItem} */ node[itemNum];
				lat=item.ll.llat;
				lon=item.ll.llon;
				if(lat>=qx0 && lat<=qx1 && lon>=qy0 && lon<=qy1) callBack(item);
			}
			return;
		}

		if(qx0<=latSplit) {
			if(qy0<lonSplit && node[reach.data.QuadTree.Pos.SW]) recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.SW]),lat0,lon0,latSplit,lonSplit);
			if(qy1>=lonSplit && node[reach.data.QuadTree.Pos.SE]) recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.SE]),lat0,lonSplit,latSplit,lon1);
		}

		if(qx1>latSplit) {
			if(qy0<lonSplit && node[reach.data.QuadTree.Pos.NW]) recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.NW]),latSplit,lon0,lat1,lonSplit);
			if(qy1>=lonSplit && node[reach.data.QuadTree.Pos.NE]) recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.NE]),latSplit,lonSplit,lat1,lon1);
		}
	}

	recurse(this.root,this.lat0,this.lon0,this.lat1,this.lon1);
}

/** @param {function(reach.data.QuadTreeItem)} callBack */
reach.data.QuadTree.prototype.walk=function(callBack) {
	/** @param {Array.<*>} node */
	function recurse(node) {
		var itemNum,itemCount;
		var item;

		if(!node) return;

		if(node[0]==reach.data.QuadTree.NodeType.QLEAF) {
			itemCount=node.length;
			for(itemNum=1;itemNum<itemCount;itemNum++) {
				item=/** @type {reach.data.QuadTreeItem} */ node[itemNum];
				callBack(item);
			}
			return;
		}

		recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.SW]));
		recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.SE]));
		recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.NW]));
		recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.NE]));
	}

	recurse(this.root);
}
goog.provide('reach.trans.StopSet');
goog.require('reach.trans.Stop');
goog.require('reach.data.Codec');
goog.require('reach.data.QuadTree');
goog.require('reach.io.SQL');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.StopSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<reach.trans.Stop>} */
	this.list=[];
	/** @type {Object.<number,reach.trans.Stop>} */
	this.tbl={};
	/** @type {reach.data.QuadTree} */
	this.tree;
};

/** @param {reach.io.SQL} db */
/*
reach.trans.StopSet.prototype.importKalkati=function(db) {
	var result;
	var row;
	var stopId;
	var origId;
	var name;
	var lat,lon;
	var ll;
	var stop;

	this.list=[];
	this.tbl={};

	result=db.query('SELECT statid,name,lat,lon FROM station ORDER BY statid;');
	stopId=0;

	while(row=result.getRow()) {
		origId=+row['statid'];
*/
//		name=/** @type {string} */ row['name'];
/*
		lat=row['lat']/1000000;
		lon=row['lon']/1000000;
		ll=new reach.Deg(lat,lon).toMU();

		stop=new reach.trans.Stop(stopId,''+origId,name,ll);
		this.list.push(stop);
		this.tbl[origId]=stop;

		stopId++;
	}
};
*/

/** @param {function(string)} write */
/*
reach.trans.StopSet.prototype.exportPack=function(write) {
	var codec=new reach.data.Codec();
	var ll,lat,lon;
	var prevId,prevLat,prevLon,prevNameId;
	var i,stopCount;
	var stop;
	var data;
	var name,nameId,nameLen,nameCount,nameList,nameTbl;
	var compressed;

	stopCount=this.list.length;
	data=[];

	nameLen=0;
	nameCount=0;
	nameList=[];
*/
//	nameTbl=/** @type {Object.<string,number>} */ {};
/*

	for(i=0;i<stopCount;i++) {
		stop=this.list[i];
		name=stop.name;
		if(name.length>nameLen) nameLen=name.length;
		nameId=nameTbl[name];
		if(!nameId) {
			nameId=nameCount++;
			nameTbl[name]=nameId;
			data.push(name+'\n');
		}
		stop.nameId=nameId;
	}

	compressed=codec.compressBytes(data.join(''),nameLen,10000);
	write(codec.encodeLong([this.city.firstDate.jd,this.city.dayCount,compressed.length]));
	write(compressed);

	data=[];

	prevId=0;
	prevLat=0;
	prevLon=0;
	prevNameId=0;

	for(i=0;i<stopCount;i++) {
		stop=this.list[i];
		ll=stop.ll.toDeg();
		lat=reach.util.round(ll.llat*100000,1);
		lon=reach.util.round(ll.llon*100000,1);
		nameId=stop.nameId;

		data.push(codec.encodeShort([
			reach.util.fromSigned(stop.origId-prevId),
			reach.util.fromSigned(stop.nameId-prevNameId),
			reach.util.fromSigned(lat-prevLat),
			reach.util.fromSigned(lon-prevLon)
		]));

		prevId=stop.origId;
		prevNameId=nameId;
		prevLat=lat;
		prevLon=lon;
	}

	write(codec.encodeLong([stopCount])+data.join('')+'\n');
};
*/

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.trans.StopSet.prototype.importPack=function(stream) {
	/** @type {reach.trans.StopSet} */
	var self=this;
	/** @type {number} */
	var origId;
	var ll;
	/** @type {number} */
	var lat;
	/** @type {number} */
	var lon;
	/** @type {number} */
	var nameId;
	/** @type {number} */
	var stopNum;
	var stopCount;
	var nameList;
	var step;

	var advance=function() {
		var dec;
		var data;
		var stop;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				self.list=[];
				self.tbl={};
				return(1);

			// Read list of stop names.
			case 1:
				step++;

				dec=stream.readLong(3);
				self.city.firstDate=new reach.core.Date(dec[0]);
				self.city.dayCount=dec[1];

				data=stream.readPack(dec[2],10000);
				nameList=data.split('\n');
				return(1);

			// Initialize loop to read stop data.
			case 2:
				step++;

				origId=0;
				lat=0;
				lon=0;
				nameId=0;

				stopCount=stream.readLong(1)[0];
				stopNum=0;
				return(stopCount);

			// Iterate to read stop data.
			case 3:
				dec=stream.readShort(4);
				origId+=reach.util.toSigned(dec[0]);
				nameId+=reach.util.toSigned(dec[1]);
				lat+=reach.util.toSigned(dec[2]);
				lon+=reach.util.toSigned(dec[3]);

				ll=new reach.Deg(lat/100000,lon/100000).toMU();
				stop=new reach.trans.Stop(stopNum,''+origId,nameList[nameId],ll);
//				console.log(stop.id+' '+stop.origId+' '+stop.ll.llat+' '+stop.ll.llon+' '+stop.name);

				self.list[stopNum++]=stop;
				self.tbl[origId]=stop;

				return(stopCount-stopNum);
		}
	};

	step=0;
	return(advance);
};

reach.trans.StopSet.prototype.cleanUp=function() {
	var stopNum,stopCount;
	var stop;

//	delete(this.tbl);
//	Following commented out because table is needed for node connection tweaks and doesn't really use a lot of mem.
//	if(this.tbl) this.tbl=null;

	stopCount=this.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.list[stopNum];

		// Used in LineSet.importPack
//		delete(stop.followerList);
		if(stop.followerList) stop.followerList=null;

//		delete(stop.followerTbl);
//		delete(stop.durationsTo);
//		delete(stop.statsTo);
		if(stop.followerTbl) stop.followerTbl=null;
		if(stop.durationsTo) stop.durationsTo=null;
		if(stop.statsTo) stop.statsTo=null;

		// Used in StopSet.exportPack
//		delete(stop.nameId);

		// Used in LineSet.exportPack
//		delete(stop.packFollowers);
//		delete(stop.packTbl);
		if(stop.packFollowers) stop.packFollowers=null;
		if(stop.packTbl) stop.packTbl=null;
	}
};

/** @return {reach.data.QuadTree} */
reach.trans.StopSet.prototype.makeTree=function() {
	var lat,lon,lat0,lon0,lat1,lon1;
	var stopNum,stopCount;
	var stop;
	var tree;

	stopCount=this.list.length;
	if(stopCount==0) return(null);

	// Compute bounding box containing all stops.
	stop=this.list[0];
	lat0=stop.ll.llat;
	lon0=stop.ll.llon;
	lat1=lat0;
	lon1=lon0;

	for(stopNum=1;stopNum<stopCount;stopNum++) {
		stop=this.list[stopNum];
		lat=stop.ll.llat;
		lon=stop.ll.llon;

		if(lat<lat0) lat0=lat;
		if(lat>lat1) lat1=lat;
		if(lon<lon0) lon0=lon;
		if(lon>lon1) lon1=lon;
	}

	// Create quadtree for computed bounding box.
	tree=new reach.data.QuadTree(lat0,lon0,lat1,lon1,reach.data.QuadTree.Dup.ALLOWDUP);
	this.tree=tree;

	// Insert all stops in tree.
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.list[stopNum];
		tree.insert(stop);
	}

	return(tree);
};

/*
<Trnsmode TrnsmodeId='22' Name='Helsingin aamuy&#246;nlinjat'/>
<Trnsmode TrnsmodeId='23' Name='Espoon palvelulinjat'/>
<Trnsmode TrnsmodeId='36' Name='Kirkkonummen sis&#228;inen'/>
<Trnsmode TrnsmodeId='24' Name='Vantaan palvelulinjat'/>
<Trnsmode TrnsmodeId='25' Name='Aamuy&#246;n seutulinjat'/>
<Trnsmode TrnsmodeId='39' Name='Keravan sis&#228;inen'/>
<Trnsmode TrnsmodeId='12' Name='VR:n l&#228;hiliikenne'/>
<Trnsmode TrnsmodeId='38' Name='Sipoon sis&#228;iset linjat'/>
<Trnsmode TrnsmodeId='3' Name='Espoon sis&#228;inen'/>
<Trnsmode TrnsmodeId='21' Name='Helsingin palvelulinjat'/>
<Trnsmode TrnsmodeId='2' Name='Hki/raitiovaunu'/>
<Trnsmode TrnsmodeId='1' Name='Hki/linja-auto'/>
<Trnsmode TrnsmodeId='7' Name='Vesiliikenne'/>
<Trnsmode TrnsmodeId='6' Name='Metroliikenne'/>
<Trnsmode TrnsmodeId='5' Name='Seutuliikenne'/>
<Trnsmode TrnsmodeId='4' Name='Vantaan sis&#228;inen'/>
<Trnsmode TrnsmodeId='8' Name='U-liikenne'/>
*/

// Mark what modes of transport are departing from each stop.
reach.trans.StopSet.prototype.calcModes=function() {
	var stopNum,stopCount;
	var stop;
	var lineNum,lineCount;
	var line;
	var modeTbl;

	modeTbl=/** @type {Object.<number,reach.trans.Trip.Mode>} */ {
		1:reach.trans.Trip.Mode.BUS,
		2:reach.trans.Trip.Mode.TRAM,
		3:reach.trans.Trip.Mode.BUS,
		4:reach.trans.Trip.Mode.BUS,
		5:reach.trans.Trip.Mode.BUS,
		6:reach.trans.Trip.Mode.SUBWAY,
		7:reach.trans.Trip.Mode.BOAT,
		8:reach.trans.Trip.Mode.BUS,

		12:reach.trans.Trip.Mode.TRAIN,
		21:reach.trans.Trip.Mode.BUS,
		22:reach.trans.Trip.Mode.BUS,
		23:reach.trans.Trip.Mode.BUS,
		24:reach.trans.Trip.Mode.BUS,
		25:reach.trans.Trip.Mode.BUS,
		36:reach.trans.Trip.Mode.BUS,
		38:reach.trans.Trip.Mode.BUS,
		39:reach.trans.Trip.Mode.BUS
	};

	stopCount=this.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.list[stopNum];
		stop.transModeTbl=/** @type {Object.<reach.trans.Trip.Mode,boolean>} */ {};

		lineCount=stop.lineList.length;
		for(lineNum=0;lineNum<lineCount;lineNum++) {
			line=stop.lineList[lineNum];

			for(var mode in line.transModeTbl) {
				stop.transModeTbl[modeTbl[+mode]]=true;
			}
		}
	}
};
goog.provide('reach.road.WayIterator');

/** @constructor
  * @param {reach.road.Way} way */
reach.road.WayIterator=function(way) {
	/** @type {Array.<reach.road.Node>} */
	var pointList;
	/** @type {number} */
	var nodeNum;
	var nodeCount;
	/** @type {number} */
	var bestNodeNum;
	/** @type {number} */
	var pointNum;
	var pointCount;
	/** @type {number} */
	var bestPointNum;
	/** @type {Array.<number>} */
	var pointNumList;
	/** @type {Array.<number>} */
	var distList;
	/** @type {Array.<number>} */
	var nodeDistList;

	/** @type {Array.<reach.road.Node>} */
	pointList=way.pointList;
	pointCount=way.pointCount;
	pointNumList=way.pointNumList;
	distList=way.distList;
	nodeDistList=way.nodeDistList;
	nodeCount=way.nodeCount;
	if(!pointNumList) nodeCount=0;
	nodeNum=-1;
	pointNum=-1;
	bestNodeNum=0;
	bestPointNum=0;

	/** @type {reach.road.Way} */
	this.way=way;
	/** @type {reach.road.Node} */
	this.nodePrev=null;
	/** @type {number} */
	this.distPrev=0;
	/** @type {reach.road.Node} */
	this.nodeNext=null;
	/** @type {number} */
	this.distNext=0;

	/** @return {boolean} */
	this.mark=function() {
		bestNodeNum=nodeNum;
		bestPointNum=pointNum-1;

		if(pointNumList[bestNodeNum]==bestPointNum+1) {
			bestNodeNum--;
			return(true);
		}

		return(false);
	};

	/** @return {reach.MU} */
	this.next=function() {
		if(pointNum+1>=pointCount) return(null);
		pointNum++;
		if((nodeNum+1<nodeCount && pointNumList[nodeNum+1]==pointNum) || !pointNumList) {
			nodeNum++;
			return((/** @type {reach.road.Node} */ pointList[pointNum]).ll);
		} else {
			return(/** @type {reach.MU} */ pointList[pointNum]);
		}
	};

	/** @param {number} pos */
	this.getDist=function(pos) {
		this.nodePrev=pointList[pointNumList[bestNodeNum]];
		this.distPrev=distList[bestPointNum]-nodeDistList[bestNodeNum];
		this.distPrev+=(distList[bestPointNum+1]-distList[bestPointNum])*pos;

		if(bestNodeNum+1<nodeCount) {
			this.nodeNext=pointList[pointNumList[bestNodeNum+1]];
			this.distNext=nodeDistList[bestNodeNum+1]-distList[bestPointNum+1];
			this.distNext+=(distList[bestPointNum+1]-distList[bestPointNum])*(1-pos);
		} else {
			this.nodeNext=this.nodePrev;
			this.distNext=this.distPrev;
		}
	};
};
goog.provide('reach.road.Way');
goog.require('reach.road.WayIterator');
goog.require('reach.road.Node');
goog.require('reach.util');

/** @constructor
  * @param {reach.road.Tile.Persist} persist */
reach.road.Way=function(persist) {
	/** @type {reach.road.Tile} Tile that this road segment belongs to. */
	this.tile=null;
	/** @type {reach.road.Tile} Tile containing the first node of this road segment if it continues from outside.
		Tiles may be far enough to not even touch if way nodes are far apart. */
	this.fromTile=null;
	/** @type {reach.road.Tile} Tile containing the last node of this segment if it continues outside its own tile. */
	this.toTile=null;
	/** @type {?string} Street name or special value 'routing' for virtual road segments connecting stops to road network. */
	this.name=null;
	/** @type {?string} OSM highway tag value, currently stored but unused. */
	this.type=null;
	/** @type {Array.<reach.MU|reach.road.Node>} List of nodes and coordinates of intermediate geometry. */
	this.pointList=null;
	/** @type {number} Length of pointList. */
	this.pointCount=0;
	/** @type {Array.<number>} Index of each node in the point list. List of nodes is formed by pointList[pointNumList[0...nodeCount-1]]
		or simply pointList[0...nodeCount-1] if pointNumList is null. */
	this.pointNumList=null;
	/** @type {number} Number of nodes = length of pointNumList or if it's null then length of pointList. */
	this.nodeCount=0;
	/** @type {Array.<number>} Cumulative distances of points along way. Unit: meters. */
	this.distList=null;
	/** @type {Array.<number>} Cumulative distances of nodes along way. Unit: meters. */
	this.nodeDistList=null;
	/** @type {reach.road.Tile.Persist} Used when freeing nodes to check that they're loaded from the compressed road tile instead of persistent data
      * loaded only at program initialization (such as virtual roads connecting all stops to the road network). */
	this.persist=persist;

	// Variables modified during Dijkstra.
	/** @type {number} Number of Dijkstra execution that last visited this way, to detect if old invalid Dijkstra state data may remain. */
	this.runId=-1;
	/** @type {Array.<number>} Costs for reaching nodes along this way. Node cost is duplicated in each way it touches, but
		this allows having a cost for turning to a different road which may delay the user having to spend effort looking for it. */
	this.costList;
	/** @type {Array.<number>} Times when nodes along this way are reached. USELESS? */
//	this.timeList;
	/** @type {Array.<reach.road.Way>} For each node along the way, previous way that was traveled to reach it. */
	this.srcWayList;
	/** @type {Array.<number>} Index of the node along the previous way, that connected to this node. */
	this.srcPosList;

	/** @type {reach.road.Way.Access} */
	this.access=reach.road.Way.Access.NONE;
};

/** @enum {number} */
reach.road.Way.Access={
	NONE:0,
	WALK:1,
	BIKE:2,
	TRANSIT:4,
	CAR:8
};

// TODO: Actually splitting a way can affect 3 tiles: those containing the new node and both nodes around it along the way.
// Those represents the 2 previously existing entry points to that part of the way, and the newly added one.
/** @param {number} where
  * @param {reach.road.Node} node */
/*
reach.road.Way.prototype.split=function(where,node) {
	var llPrev,ll,llNext;

	llPrev=this.nodeList[where].ll.toDeg();
	ll=node.ll.toDeg();
	llNext=this.nodeList[where+1].ll.toDeg();

	this.nodeList.splice(where+1,0,node);
	this.distList.splice(where,1,reach.util.vincenty(llPrev,ll),reach.util.vincenty(ll,llNext));
};
*/

/** @param {reach.MU} ll
  * @return {reach.road.NearWay} */
reach.road.Way.prototype.findNearest=function(ll) {
	var nodeNum,nodeCount;
	var node;
	var searchLat,searchLon;
	var bestLat,bestLon;
	var bestDist,bestPos;
	var iterator;
	var ll;
	var lat,prevLat;
	var lon,prevLon;
	var dlat,dlon,dist;
	var nearest;
	var pos;

	searchLat=ll.llat;
	searchLon=ll.llon;

	bestLat=0;
	bestLon=0;
	bestDist=-1;
	bestPos=0;

	iterator=this.iterateNodes();
	ll=iterator.next();

	lat=ll.llat;
	lon=ll.llon;

	while((ll=iterator.next())) {
		prevLat=lat;
		prevLon=lon;
		lat=ll.llat;
		lon=ll.llon;

		dlat=lat-prevLat;
		dlon=lon-prevLon;
		dist=dlat*dlat+dlon*dlon;

		pos=0;
		if(dist>0) {
			// Find position along line (prevLat,prevLon)-(lat,lon) closest to ll.
			pos=((searchLat-prevLat)*dlat+(searchLon-prevLon)*dlon)/dist;
			// If the position lies outside the line segment, move it to one of the end points.
			if(pos<0) pos=0;
			if(pos>1) pos=1;
		}

		dlat=(prevLat+dlat*pos)-searchLat;
		dlon=(prevLon+dlon*pos)-searchLon;
		dist=dlat*dlat+dlon*dlon;

		if(bestDist<0 || dist<bestDist) {
//			nearest={way:this,nodeNum:nodeNum-1,dist:dist,pos:pos,ll:null};
			bestLat=searchLat+dlat;
			bestLon=searchLon+dlon;
			bestDist=dist;
			bestPos=pos;
			iterator.mark();
		}
	}

//	if(nearest) nearest.ll=new reach.MU(bestLat,bestLon);
	if(bestDist<0) return(null);
	iterator.getDist(bestPos);

	nearest=/** @type {reach.road.NearWay} */ {
		way:this,
		nodePrev:iterator.nodePrev,
		distPrev:iterator.distPrev,
		nodeNext:iterator.nodeNext,
		distNext:iterator.distNext,
		dist:bestDist,
		ll:new reach.MU(bestLat,bestLon)
	};

	return(nearest);
};

/** @return {reach.road.WayIterator} */
reach.road.Way.prototype.iterateNodes=function() {
	return(new reach.road.WayIterator(this));
};
goog.provide('reach.route.Conf');
goog.require('reach.road.Way');

/** @constructor
  * @param {reach.trans.City} city */
reach.route.Conf=function(city) {
	/** @type {reach.core.Date} */
	this.date;
	/** @type {string} */
	this.dateText;
	/** @type {number} Number of TU (Time Units) per one second, defining accuracy. */
	this.timeDiv=10;
	/** @type {number} Maximum travel cost. Unit: 1/timeDiv seconds. */
	this.maxCost=this.timeDiv*60*60* 2;	// 2 hours.
	/** @type {number} Sentinel value representing infinite cost. Unit: 1/timeDiv seconds. */
//	this.infCost=this.timeDiv*60*60* 24;	// 24 hours.
	this.infCost=this.maxCost*2;	// Any number bigger than maxCost.
	/** @type {number} Maximum difference at each stop between optimal (latest) arrival time and earliest possible arrival time.
		Unit: 1/timeDiv seconds. */
	this.altRouteTimeSpan=this.timeDiv*60*60* 1;	// 1 hour. This should be bigger than the maximum interval of any transit line.

	this.srid='EPSG:4326';	// Default projection, EPSG 4326 is WGS84.
	this.outPath='out.csv';

	/** @type {number} */
	this.nodeNearMax=25;
	/** @type {number} Number of nearby stops to bound new locations to. */
	this.stopNearMax=5;
	/** @type {number} */
	this.stopNearMin=3;
	/** @type {number} Number of times to try of less than stopNearMin stops found. */
	this.bindRetryMax=3;

	// Note: when bracketing for shortest travel time, brackets should be optimal Golomb rulers (maybe multiplied by a constant
	// to extend the range) for best results, for example:
	// 0 3 12 18 (biggest gap 9, biggest error 12 for 30min interval)
	// 0 4 14 16 22 (biggest gap 10, missing delta 20, biggest error 10 for 30min interval).
	// 0 2  8 18 22 (biggest gap 10, missing delta 12, biggest error 10 for 30min interval).
	/** @type {Array.<number>} List of start times for routing, default to 8 AM. */
	this.timeList=[
		(8*60+ 0)*60*this.timeDiv
//		(8*60+ 3)*60*this.timeDiv,
//		(8*60+12)*60*this.timeDiv,
//		(8*60+18)*60*this.timeDiv
/*
		(8*60+2)*60*this.timeDiv,
		(8*60+4)*60*this.timeDiv,
		(8*60+6)*60*this.timeDiv,
		(8*60+8)*60*this.timeDiv,
		(8*60+10)*60*this.timeDiv
*/
	];

//	this.timeList=[];for(var i=0;i<60;i+=2) this.timeList.push((8*60+i)*60*this.timeDiv);

	/** @type {number} Walking speed. Unit: TU/m */
	this.walkTimePerM=60*this.timeDiv/ 70	// 70 m/min
//	this.walkTimePerM=3.6*this.timeDiv/ 5;	// 5 km/h
	/** @type {number} Biking speed. Unit: TU/m */
	this.bikeTimePerM=3.6*this.timeDiv/ 15;	// 15 km/h
	/** @type {number} */
	this.midWalkTimePerM=this.walkTimePerM;
	/** @type {number} */
	this.midBikeTimePerM=this.bikeTimePerM;
	/** @type {number} */
	this.startWalkTimePerM=this.walkTimePerM;
	/** @type {number} */
	this.startBikeTimePerM=this.bikeTimePerM;
	/** @type {number} */
	this.endWalkTimePerM=this.walkTimePerM;
	/** @type {number} */
	this.endBikeTimePerM=this.bikeTimePerM;

	/** @type {boolean} */
	this.saveTrack=true;

	/** @type {Array.<{way:reach.road.Way,pos:number,time:number,cost:number}>} */
	this.startRoadList=[];
	/** @type {Array.<{node:reach.road.Node,time:number,cost:number}>} */
	this.startWayNodeList=[];
	/** @type {Array.<{node:reach.road.Node,time:number,cost:number}>} */
	this.startGraphNodeList=[];
	/** @type {Array.<{stop:reach.trans.Stop,time:number,cost:number}>} */
	this.startStopList=[];
	/** @type {Array.<reach.road.Node>} */
	this.endGraphNodeList=[];
	/** @type {Array.<reach.route.Visitor>} */
	this.visitorList=null;

	/** @type {number} Extra cost to travel between stops, to avoid useless travel that doesn't cause other harm. Unit: 1/timeDiv seconds. */
	this.transitCostAdd=1;
	/** @type {number} Unit: multiplication factor. */
	this.transitCost=1;
	/** @type {?Object.<number,number>} Unit: multiplication factor. */
	this.transitModeCost=null;
	/** @type {?Object.<string,number>} Unit: multiplication factor. */
	this.transitJoreCost=null;
	/** @type {number} Unit: multiplication factor. */
	this.walkCostMul=1.2;
	/** @type {number} Unit: multiplication factor. */
	this.waitCostMul=1;
	/** @type {number} Do not touch. Unit: multiplication factor. */
	this.initWaitCostMul=this.waitCostMul;
	/** @type {number} Cost for departing later when bracketing. Unit: multiplication factor. */
	this.bracketWaitCostMul=2/60;
//	this.initWaitCostMul=0.25;
	/** @type {number} Unit: 1/timeDiv seconds. Don't set to zero or routes will have duplicate nodes in corners! */
	this.walkTurnCost=1;
	/** @type {number} Minimum wait time at transport stops. Unit: 1/timeDiv seconds. */
	this.minWait=this.timeDiv*60* 3;	// 3 minutes.
	/** @type {number} Wait time at first transport stop along route. */
	this.firstWait=this.timeDiv*60* 0;

	/** @type {number} Unit: minutes. */
	this.enterCost=3;
	/** @type {?Object.<number,number>} */
	this.enterModeCost=null;

	/** @type {number} Unit: minutes. */
	this.enterTime=0;
	/** @type {?Object.<number,number>} */
	this.enterModeTime=null;

	/** @type {number} Unit: minutes. */
	this.leaveCost=0;
	/** @type {?Object.<number,number>} */
	this.leaveModeCost=null;

	/** @type {number} Unit: minutes. */
	this.leaveTime=0;
	/** @type {?Object.<number,number>} */
	this.leaveModeTime=null;

	/** @type {number} Unit: 1/timeDiv seconds. */
//	this.leaveTime=this.timeDiv*60* 0 + 1;	// 0 minutes, 1/timeDiv seconds.
	/** @type {number} How many departures within an hour to make a stop one point nicer for transfers.
		(decreasing stop's enterCost and leaveCost by 25%) */
	this.niceDepartures=25;
	/** @type {number} Time span from start time to search for departures while evaluating stop niceness. Unit: minutes. */
	this.niceDepartureSpan=60;

	/** @type {number} Maximum walking distance to search for nearby stops or direct routes to targets. Unit: meters.
		If this is too low (1000 is too low), then it often suggests swimming out of an island even though there's a bridge. */
	this.maxWalk=2000;

	/** @type {boolean} */
	this.forward=true;

	/** @type {number} Maximum great circle distance to search for a road nearest to a point. Unit: meters. */
	this.snapDist=200;

	// snapDist must be under maxWalk because only tiles closer than maxWalk will be loaded
	// when binding input points to the road network.
	if(this.snapDist>this.maxWalk) this.snapDist=this.maxWalk;

	// Visualization options.
	/** @type {number} */
	this.colorInterval=300;
};

/** @param {Object.<string,number>} conf */
reach.route.Conf.prototype.read=function(conf) {
	var timeNum,timeCount;
	var d;

	if(conf['date']) this.dateText=conf['date'];
	if(conf.hasOwnProperty('maxCost')) this.maxCost=60*this.timeDiv*conf['maxCost'];

	if(conf['srid']) this.srid=conf['srid'];

	if(searchConf['time']) {
		this.timeList=[];
		timeCount=(/** @type {Array.<string>} */ (searchConf['time'])).length;
		for(timeNum=0;timeNum<timeCount;timeNum++) {
			d=(/** @type {string} */ searchConf['time'][timeNum]).split(':');
			this.timeList[timeNum]=((+d[0])*60+(+d[1]))*60*this.timeDiv;
		}
	}

	if(conf.hasOwnProperty('walkSpeed')) this.midWalkTimePerM=60*this.timeDiv/conf['walkSpeed'];
	if(conf.hasOwnProperty('bikeSpeed')) this.midBikeTimePerM=60*this.timeDiv/conf['bikeSpeed'];
	if(conf.hasOwnProperty('startWalkSpeed')) this.startWalkTimePerM=60*this.timeDiv/conf['startWalkSpeed'];
	if(conf.hasOwnProperty('startBikeSpeed')) this.startBikeTimePerM=60*this.timeDiv/conf['startBikeSpeed'];
	if(conf.hasOwnProperty('endWalkSpeed')) this.endWalkTimePerM=60*this.timeDiv/conf['endWalkSpeed'];
	if(conf.hasOwnProperty('endBikeSpeed')) this.endBikeTimePerM=60*this.timeDiv/conf['endBikeSpeed'];

	this.walkTimePerM=this.midWalkTimePerM;
	this.bikeTimePerM=this.midBikeTimePerM;

	if(conf.hasOwnProperty('transCost')) this.transitCost=conf['transCost'];
	if(conf.hasOwnProperty('transModeCost')) this.transitModeCost=/** @type {?Object.<number,number>} */ conf['transModeCost'];
	if(conf.hasOwnProperty('transJoreCost')) this.transitJoreCost=/** @type {?Object.<string,number>} */ conf['transJoreCost'];
	if(conf.hasOwnProperty('walkCost')) this.walkCostMul=conf['walkCost'];
	if(conf.hasOwnProperty('waitCost')) this.waitCostMul=conf['waitCost'];
	if(conf.hasOwnProperty('initCost')) this.initWaitCostMul=conf['initCost'];
	if(conf.hasOwnProperty('minWait')) this.minWait=60*this.timeDiv*conf['minWait'];
	if(conf.hasOwnProperty('firstWait')) this.firstWait=60*this.timeDiv*conf['firstWait'];

	if(conf.hasOwnProperty('enterCost')) this.enterCost=conf['enterCost'];
	if(conf.hasOwnProperty('leaveCost')) this.leaveCost=conf['leaveCost'];
	if(conf.hasOwnProperty('enterModeCost')) this.enterModeCost=/** @type {?Object.<number,number>} */ conf['enterModeCost'];
	if(conf.hasOwnProperty('leaveModeCost')) this.leaveModeCost=/** @type {?Object.<number,number>} */ conf['leaveModeCost'];

	if(conf.hasOwnProperty('leaveTime')) this.leaveTime=this.timeDiv*conf['leaveTime'];
	if(conf.hasOwnProperty('maxWalk')) this.maxWalk=conf['maxWalk'];
	if(conf.hasOwnProperty('backwards')) this.forward=!conf['backwards'];

	if(conf.hasOwnProperty('snapDist')) this.snapDist=conf['snapDist'];
};
goog.provide('reach.trans.Trip');
goog.require('reach.route.Conf');

/** @constructor
  * @param {reach.trans.Line} line
  * @param {{line:reach.trans.Line,mode:number,longCode:?string,shortCode:?string,name:?string}=} key */
reach.trans.Trip=function(line,key) {
	/** @type {{line:reach.trans.Line,mode:number,longCode:?string,shortCode:?string,name:?string}} */
	this.key=key?key:{
		line:line,
		mode:0,
		longCode:null,
		shortCode:null,
		name:null
	};

	/** @type {Array.<number>|Uint32Array} Unit: minutes. */
	this.deltaList;

	/** @type {number} Unit: minutes. */
	this.startTime;
	/** @type {number} Unit: minutes. */
	this.duration;
	/** @type {number} */
	this.num;
};

/** @enum {number} */
reach.trans.Trip.Mode={
	BUS:0,
	TRAM:1,
	SUBWAY:2,
	TRAIN:3,
	BOAT:4
};

/** @param {Object.<string,*>|boolean} row
  * @param {Array.<string>} data
  * @param {number} valid */
reach.trans.Trip.prototype.importKalkati=function(row,data,valid) {
	var first,last,duration;
	var mins,prevMins;
	var stop,prevStop;
	var dataLen;
	var i,l;

	this.id=+row['servid'];
	this.key.mode=row['mode'];
	this.key.longCode=row['long'];
	this.key.shortCode=row['short'];
	this.key.name=row['name'];
	this.validity=valid;

	dataLen=data.length;

	// Read departure time from first stop in hhmm format and convert to minutes from midnight.
	first=+data[1];
	first=~~(first/100)*60+(first%100);

	// Read departure time from last stop in hhmm format and convert to minutes from midnight.
	last=+data[dataLen-1];
	last=~~(last/100)*60+(last%100);

	duration=last-first;
	if(duration<0) {
		// If arrival time at last stop is before first stop, it's probably the next day so check if the difference is over 12 hours.
		if(duration<-12*60) duration+=24*60;
		// If the difference is smaller, there must be an error and not much we can do.
		else duration=0;
	}
	if(duration>12*60) duration=0;

	this.startTime=first;
	this.duration=duration;

	prevStop=this.key.line.stopList[0];
	prevMins=first;
	l=data.length;
	for(i=3;i<dataLen;i+=2) {
		stop=this.key.line.stopList[(i-1)>>1];
		mins=+data[i];
		mins=~~(mins/100)*60+(mins%100);
		duration=mins-prevMins;

		if(duration<0) {
			// If arrival time at previous stop is before current stop, it's probably the next day so check if the difference is over 12 hours.
			if(duration<-12*60) duration+=24*60;
			// If the difference is smaller, there must be an error and not much we can do.
			else duration=0;
		}
		if(duration>12*60) duration=0;

		prevStop.addFollower(stop,duration);

		prevStop=stop;
		prevMins=mins;
	}
};

/** @param {number} stopNum
  * @return {number} Minutes from midnight. */
reach.trans.Trip.prototype.guessArrival=function(stopNum) {
	var statMul;
	var stopCount;
	var totalMeanDuration,totalVarianceSum;
	var correction,delta;
	var line;

	line=this.key.line;
	stopCount=line.stopList.length;
	totalMeanDuration=line.meanDuration[stopCount-1];
	totalVarianceSum=line.variance[stopCount-1];
	statMul=line.lineSet.city.statMul;

	if(totalVarianceSum==0) correction=0;
	else correction=(this.duration*statMul-totalMeanDuration)*line.variance[stopNum]/totalVarianceSum;

	if(this.deltaList && (delta=(/** @type {Array.<number>} */ this.deltaList)[stopNum>>2])) delta=((delta>>>((stopNum&3)*8))&255)-128;
	else delta=0;

//if(dbg && this.deltaList) console.log(this.startTime+'\t'+line.meanDuration[stopNum]+'\t'+correction+'\t'+delta+'\t'+this.duration+'\t'+statMul+'\t'+totalMeanDuration+'\t'+line.variance[stopNum]+'\t'+totalVarianceSum+'\t'+this.deltaList);

	return(this.startTime+~~((line.meanDuration[stopNum]+correction)/statMul+0.5)+delta);
};

/** @param {number} pos
  * @param {boolean} enter
  * @param {reach.route.Conf} conf
  * @return {number} */
reach.trans.Trip.prototype.getTransferCost=function(pos,enter,conf) {
	var transferCost;

	transferCost=0;

	if(enter) {
		if(conf.enterModeCost) transferCost=conf.enterModeCost[this.key.mode];
		if(!transferCost) transferCost=conf.enterCost;
	} else {
		if(conf.leaveModeCost) transferCost=conf.leaveModeCost[this.key.mode];
		if(!transferCost) transferCost=conf.leaveCost;
	}

	transferCost*=60*conf.timeDiv*(1/2+1/(2+2*this.key.line.stopList[pos].departureCount/conf.niceDepartures));
	transferCost=~~(transferCost+0.5);
	if(transferCost==0) transferCost=1;

	return(transferCost);
};

/** @param {reach.route.Conf} conf
  * @return {number} */
reach.trans.Trip.prototype.getTransitCost=function(conf) {
	if(conf.transitJoreCost) {
		for(var i in conf.transitJoreCost) {
			if(this.key.longCode && this.key.longCode.substr(0,i.length)==i) return(conf.transitJoreCost[i]);
		}
	}

	if(conf.transitModeCost) {
//console.log(this.key.mode+' '+conf.transitModeCost[this.key.mode]);
		if(conf.transitModeCost.hasOwnProperty(this.key.mode)) return(conf.transitModeCost[this.key.mode]);
	}

//console.log(conf.transitCost);
	return(conf.transitCost);
};

/** @param {boolean} enter
  * @param {reach.route.Conf} conf
  * @return {number} */
reach.trans.Trip.prototype.getTransferTime=function(enter,conf) {
	if(enter) {
		if(conf.enterModeTime && conf.enterModeTime.hasOwnProperty(this.key.mode)) return(conf.enterModeTime[this.key.mode]);
		else return(conf.enterTime);
	} else {
		if(conf.leaveModeTime && conf.leaveModeTime.hasOwnProperty(this.key.mode)) return(-conf.leaveModeTime[this.key.mode]);
		else return(-conf.leaveTime);
	}
};
goog.provide('reach.trans.Line');
goog.require('reach.trans.Stop');
goog.require('reach.trans.Trip');
goog.require('reach.util');

// TODO: Each line should have a table of transport modes used, to allow quick filterting when some transport modes are disallowed.
/** @constructor
  * @param {reach.trans.LineSet} lineSet */
reach.trans.Line=function(lineSet) {
	/** @type {reach.trans.LineSet} */
	this.lineSet=lineSet;
	/** @type {number} */
	this.id=0;

	/** @type {Array.<reach.trans.Stop>} */
	this.stopList=[];
	/** @type {Array.<reach.trans.Trip>} */
	this.tripList=[];

	/** @type {Object.<number,Object.<string,number>>} Used in compression error delta calculation to map departure times to trip numbers. */
	this.tripFirstTbl;

	/** @type {Object.<number,Array.<reach.trans.Trip>>} */
	this.tripListTbl={};
	/** @type {Array.<number>} Average time in minutes from first stop to reach each stop along the line. */
	this.meanDuration=[0];
	/** @type {Array.<number>} */
	this.variance=[0];

	/** @type {Object.<number,number>} Used to filter out line if none of its trips use an allowed mode of transportation. */
	this.transModeTbl={};

	/** @type {number} */
	this.runId=0;
	/** @type {number} */
	this.firstPos=0;
	/** @type {Array.<number>} */
	this.costList=[];
	/** @type {Array.<number>} */
	this.timeList=[];
	/** @type {Array.<number>} */
//	this.srcPosList=[];
	/** @type {Array.<reach.trans.Stop>} */
	this.srcStopList=[];

	/** @type {Array.<number>} */
	this.distList=[];

	/** @type {number} Number of departures around search start time, to evaluate line niceness. */
	this.departureCount=0;
};

reach.trans.Line.prototype.calcStats=function() {
	var stopNum,stopCount;
	var followerNum;
	var stop,prevStop;
	var duration,variance;
	var stats;

	stopCount=this.stopList.length;
	stop=this.stopList[0];

	duration=0;
	variance=0;

	for(stopNum=1;stopNum<stopCount;stopNum++) {
		prevStop=stop;
		stop=this.stopList[stopNum];

		followerNum=prevStop.followerTbl[stop.id];
		stats=prevStop.statsTo[followerNum];
//		reach.util.assert(prevStop.followerList[followerNum]==stop,'calcStats','Error in follower list.');

		duration+=stats.mean;
		variance+=stats.variance;

		this.meanDuration[stopNum]=duration;
		this.variance[stopNum]=variance;
	}
};

/*
reach.trans.Line.prototype.dump=function(valid) {
	// Has to be fixed to use tripListTbl instead of tripList!
	var statMul;
	var stopNum,stopCount;
	var i,tripNum,tripCount;
	var stop;
	var trip;
	var name;
	var txt;
	var tripList;

	statMul=this.lineSet.city.statMul;
	stopCount=this.stopList.length;

	tripList=this.tripListTbl[valid];
	trip=tripList[0];
	console.log(trip.key.shortCode+'\t'+trip.key.name+'\t'+trip.key.longCode);
	console.log((this.meanDuration[stopCount-1]/statMul)+' +- '+(this.variance[stopCount-1]/statMul));

	txt=new Array(32).join(' ');

	i=0;
	tripCount=tripList.length;
	for(tripNum=0;tripNum<tripCount;tripNum++) {
		trip=tripList[tripNum];
//		if(!(this.lineSet.validList[trip.validity][1]&32)) continue;

		name=''+trip.duration;
//		tripList[i++]=trip;

		txt+=new Array(7-name.length).join(' ')+name;
	}

	console.log(txt);

	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.stopList[stopNum];
		name=stop.name.replace(/[\u00c4\u00c5\u00d6\u00e4\u00e5\u00f6]/g,'?');
		txt=name+(new Array(32-name.length).join(' '));

		tripCount=tripList.length;
		for(tripNum=0;tripNum<tripCount;tripNum++) {
			trip=tripList[tripNum];
//			txt+=' '+reach.util.formatMins(trip.startTime+~~((this.meanDuration[stopNum]+(trip.duration*statMul-this.meanDuration[stopCount-1])*this.variance[stopNum]/this.variance[stopCount-1])/statMul+0.5));
			txt+=' '+reach.util.formatMins(trip.guessArrival(stopNum));
		}

		console.log(txt);
	}
};
*/

/** @param {number} departTime Unit: minutes from midnight.
  * @return {number} */
reach.trans.Line.prototype.findDeparture=function(departTime) {
	var first,last,mid;
	var trip;

	mid=0;
	first=0;
	last=this.tripList.length-1;
	// Binary search to find when the next bus of this line arrives.
	while(first<=last) {
		mid=(first+last)>>1;
		trip=this.tripList[mid];
		if(trip.startTime<departTime) first=mid+1;
		else if(trip.startTime>departTime) last=mid-1;
		else break;
	}

	return(mid);
};

/** @param {number} time
  * @param {number} stopNum
  * @param {number} tripNum
  * @param {number} arrivalTime
  * @param {number} delta
  * @param {number} last
  * @param {reach.route.Conf} conf
  * @return {Array.<number>} */
reach.trans.Line.prototype.nextArrival=function(time,stopNum,tripNum,arrivalTime,delta,last,conf) {
	var prevTime;
	var prevNum;
	var trip;
	var transferTime;

	prevNum=tripNum;
	prevTime=arrivalTime;
	tripNum+=delta;

	for(;tripNum>=0 && tripNum<=last;tripNum+=delta) {
		trip=this.tripList[tripNum];
		if(!trip.getTransitCost(conf)) continue;
		transferTime=trip.getTransferTime(conf.forward,conf);

		arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
		if((time+transferTime-arrivalTime)*delta>0) {
			prevNum=tripNum;
			prevTime=arrivalTime;
		} else return([tripNum,arrivalTime,prevNum,prevTime]);
	}

	return([tripNum,arrivalTime,prevNum,prevTime]);
}

/** @param {number} stopNum   
  * @param {number} time   
  * @param {reach.route.Conf} conf   
  * @return {?{trip:reach.trans.Trip,time:number}} */
reach.trans.Line.prototype.guessArrival=function(stopNum,time,conf) {
	/** @type {reach.trans.Line} */
	var self=this;
	var departTime,arrivalTime,prevTime;
	var trip;
	var tripNum,last;
	var forward;
	var transitCost;
	var transferTime;
	var prevNum;
	var near;

	if(this.tripList.length==0) return(null);

	forward=conf.forward;
	departTime=time/(60*conf.timeDiv)-this.meanDuration[stopNum]/this.lineSet.city.statMul;

	tripNum=this.findDeparture(departTime);
	trip=this.tripList[tripNum];
	// These crazy variables are here because technically different trips on the same could have different modes of transport...
	// Should get rid of them and split the line to two different ones if something that insane happens in the data.
	transitCost=trip.getTransitCost(conf);
	transferTime=trip.getTransferTime(forward,conf);

	arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
	last=this.tripList.length-1;

	prevNum=tripNum;
	prevTime=arrivalTime;

	if((forward && arrivalTime>time+transferTime) || (!forward && arrivalTime<time+transferTime) || !transitCost) {
		// Check if there's an even earlier arrival.
		near=this.nextArrival(time+transferTime,stopNum,tripNum,prevTime,forward?-1:1,last,conf);
		tripNum=near[2];
		arrivalTime=near[3];

		trip=this.tripList[tripNum];
		transitCost=trip.getTransitCost(conf);
		transferTime=trip.getTransferTime(forward,conf);
	}

	if((forward && arrivalTime<time+transferTime) || (!forward && arrivalTime>time+transferTime) || !transitCost) {
		// The transport went already so find a later arrival.
		near=this.nextArrival(time+transferTime,stopNum,tripNum,prevTime,forward?1:-1,last,conf);
		tripNum=near[0];
		arrivalTime=near[1];
		if(tripNum<0 || tripNum>last) return(null);

		trip=this.tripList[tripNum];
		transitCost=trip.getTransitCost(conf);
		transferTime=trip.getTransferTime(forward,conf);
	}

	if((forward && arrivalTime<time+transferTime) || (!forward && arrivalTime>time+transferTime) || !transitCost) return(null);

	return({trip:trip,time:arrivalTime,tripNum:tripNum});
};
goog.provide('reach.trans.TripSet');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.Line');
goog.require('reach.trans.Trip');
goog.require('reach.data.Codec');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.TripSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<{keyIdList:Array.<number>,tripDataTbl:Object.<number,{len:number,list:Array.<reach.trans.Trip>}>}>} */
	this.tripValidList;
	/** @type {Array.<string>} */
	this.keyList;
	/** @type {number} */
	this.keyMaxLen=0;
};

/** @param {reach.trans.LineSet} lineSet */
reach.trans.TripSet.prototype.populate=function(lineSet) {
	var lineNum,lineCount;
	var tripNum,tripCount;
	var line,trip;
	var tripData;
	var tripList;
	var tripKeyStruct;
	/** @type {Array.<{keyIdList:Array.<number>,tripDataTbl:Object.<number,{len:number,list:Array.<reach.trans.Trip>}>}>} */
	var tripValidList=[];
	/** @type {Object.<string,number>} */
	var keyTbl={};
	/** @type {Array.<string>} */
	var keyList=[];
	var keyId,keyCount,keyMaxLen;
	var keyData;

	lineCount=lineSet.list.length;

	keyCount=0;
	keyMaxLen=0;

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineSet.list[lineNum];

		for(var validId in line.tripListTbl) {
			if(!line.tripListTbl.hasOwnProperty(validId)) continue;

			// TODO: rename tripList and/or tripList2
			var tripList2=line.tripListTbl[+validId];
			tripCount=tripList2.length;
			for(tripNum=0;tripNum<tripCount;tripNum++) {
				trip=tripList2[tripNum];
				reach.util.assert(trip.key.line.id==lineNum,'exportTripPack','Incorrect line ID.');
				keyData=lineNum+'\t'+trip.key.mode+'\t'+trip.key.longCode+'\t'+trip.key.shortCode+'\t'+trip.key.name;

				keyId=keyTbl[keyData];
				if(!keyId && keyId!==0) {
					if(keyData.length>keyMaxLen) keyMaxLen=keyData.length;

					keyId=keyCount++;
					keyTbl[keyData]=keyId;
					keyList[keyId]=keyData;
				}

				tripKeyStruct=tripValidList[+validId];
				if(!tripKeyStruct) {
					tripKeyStruct={keyIdList:/** @type {Array.<number>} */ [],tripDataTbl:/** @type {Object.<number,{len:number,list:Array.<reach.trans.Trip>}>} */ {}};
					tripValidList[+validId]=tripKeyStruct;
				}

				tripData=tripKeyStruct.tripDataTbl[keyId];
				if(tripData) {
					tripList=tripData.list;
				} else {
					tripList=[];
					tripData={len:0,list:tripList};

					tripKeyStruct.tripDataTbl[keyId]=tripData;
					tripKeyStruct.keyIdList.push(keyId);
				}

				tripList[tripData.len++]=trip;
			}
		}
	}

	this.tripValidList=tripValidList;
	this.keyMaxLen=keyMaxLen;
	this.keyList=keyList;
};

/** @param {function(string)} write
  * @param {reach.trans.LineSet} lineSet */
reach.trans.TripSet.prototype.exportPack=function(write,lineSet) {
	var codec=new reach.data.Codec();
	var validNum,validCount;
	var keyNum,keyCount;
	var tripNum,tripCount;
	var tripList;
	var trip;
	var keyId,prevKeyId;
	var wait,prevWait;
	var prevId,prevStart,prevDuration;
	var tripKeyStruct;
	var data,row;
	var txt;
	var a,b;

	txt=codec.compressBytes(this.keyList.join('\n'),this.keyMaxLen,10000);
	write(codec.encodeLong([txt.length]));
	write(txt);

	validCount=this.tripValidList.length;
	write(codec.encodeLong([validCount]));

	for(validNum=0;validNum<validCount;validNum++) {
		write(codec.encodeShort(lineSet.validList[validNum]));
	}

	for(validNum=0;validNum<validCount;validNum++) {
		tripKeyStruct=this.tripValidList[validNum];
		if(!tripKeyStruct) {
			write(codec.encodeLong([0,0]));
			continue;
		}

		data=[];

//		prevId=0;
		keyId=0;
		keyCount=tripKeyStruct.keyIdList.length;

		for(keyNum=0;keyNum<keyCount;keyNum++) {
			prevKeyId=keyId;
			keyId=tripKeyStruct.keyIdList[keyNum];
			row=[];

			tripList=tripKeyStruct.tripDataTbl[keyId].list;
			tripCount=tripList.length;

			prevStart=0;
			prevWait=0;
			prevDuration=0;

			for(tripNum=0;tripNum<tripCount;tripNum++) {
				trip=tripList[tripNum];

				wait=trip.startTime-prevStart;
				a=reach.util.fromSigned(wait-prevWait);
				b=reach.util.fromSigned(trip.duration-prevDuration);
//				c=reach.util.fromSigned(trip.id-prevId);

//				prevId=trip.id;
				prevStart=trip.startTime;
				if(tripNum>0) prevWait=wait;
				prevDuration=trip.duration;

//				if(a<3 && b<3 && c==2) row.push(a*3+b);
//				else row.push(a+9,b,c);
				if(a<3 && b<3) row.push(a*3+b);
				else row.push(a+9,b);
			}

			txt=codec.encodeShort(row);
			data.push(codec.encodeShort([reach.util.fromSigned(keyId-prevKeyId),row.length]),txt);
		}

		txt=data.join('');

		txt=codec.compressBytes(txt,txt.length,10000);
		write(codec.encodeShort([keyCount,txt.length]));
		write(txt);
	}

	write('\n');
};

/** @param {reach.data.Stream} stream
  * @param {reach.trans.LineSet} lineSet
  * @param {Array.<number>} validMask
  * @return {function():number} */
reach.trans.TripSet.prototype.importPack=function(stream,lineSet,validMask) {
	var validAccept;
	var validNum,validCount;
	/** @type {number} */
	var tripCount;
	/** @type {Array.<string>} */
	var keyList;
	var keyId;
	var step;

	var advance=function() {
		var validStream;
		var data;
		var dec;
		var len,i;
		var rowLen;
		var keyNum,keyCount;
		var keyData;
		/** @type {{mode:number,longCode:?string,shortCode:?string,name:?string,line:reach.trans.Line}} */
		var key;
		var a,b;
		var startTime,wait,duration;
		var line,trip;
		var first;

		switch(step) {
			// Initialize. 
			case 0:
				step++;

			// Read list of trip codes and names.
			case 1:
				step++;

				data=stream.readPack(stream.readLong(1)[0],10000);
				keyList=data.split('\n');
				return(1);

			// Initialize loop to read trip data.
			case 2:
				step++;

				// Number of timetable valid day masks.
				validCount=stream.readLong(1)[0];
				validAccept=[];

				// Load all masks.
				for(validNum=0;validNum<validCount;validNum++) {
					// Number of calendar days the mask covers.
					len=stream.readShort(1)[0];
					// number of data bytes each with 6 bits of mask.
					i=~~((len+5)/6);

					// Read mask data.
					dec=stream.readShort(i);

					// Initially mark the mask as not matching.
					validAccept[validNum]=false;

					// Compare timetable validity mask with bit field of days for which to load schedule data.
					while(i--) {
						if(dec[i]&validMask[i+1]) {
							// If the timetable validity mask contains days for which we want to load data, mark it as matching.
							validAccept[validNum]=true;
							break;
						}
					}
				}

				// Store IDs of interesting timetable validity masks.
				lineSet.validAccept=validAccept;
//console.log(validMask);
//console.log(validAccept);

				validNum=0;
				break;

			// Iterate to read trip data for different sets of valid days.
			case 3:
				dec=stream.readShort(2);
				keyCount=dec[0];
				len=dec[1];

				tripCount+=keyCount;

				if(!validAccept[validNum]) {
					stream.pos+=len;
					validNum++;
					break;
				}

				data=stream.readPack(len,-1);
				validStream=new reach.data.Stream(data);
				keyId=0;

				for(keyNum=0;keyNum<keyCount;keyNum++) {
					dec=validStream.readShort(2);
					keyId+=reach.util.toSigned(dec[0]);
					rowLen=dec[1];

					keyData=keyList[keyId].split('\t');
					line=lineSet.list[+keyData[0]];
					key={line:line,mode:+keyData[1],longCode:keyData[2],shortCode:keyData[3],name:keyData[4]};

					dec=validStream.readShort(rowLen);

					wait=0;
					startTime=0;
					duration=0;
					first=true;

					for(i=0;i<rowLen;) {
						a=dec[i++];
						if(a<9) {
							b=a%3;
							a=(a-b)/3;
						} else {
							a-=9;
							b=dec[i++];
						}

						wait+=reach.util.toSigned(a);
						duration+=reach.util.toSigned(b);
						startTime+=wait;

						if(first) wait=0;

						trip=new reach.trans.Trip(line,key);
						trip.startTime=startTime;
						trip.duration=duration;
//console.log(trip.key.longCode+' '+startTime+' '+duration);

						if(!line.tripListTbl[validNum]) line.tripListTbl[validNum]=[];
						line.tripListTbl[validNum].push(trip);

						if(!line.transModeTbl[trip.key.mode]) line.transModeTbl[trip.key.mode]=0;
						line.transModeTbl[trip.key.mode]++;

						first=false;
					}
				}

				validNum++;
				break;
		}

		return(validCount-validNum);
	};

	tripCount=0;
	step=0;
	return(advance);
};
goog.provide('reach.trans.LineSet');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.TripSet');
goog.require('reach.trans.Line');
goog.require('reach.data.Codec');
goog.require('reach.io.SQL');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.LineSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<reach.trans.Line>} */
	this.list=[];
	/** @type {number} */
	this.maxRep=16;

	/** @type {Object.<string,number>} */
	this.validBitsTbl={};
	/** @type {Array.<Array.<number>>} */
	this.validList=[];
	/** @type {Array.<boolean>} */
	this.validAccept;
};

/** @param {reach.io.SQL} db
  * @param {reach.trans.StopSet} stopSet */
reach.trans.LineSet.prototype.importKalkati=function(db,stopSet) {
	var codec=new reach.data.Codec();
	var result,row;
	var lineTbl,lineId;
	var data;
	var dataLen;
	var stopIdList;
	var line;
	var lineKey;
	var trip;
	var i,l;
	var validBits;
	var valid;

	this.list=[];
	lineTbl=/** @type {Object.<string,reach.trans.Line>} */ {};

	result=db.query('SELECT servid,mode,long,short,name,valid,data FROM servicedata ORDER BY long,valid DESC,first;');
	lineId=0;

	while(row=result.getRow()) {
		data=(/** @type {Object.<string,string>} */ row)['data'].split(' ');

		dataLen=data.length;

		stopIdList=[];
		for(i=0;i<dataLen;i+=2) stopIdList.push(+data[i]);
		lineKey=stopIdList.join(' ');
		line=lineTbl[lineKey];

		if(!line) {
			line=new reach.trans.Line(this);
			line.id=lineId++;
			lineTbl[lineKey]=line;
			this.list.push(line);

			l=stopIdList.length;
			for(i=0;i<l;i++) {
				line.stopList.push(stopSet.tbl[stopIdList[i]]);
			}
		}

		validBits=row['valid'];
		valid=this.validBitsTbl[validBits];
		if(!valid && valid!==0) {
			valid=this.validList.length;
			this.validBitsTbl[validBits]=valid;
			this.validList[valid]=codec.validBitsToList(validBits);
		}

		trip=new reach.trans.Trip(line);
		trip.importKalkati(row,data,valid);

		if(!line.tripListTbl[valid]) line.tripListTbl[valid]=[];
		line.tripListTbl[valid].push(trip);
	}
};

/** @param {function(string)} write */
reach.trans.LineSet.prototype.exportPack=function(write) {
	var codec=new reach.data.Codec();
	var lineNum,lineCount;
	var i,stopCount;
	var line;
	var stop,prevStop;
	var packNum;
	var repLen;
	var stats;
	var data;
	var maxRep;

	maxRep=this.maxRep;

	lineCount=this.list.length;
	data=[];

	data.push(codec.encodeShort([lineCount]));

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];
		stopCount=line.stopList.length;

		stop=line.stopList[0];
		data.push(codec.encodeShort([stopCount,stop.id]));
		repLen=0;

		for(i=1;i<stopCount;i++) {
			prevStop=stop;

			if(!prevStop.packTbl) {
				prevStop.packTbl={};
				prevStop.packFollowers=0;
			}

			stop=line.stopList[i];
			packNum=prevStop.packTbl[stop.id];
			if(packNum===0) {
				if(repLen==maxRep) {
					data.push(codec.encodeShort([repLen-1]));
					repLen=0;
				}
				repLen++;
			} else {
				if(repLen) data.push(codec.encodeShort([repLen-1]));
				repLen=0;

				if(packNum) {
					data.push(codec.encodeShort([packNum+maxRep-1]));
				} else {
					stats=prevStop.statsTo[prevStop.followerTbl[stop.id]];
					data.push(codec.encodeShort([prevStop.packFollowers+stop.id+maxRep,stats.mean,stats.variance]));
					prevStop.packTbl[stop.id]=prevStop.packFollowers++;
				}
			}
		}
		if(repLen) data.push(codec.encodeShort([repLen-1]));
	}

	write(data.join('')+'\n');
};

/** @param {reach.data.Stream} stream
  * @param {reach.trans.StopSet} stopSet
  * @return {function():number} */
reach.trans.LineSet.prototype.importPack=function(stream,stopSet) {
	/** @type {reach.trans.LineSet} */
	var self=this;
	var lineNum,lineCount;
	var line;
	var stopNum,stopCount;
	var stop,prevStop;
	var id;
	var j,maxRep;
	var followerCount;
	var mean,variance;
	var step;

	var advance=function() {
		var dec;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				maxRep=self.maxRep;
				lineCount=stream.readShort(1)[0];
				lineNum=0;

				return(lineCount-lineNum);

			// Iterate to load info for each line such as list of stops.
			case 1:
				line=new reach.trans.Line(self);
				line.id=lineNum;

				dec=stream.readShort(2);
				stopCount=dec[0];
				stopNum=0;
				stop=stopSet.list[dec[1]];

				stop.lineList.push(line);
				stop.posList.push(stopNum);
				line.stopList[stopNum++]=stop;

				while(stopNum<stopCount) {
					id=stream.readShort(1)[0];
					followerCount=stop.followerList.length;

					if(id<maxRep) {
						// The next <id> stops are in the same order as when those stops were first seen in the data.
						id++;
						while(id--) {
							prevStop=stop;
							stop=prevStop.followerList[0];
							stop.lineList.push(line);
							stop.posList.push(stopNum);
							line.stopList[stopNum++]=stop;
						}
					} else if(id<maxRep+followerCount) {
						// Next stop has already been seen after this stop on other lines so its full ID and reach time aren't needed.
						prevStop=stop;
						stop=prevStop.followerList[id-maxRep+1];
						stop.lineList.push(line);
						stop.posList.push(stopNum);
						line.stopList[stopNum++]=stop;
					} else {
						// Next stop hasn't been seen following this stop so also store reach time mean and variance between the stops.
						dec=stream.readShort(2);
						mean=dec[0];
						variance=dec[1];

						prevStop=stop;
						stop=stopSet.list[id-followerCount-maxRep];
						stop.lineList.push(line);
						stop.posList.push(stopNum);
						line.stopList[stopNum++]=stop;

						prevStop.followerList[followerCount]=stop;
						prevStop.followerTbl[stop.id]=followerCount;
						prevStop.statsTo[followerCount]={mean:mean,variance:variance};
//console.log(followerCount+' '+stop.origId+' '+mean+' '+variance);
					}
				}

				line.calcStats();
				self.list.push(line);

				lineNum++;
				return(lineCount-lineNum);
		}
	};

	step=0;
	return(advance);
};

reach.trans.LineSet.prototype.cleanUp=function() {
	var lineNum,lineCount;
	var line;

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

//		delete(line.tripFirstTbl);
		if(line.tripFirstTbl) line.tripFirstTbl=null;
	}
};

// This used to be called initTrips.
reach.trans.LineSet.prototype.sortTrips=function() {
    var lineNum;
    var line;
    var tripListList;
	var tripNum;

	/** @param {reach.trans.Trip} a
	  * @param {reach.trans.Trip} b
	  * @return {number} */
	function compareTrips(a,b) {
		return(a.startTime-b.startTime);
	}

	for(lineNum=this.list.length;lineNum--;) {
		line=this.city.lineSet.list[lineNum];
		tripListList=[];
		for(var validNum in line.tripListTbl) {
			if(this.validAccept[validNum] && line.tripListTbl.hasOwnProperty(validNum)) {
				tripListList.push(line.tripListTbl[+validNum]);
			}
		}

		// Concatenate together all trip lists from different valid day groups.
		line.tripList=line.tripList.concat.apply(line.tripList,tripListList);

		line.tripList.sort(compareTrips);

		for(tripNum=line.tripList.length;tripNum--;) {
			line.tripList[tripNum].num=tripNum;
		}
	}
};

/** @param {number} startTime Unit: minutes. */
reach.trans.LineSet.prototype.calcNiceness=function(startTime,niceDepartureSpan) {
	var lineNum,lineCount;
	var line;
	var trip;
	var stopList;
	var stopNum,stopCount;
	var stop;
	var lastTime;
	var i,l;

	stopList=this.city.stopSet.list;
	stopCount=stopList.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopList[stopNum];
		stop.departureCount=0;
	}

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

		// Find departures within an hour after search start time.
		lastTime=startTime+niceDepartureSpan;
		l=line.tripList.length;

		line.departureCount=0;
		for(i=line.findDeparture(startTime);i<l;i++) {
			trip=line.tripList[i];
			if(trip.startTime>lastTime) break;
			line.departureCount++;
		}

		stopCount=line.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=line.stopList[stopNum];
			stop.departureCount+=line.departureCount;
		}
	}
};

/** @param {string} data
  * @param {reach.trans.StopSet} stopSet
  * @param {number} distDiv */
reach.trans.LineSet.prototype.importDistPack=function(data,stopSet,distDiv) {
	var codec=new reach.data.Codec();
	var stopNum,stopCount;
	var stop,prevStop;
	var followerNum,followerCount;
	var lineNum,lineCount;
	var line;
	var dist;
	var dec;
	var pos;

	pos=0;

	stopCount=stopSet.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopSet.list[stopNum];
		dec=codec.decodeShort(data,pos,1);
		pos=dec[0];
		followerCount=dec[1];

		for(followerNum=0;followerNum<followerCount;followerNum++) {
			dec=codec.decodeLong(data,pos,2);
			pos=dec[0];

			stop.followerTbl[dec[1]]=dec[2]/distDiv;
		}
	}

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

		stop=line.stopList[0];
		stopCount=line.stopList.length;
		for(stopNum=1;stopNum<stopCount;stopNum++) {
			prevStop=stop;
			stop=line.stopList[stopNum];

			if(prevStop.followerTbl[stop.id]) dist=prevStop.followerTbl[stop.id];
			if(!dist) dist=reach.util.vincenty(prevStop.ll.toDeg(),stop.ll.toDeg());
			if(!dist) dist=0;

			line.distList[stopNum-1]=dist;
		}
	}
};
goog.provide('reach.trans.DeltaSet');
goog.require('reach.trans.LineSet');
goog.require('reach.trans.TripSet');
goog.require('reach.data.Codec');
goog.require('reach.io.SQL');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.DeltaSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<Array.<Array.<number>>>} */
	this.deltaList=[];
};

/** @param {reach.io.SQL} db
  * @param {reach.trans.LineSet} lineSet
  * @param {reach.trans.TripSet} tripSet */
reach.trans.DeltaSet.prototype.importKalkati=function(db,lineSet,tripSet) {
	var codec=new reach.data.Codec();
	var lineNum,lineCount;
	var stopNum,stopCount;
	var tripNum,tripCount;
	var tripList;
	var line,stop,trip;
	var lineTbl;
	var stopIdList;
	var key;
	var validNum;
	var valid;
	var result,row;
	var i,dataLen;
	var data;
	var first,arrival,err;
	var mins,prevMins,duration;
	var deltaList;
	var histogram,sum;

	// Build hashes to find trips by validity bit sets, trip codes, departure times etc.
	lineTbl=/** @type {Array.<string,reach.trans.Line>} */ {};

	i=0;
	for(i in lineSet.validBitsTbl) i++;
	if(i==0) {
		for(i=0;i<lineSet.validList.length;i++) {
			lineSet.validBitsTbl[codec.validListToBits(lineSet.validList[i])]=i;
		}
	}

	lineCount=lineSet.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineSet.list[lineNum];
		line.tripFirstTbl={};

		stopIdList=[];
		stopCount=line.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=line.stopList[stopNum];
			stopIdList.push(stop.origId);
		}
		key=stopIdList.join(' ');
		lineTbl[key]=line;

		for(var valid in line.tripListTbl) {
			if(!line.tripListTbl.hasOwnProperty(valid)) continue;

			validNum=+valid;
			line.tripFirstTbl[validNum]={};
			tripList=line.tripListTbl[validNum];
			tripCount=tripList.length;
			for(tripNum=0;tripNum<tripCount;tripNum++) {
				trip=tripList[tripNum];
				key=trip.startTime+'\t'+trip.key.longCode;
				line.tripFirstTbl[validNum][key]=tripNum;
			}
		}
	}

	histogram=[];
	deltaList=/** @type {Array.<Array.<Array.<number>>>} */ [];

	result=db.query('SELECT servid,mode,long,short,name,valid,data FROM servicedata ORDER BY long,valid DESC,first;');
	while(row=result.getRow()) {
		data=(/** @type {Object.<string,string>} */ row)['data'].split(' ');
		dataLen=data.length;

		stopIdList=[];
		for(i=0;i<dataLen;i+=2) stopIdList.push(+data[i]);
		key=stopIdList.join(' ');
		line=lineTbl[key];

		first=+data[1];
		first=~~(first/100)*60+(first%100);

		valid=lineSet.validBitsTbl[row['valid']];

		key=first+'\t'+row['long'];
		tripNum=line.tripFirstTbl[valid][key];
		trip=line.tripListTbl[valid][tripNum];
		reach.util.assert(trip.startTime==first && trip.key.longCode==row['long'],'DeltaSet.importKalkati','Incorrect tripNum '+tripNum+'.');

		stopNum=0;
		arrival=first;
		prevMins=first;
		for(i=1;i<dataLen;i+=2) {
			mins=+data[i];
			mins=~~(mins/100)*60+(mins%100);
			duration=mins-prevMins;

			if(duration<0) {
				// If arrival time at previous stop is before current stop, it's probably the next day so check if the difference is over 12 hours.
				if(duration<-12*60) duration+=24*60;
				// If the difference is smaller, there must be an error and not much we can do.
				else duration=0;
			}
			if(duration>12*60) duration=0;

			arrival+=duration;
			err=arrival-trip.guessArrival(stopNum);

			if(err<-1 || err>1) {
				if(!deltaList[valid]) deltaList[valid]=/** @type {Array.<Array.<number>>} */ [];
				deltaList[valid].push(/** @type {Array.<number>} */([line.id,tripNum,stopNum,err]));
			}

//console.log(err+'\t'+arrival+'\t'+trip.guessArrival(stopNum));
			err=reach.util.fromSigned(err);
			if(!histogram[err]) histogram[err]=0;
			histogram[err]++;

			prevMins=mins;
			stopNum++;
		}
	}

	this.deltaList=deltaList;
	return(histogram);
};

/** @param {function(string)} write */
reach.trans.DeltaSet.prototype.exportPack=function(write) {
	var codec=new reach.data.Codec();
	var validNum,validCount;
	var data;
	var deltaList;
	var deltaNum,deltaCount;
	var prevLine,prevTrip,prevStop,prevErr,err;
	var out;
	var data2;
	var txt;

	/** @param {Array.<number>} a
	  * @param {Array.<number>} b */
	function compareDeltas(a,b) {
		var d;
		d=a[0]-b[0];if(d) return(d);
		d=a[1]-b[1];if(d) return(d);
		d=a[2]-b[2];if(d) return(d);
		d=a[3]-b[3];
		return(d);
	}

	validCount=this.deltaList.length;
	write(codec.encodeShort([validCount]));

	for(validNum=0;validNum<validCount;validNum++) {
		deltaList=this.deltaList[validNum];
		if(!deltaList) {
			write(codec.encodeShort([0]));
			continue;
		}

		deltaList.sort(compareDeltas);

		prevLine=0;
		prevTrip=0;
		prevStop=0;

		deltaCount=deltaList.length;
		data2=[];

		for(deltaNum=0;deltaNum<deltaCount;deltaNum++) {
			data=deltaList[deltaNum];
//console.log(data);
//console.log(this.city.lineSet.list[data[0]].tripListTbl[validNum][data[1]].name+'\t'+this.city.lineSet.list[data[0]].tripListTbl[validNum][data[1]].startTime);
			err=reach.util.fromSigned(data[3]);

			if(data[0]==prevLine && data[1]==prevTrip && data[2]==prevStop+1) {
				if(err==prevErr) out=[9];
				else out=[10,err];
			} else {
				if(data[0]!=prevLine) {
					prevTrip=0;
					prevStop=0;
				}
				else if(data[1]!=prevTrip) prevStop=0;

				if(data[0]-prevLine<3 && data[1]-prevTrip<3) {
//					console.log(((data[0]-prevLine)*3+data[1]-prevTrip)+'\t'+(data[2]-prevStop)+'\t'+err);
					out=[((data[0]-prevLine)*3+data[1]-prevTrip),(data[2]-prevStop),err];
				} else {
//					console.log((data[0]-prevLine+11)+'\t'+(data[1]-prevTrip)+'\t'+(data[2]-prevStop)+'\t'+err);
					out=[(data[0]-prevLine+11),(data[1]-prevTrip),(data[2]-prevStop),err];
				}
			}

			data2.push(codec.encodeShort(out));

			prevLine=data[0];
			prevTrip=data[1];
			prevStop=data[2];
			prevErr=err;
		}

		txt=codec.compressBytes(data2.join(''),256,10000);
		write(codec.encodeShort([deltaCount,txt.length]));
		write(txt);
	}
};

/** @param {reach.data.Stream} stream
  * @param {reach.trans.LineSet} lineSet
  * @return {function():number} */
reach.trans.DeltaSet.prototype.importPack=function(stream,lineSet) {
	var deltaNum,deltaCount;
	/** @type {number} */
	var tripCount;
	var validNum,validCount;
	/** @type {Array.<boolean>} */
	var validAccept;
	var lineNum,tripNum,stopNum;
	var line;
	var trip;
	var err;
	var dec;
	var pos,pos2,len;
	var decomp;
	var data,data2;
	var step;

	var advance=function() {
		var data;
		var deltaStream;
		var lineDelta;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				validCount=stream.readShort(1)[0];
				validAccept=lineSet.validAccept;
				validNum=0;

			case 1:
				deltaCount=stream.readShort(1)[0];
				tripCount+=deltaCount;

				if(deltaCount==0) {
					validNum++;
					break;
				}

				len=stream.readShort(1)[0];

				if(validAccept && !validAccept[validNum]) {
					stream.pos+=len;
					validNum++;
					break;
				}

				data=stream.readPack(len,10000);
				deltaStream=new reach.data.Stream(data);

				lineNum=0;
				tripNum=0;
				stopNum=0;
				err=0;
//!!!
				for(deltaNum=0;deltaNum<deltaCount;deltaNum++) {
					lineDelta=deltaStream.readShort(1)[0];

					if(lineDelta==9) {
						stopNum++;
					} else if(lineDelta==10) {
						err=reach.util.toSigned(deltaStream.readShort(1)[0]);
						stopNum++;
					} else if(lineDelta<9) {
						dec=deltaStream.readShort(2);
						lineNum+=~~(lineDelta/3);
						if(lineDelta>2) tripNum=0;
						if(lineDelta!=0) stopNum=0;
						tripNum+=lineDelta%3;
						stopNum+=dec[0];
						err=reach.util.toSigned(dec[1]);
					} else {
						dec=deltaStream.readShort(3);
						lineNum+=lineDelta-11;
						if(lineDelta>11) {tripNum=0;stopNum=0;}
						if(dec[1]>0) stopNum=0;
						tripNum+=dec[0];
						stopNum+=dec[1];
						err=reach.util.toSigned(dec[2]);
					}

					line=lineSet.list[lineNum];
					trip=line.tripListTbl[validNum][tripNum];
					if(!trip.deltaList) {
						trip.deltaList=typeof(Uint32Array)!='undefined'?new Uint32Array(line.stopList.length):[];
					}
					if(!trip.deltaList[stopNum>>2]) trip.deltaList[stopNum>>2]=0x80808080;
					trip.deltaList[stopNum>>2]^=(((err+128)&255)^0x80)<<((stopNum&3)*8);
//console.log(((trip.deltaList[stopNum>>2]>>>((stopNum&3)*8))&255)-128);
//					console.log(validNum+'\t'+lineNum+'\t'+tripNum+'\t'+stopNum+'\t'+err);
//for(var x in line.tripListTbl) console.log(x);
//					console.log(line.tripListTbl.length+'\t'+line.tripListTbl[validNum]);
//console.log(line.tripListTbl[validNum][tripNum].deltaList);
				}

				validNum++;
				break;
		}

		return(validCount-validNum);
	};

	tripCount=0;
	step=0;
	return(advance);
};
goog.provide('reach.trans.City');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.LineSet');
goog.require('reach.trans.TripSet');
goog.require('reach.trans.DeltaSet');
goog.require('reach.data.Stream');
goog.require('reach.core.Date');

/** @constructor */
reach.trans.City=function() {
	/** @type {reach.trans.StopSet} */
	this.stopSet=null;
	/** @type {reach.trans.LineSet} */
	this.lineSet=null;
	/** @type {reach.trans.TripSet} */
	this.tripSet=null;
	/** @type {reach.trans.DeltaSet} */
	this.deltaSet=null;
//new reach.trans.DeltaSet(this);
	/** @type {number} */
	this.distDiv=8;
	/** @type {number} */
	this.statMul=60;
	/** @type {number} */
	this.nearStopCount=25;
	/** @type {reach.core.Date} */
	this.firstDate=null;
	/** @type {number} */
	this.dayCount=0;
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.trans.City.prototype.parseStops=function(stream) {
	this.stopSet=new reach.trans.StopSet(this);
	return(this.stopSet.importPack(stream));
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.trans.City.prototype.parseLines=function(stream) {
	this.lineSet=new reach.trans.LineSet(this);
	return(this.lineSet.importPack(stream,this.stopSet));
};

/** @param {reach.data.Stream} stream
  * @param {number} dayNum
  * @return {function():number} */
reach.trans.City.prototype.parseTrips=function(stream,dayNum) {
	var mask;

	this.tripSet=new reach.trans.TripSet(this);
	if(dayNum<0) mask=[60,63,63,63,63,63,63,63,63,63,63];
	else mask=this.makeValidMask([dayNum]);
	return(this.tripSet.importPack(stream,this.lineSet,mask));
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.trans.City.prototype.parseDeltas=function(stream) {
	this.deltaSet=new reach.trans.DeltaSet(this);
	return(this.deltaSet.importPack(stream,this.lineSet));
};

/** @param {Array.<number>} dayList
  * @return {Array.<number>} */
reach.trans.City.prototype.makeValidMask=function(dayList) {
	var mask;
	var dayNum;
	var i,l;

	mask=[this.dayCount];
	l=~~((this.dayCount+5)/6);

	for(i=1;i<=l;i++) {
		mask[i]=0;
	}

	l=dayList.length;
	for(i=0;i<l;i++) {
		dayNum=dayList[i];
		mask[1+~~(dayNum/6)]|=(1<<(5-dayNum%6));
	}

	return(mask);
};
goog.provide('reach.road.NearWay');

// This is basically just a struct definition.
/** @constructor */
reach.road.NearWay=function() {
	/** @type {reach.road.Way} */
	this.way;

	/** @type {reach.road.Node} */
	this.nodePrev;
	/** @type {number} */
	this.distPrev;
	/** @type {reach.road.Node} */
	this.nodeNext;
	/** @type {number} */
	this.distNext;

	/** @type {number} */
	this.dist;

	/** @type {reach.MU} */
	this.ll;
};
goog.provide('reach.road.Tile');
goog.require('reach.road.Way');
goog.require('reach.road.NearWay');
goog.require('reach.road.Node');
goog.require('reach.data.Codec');
goog.require('reach.util');
goog.require('reach.MU');

/** @constructor
  * @param {reach.road.TileTree} tileTree
  * @param {string} path
  * @param {number} id
  * @param {number} sEdge
  * @param {number} wEdge
  * @param {number} nEdge
  * @param {number} eEdge */
reach.road.Tile=function(tileTree,path,id,sEdge,wEdge,nEdge,eEdge) {
	/** @type {reach.road.TileTree} */
	this.tree=tileTree;
	/** @type {string} */
	this.path=path;
	/** @type {number} */
	this.id=id;
	/** @type {number} */
	this.sEdge=sEdge;
	/** @type {number} */
	this.wEdge=wEdge;
	/** @type {number} */
	this.nEdge=nEdge;
	/** @type {number} */
	this.eEdge=eEdge;
	/** @type {reach.road.Tile} */
	this.nw=null;
	/** @type {reach.road.Tile} */
	this.ne=null;
	/** @type {reach.road.Tile} */
	this.sw=null;
	/** @type {reach.road.Tile} */
	this.se=null;
	/** @type {boolean} */
	this.loading=false;
	/** @type {boolean} */
	this.loaded=false;
	/** @type {boolean} */
	this.isLeaf=false;

	/** @type {Array.<boundSW:reach.MU,boundNE:reach.MU>} */
	this.areaList=[];
	/** @type {Array.<reach.road.Tile>} */
	this.neighbours=[];
	/** @type {Array.<reach.road.Way>} */
//	this.wayList=[];
	/** @type {Object.<reach.road.Tile.Persist,Array.<reach.road.Way>>} This is to keep persistent ways when tile is unloaded. */
	this.persistWayTbl={};
	/** @type {Object.<number,reach.road.Node>} */
	this.nodeTbl={};
	/** @type {Array.<reach.road.Node>} */
	this.graphNodeList=null;
	/** @type {number} */
//	this.wayCount=0;
	/** @type {Array.<function(reach.road.Tile)>} */
	this.callbackList=[];

	/** @type {?string} */
	this.rawData=null;
};

/** @enum {number} */
reach.road.Tile.Persist={
	GRAPH:1,	// Data initialized only at program startup, together with routing graph.
	ROAD:2,		// Data loaded from a road network tile and easy to reload.
	TIMETABLE:4,	// Data loaded together with monthly/weekly timetables.
	QUERY:8		// Data passed as a routing query parameter, for example to test routing with additional roads.
};

/** @param {Array.<reach.MU>} ptList
  * @param {Array.<boolean>} connList
  * @param {Array.<number>} distList
  * @param {string} type
  * @param {string} name
  * @param {reach.road.Way.Access} access
  * @param {reach.road.Tile.Persist} persist
  * @param {boolean} readGeom
  * @return {reach.road.Way} */
reach.road.Tile.prototype.insertWay=function(ptList,connList,distList,type,name,access,persist,readGeom) {
	var neighbours;
	var pointNum,pointCount;
	var nodeNum;
	var ll;
	var lat,lon;
	var tileNum;
	var dist;
	var pointList;
	var pointNumList;
	var nodeDistList,geomDistList;
	var connFlag;
	var tile;
	var wayList;
	var way;
	var key;
	var node;

	neighbours=this.neighbours;
	pointCount=ptList.length;

	way=new reach.road.Way(persist);
	way.tile=this;
	way.name=name;
	way.type=type;
	way.access=access;

	pointList=[];
	nodeDistList=[];
	way.pointList=pointList;
	way.nodeDistList=nodeDistList;

	if(readGeom) {
		pointNumList=[];
		geomDistList=[];
		way.pointNumList=pointNumList;
		way.distList=geomDistList;
	}

	connFlag=true;
	nodeNum=0;
	dist=0;

	for(pointNum=0;pointNum<pointCount;pointNum++) {
		ll=ptList[pointNum];
		lat=ll.llat;
		lon=ll.llon;
		dist+=distList[pointNum];
		if(connList) connFlag=connList[pointNum];

		tile=this;
		// This flag means the point is connected to something else, so a node should be created for it.
		if(connFlag) {
			// Check if way begins or ends in another tile.
			if((pointNum==0 || pointNum==pointCount-1) && (lat<this.sEdge || lat>=this.nEdge || lon<this.wEdge || lon>=this.eEdge)) {
				tileNum=neighbours.length;
				while(tileNum--) {
					tile=neighbours[tileNum];
					if(lat>=tile.sEdge && lat<tile.nEdge && lon>=tile.wEdge && lon<tile.eEdge) break;
				}

				if(tileNum<0) {
					tile=this.tree.findTile(ll,0);
					reach.util.assert(!!tile,'Tile.insertWay','Tile containing a way node does not exist!');
					if(tile) neighbours.push(tile);
				}

				// Add reference to another tile found.
				if(nodeNum==0) way.fromTile=tile;
				else way.toTile=tile;
			}

			// Tile should never be null but check anyway in case findTile failed, then insert node in tile.
			if(tile) node=tile.insertNode(ll,persist);
			else node=null;
		} else {
			// Road network has no internal connections but check if a node has anyway already been inserted at this point.
			key=this.nodeKey(ll);
			node=this.nodeTbl[key];
			if(node) this.tree.setNodePersist(node,persist);
		}

		if(node) {
			// Bind created node and way together.
			node.addWayRef(way,nodeNum);
			if(readGeom) {
				pointList[pointNum]=node;
				pointNumList[nodeNum]=pointNum;
				geomDistList[pointNum]=dist;
			} else {
				pointList[nodeNum]=node;
			}
			nodeDistList[nodeNum]=dist;
			nodeNum++;
		} else if(readGeom) {
			// No node created so just store plain coordinates.
			pointList[pointNum]=ll;
			geomDistList[pointNum]=dist;
		}
	}

	if(readGeom) way.pointCount=pointCount;
	else way.pointCount=nodeNum;
	way.nodeCount=nodeNum;

	// Add way to tile.
//	this.wayList[this.wayCount++]=way;
//	if(persist&(reach.road.Tile.Persist.TIMETABLE|reach.road.Tile.Persist.QUERY)) this.persistWayList.push(way);
	// TODO: should do this separately for each bit set in persist!
	wayList=this.persistWayTbl[persist];
	if(!wayList) {
		wayList=[];
		this.persistWayTbl[persist]=wayList;
	}
	wayList.push(way);
	if(persist&(reach.road.Tile.Persist.TIMETABLE|reach.road.Tile.Persist.QUERY)) {
		wayList=this.tree.persistWayTbl[persist];
		if(!wayList) {
			wayList=[];
			this.tree.persistWayTbl[persist]=wayList;
		}
		wayList.push(way);
	}

	return(way);
};

/** @param {reach.road.Way} way */
/*
reach.road.Tile.prototype.removeWay=function(way) {
	var wayList;
	var wayNum,wayCount;

	wayList=this.wayList;
};
*/

/** @param {reach.MU} ll
  * @return {number} */
reach.road.Tile.prototype.nodeKey=function(ll) {
	var x,y,key;

	// The originally 30-bit coordinate pair will fit in 56 bits after about
	// 3 quadtree split levels making tile internal coordinates only (30-splits) bits.
	x=ll.llat-this.sEdge;
	y=ll.llon-this.wEdge;
	// Cantor pairing function, bijectively maps 2 integers into 1.
	// Good for JavaScript since bitwise operators are 32-bit only and slow.
	key=((x+y)*(x+y+1)/2)+y;

	return(key);
};

/** Store way and position along it in a hash based on coordinates.
  * @param {reach.MU} ll
  * @param {reach.road.Tile.Persist} persist
  * @return {reach.road.Node} */
reach.road.Tile.prototype.insertNode=function(ll,persist) {
	var node;
	var key;

	key=this.nodeKey(ll);

	// Here hasOwnProperty has been omitted, since object prototype shouldn't have numerical members.
	node=this.nodeTbl[key];
	if(!node) {
		node=new reach.road.Node(ll);
		node.wayList=[];
		node.posList=[];
//		node.wayCount=0;
		this.nodeTbl[key]=node;
	}
	if(node) this.tree.setNodePersist(node,persist);

	return(node);
};

/** @param {reach.road.Node} node
  * @param {reach.road.Tile.Persist} persist */
reach.road.Tile.prototype.bindNode=function(node,persist) {
	var key;

	key=this.nodeKey(node.ll);
	node.wayList=[];
	node.posList=[];
	this.nodeTbl[key]=node;
	this.tree.setNodePersist(node,persist);
};

/** @param {reach.road.Node} node */
reach.road.Tile.prototype.removeNode=function(node) {
	var key;

	key=this.nodeKey(node.ll);
	if(this.nodeTbl[key]!=node) return;

	// TODO: After the table gets filled with too many nulls, it should be rebuilt by inserting only non-nulls to a new table.
	this.nodeTbl[key]=null;
};

reach.road.Tile.prototype.importGraph=function() {
	var nodeList;
	var nodeNum,nodeCount;
	var node;

	nodeList=this.graphNodeList;
	if(!nodeList) return;
	nodeCount=nodeList.length;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=nodeList[nodeNum];
		this.bindNode(node,reach.road.Tile.Persist.GRAPH);
	}
};

/** @param {reach.task.Task} task
  * @param {reach.MU} ll
  * @param {function(reach.road.Tile)} callback */
reach.road.Tile.prototype.load=function(task,ll,callback) {
	/** @type {reach.road.Tile} */
	var self=this;
	var fetchTask;
	var parseTask;
	var loadTask;

	if(this.loaded) {
		if(callback) callback(this);
		return;
	}
	if(callback) this.callbackList.push(callback);
	if(this.loading) return;
	this.loading=true;

	parseTask=new reach.task.Custom('Parse tile',function(task) {
		var stream;
		var data;

		self.importGraph();

		data=(/** @type {reach.task.FetchResult} */ (fetchTask.result)).data;
		if(!data) {
			// TODO: add error handling, tile retrieval failed.
			self.loaded=true;
			return(null);
		}

		if(!self.rawData) self.rawData=data;
		stream=new reach.data.Stream(data);
		// TODO: set readGeom intelligently here! true is always safe, false saves memory when not needing full road geometry for drawing or geocoding.
		return(self.importPack(stream,true));
//		return(self.importPack(stream,false));
	});

	loadTask=new reach.task.Custom('Load tile',function(task) {
		var i,l;

		self.loading=false;
		self.loaded=true;
		l=self.callbackList.length;
		for(i=0;i<l;i++) self.callbackList[i](self);
		self.callbackList=[];
		return(null);
	});

	loadTask.addDep(parseTask);

	if(!this.rawData) {
		fetchTask=this.tree.loadTile(this,task);
		parseTask.addDep(fetchTask);
		// Make sure connections to stops are loaded first.
		// TODO: removed on 2013-05-01, verify change
		parseTask.addDep(reach.control.ModelTasks.road.refs.parse.task);
	}

	task.runChild(loadTask);

	return(loadTask);
};

/*
reach.road.Tile.prototype.free=function() {
	var wayList;
	var wayNum,wayCount;
	var way;
	var tbl=this.nodeTbl;
	var node;

//	console.log('Free '+this.path);

	// Remove links from nodes to ways, so ways are no longer connected to each other and most can be garbage collected.
	for(var n in tbl) {
		if(!tbl.hasOwnProperty(n)) continue;
		node=tbl[n];

		node.wayList=null;
		node.posList=null;
	}

	wayList=this.wayList;
	wayCount=wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		// The first and last node of way could be disconnected from the way here but only if they point to no other ways,
		// so memory savings would be minimal anyway. If they point to more ways, the nodes might be outside this tile and
		// still be needed to connect ways within tiles in use.
		way=this.wayList[wayNum];
		way.costList=null;
		way.timeList=null;
		way.srcPosList=null;
		way.srcWayList=null;
	}

	this.wayList=[];
	this.nodeTbl={};
};
*/

reach.road.Tile.prototype.freeGeometry=function() {
};

// TODO: loadTileData and loadWayTags should be parameters of this function instead of members of TileTree.
/*
reach.road.Tile.prototype.loadOSM=function() {
	var codec=new reach.data.Codec();
	var wayNum,wayCount;
//	var tileNum,tileCount;
	var dataNum,dataCount;
	var pos;
//	var neighbours;
	var wayDataList;
	var wayData;
	var wayTags;
	var way,node;
	var lat,lon;
	var ll;
	var points;
	var id;
	var type;
	var access,walk,bike;
*/
	/** @type {Object.<string,boolean>} */
/*
	var disallowAll={
		'motorway':true,
		'trunk':true,
		'motorway_link':true,
		'trunk_link':true,
		'construction':true,
		'turning_circle':true,
		'abandoned':true,
		'raceway':true,
		'bridleway':true,
		'motorway_junction':true,
		'proposed':true,
		'unused_path':true,
		'planned':true,
		'seasonal':true,
		'under_construction':true
	};
*/
	/** @type {Object.<string,boolean>} */
/*
	var disallowWalk={
		'cycleway':true
	};
*/
	/** @type {Object.<string,boolean>} */
/*
	var disallowBike={
		'steps':true,
		'elevator':true,
		'stairway':true
	};

	console.log('Loading tile '+this.path);

	wayDataList=this.tree.loadTileData(this.path);
	id=0;

	wayCount=wayDataList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		wayData=codec.decodeOld(wayDataList[wayNum].data);
		wayTags=this.tree.loadWayTags(wayDataList[wayNum].id);
		access=wayTags.access;
		walk=wayTags.walk;
		bike=wayTags.bike;
		type=wayTags.type||'';

		if(access===false || (disallowAll[type] && walk!==true && bike!==true)) continue;

		if(disallowWalk[type] && walk!==true) walk=false;
		if(disallowBike[type] && bike!==true) bike=false;
		if(walk!==false) walk=true;
		if(bike!==false) bike=true;

		points=[];
		lat=this.sEdge;
		lon=this.wEdge;

		pos=0;
		dataCount=wayData.length;
		for(dataNum=0;dataNum<dataCount;pos++) {
			lat+=wayData[dataNum++];
			lon+=wayData[dataNum++];

			ll=new reach.MU(lat,lon);
			points[pos]=ll;
		}

		way=this.insertWay(points,type,wayTags.name||'',walk,bike,false);
		way.id=id++;
	}

	this.loaded=true;
	if(this.tree.onTileLoad) this.tree.onTileLoad(this);
};
*/

/** @param {function(string)} write */
/*
reach.road.Tile.prototype.dump=function(write) {
	var nodeNum,nodeCount;
	var wayNum,wayCount;
	var way,node;
	var ll;
	var data;
	var id;

	write('WKT,id,name\n');

	id=1;
	wayCount=this.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];

		data=[];
		nodeCount=way.nodeList.length;
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			ll=node.ll.toDeg();
			data[nodeNum]=ll.llon+' '+ll.llat;
		}
		write('"LINESTRING ('+data.join(',')+')",'+(id++)+',"'+way.name+'"\n');
	}
};

reach.road.Tile.prototype.clearDumpFlag=function() {
	var nodeNum,nodeCount;
	var wayNum,wayCount;
	var way,node;

	wayCount=this.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];

		nodeCount=way.nodeList.length;
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			node.dumpId=0;
		}
	}
}
*/

/** @param {function(string)} write
  * @param {number} id
  * @return {number} */
/*
reach.road.Tile.prototype.dumpOSM=function(write,id) {
	var nodeNum,nodeCount;
	var wayNum,wayCount;
	var way;
*/
	/** @type {reach.road.Node} */
//	var node;
	/** @type {reach.Deg} */
/*
	var ll;

	wayCount=this.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];

		nodeCount=way.nodeList.length;
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			if(node.clusterRef) node=node.clusterRef;
			ll=node.ll.toDeg();
			if(!node.dumpId) {
				node.dumpId=-(id++);
				write('<node id="'+node.dumpId+'" visible="true" lat="'+ll.llat+'" lon="'+ll.llon+'"></node>\n');
				//write(node.ll.llat+'\t'+node.ll.llon+'\n');
			}
		}
		write('<way id="'+(-(id++))+'">\n');
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			if(node.clusterRef) node=node.clusterRef;
			write('\t<nd ref="'+node.dumpId+'" />\n');
		}
		write('\t<tag k="name" v="'+way.name+'" />\n');
		write('\t<tag k="type" v="'+way.type+'" />\n');
		write('\t<tag k="walk" v="'+(way.walk?'yes':'no')+'" />\n');
		write('\t<tag k="bike" v="'+(way.bike?'yes':'no')+'" />\n');
		write('</way>\n');
	}

	return(id);
};
*/

/** @param {reach.MU} ll
  * @param {number} runId
  * @return {reach.road.NearWay} */
reach.road.Tile.prototype.findWay=function(ll,runId) {
	var lat,lon;
	var nearest,maybeNearest;
	var wayList;
	var wayNum,wayCount;
	var way;

	lat=ll.llat;
	lon=ll.llon;
	nearest=null;

	for(var persist in this.persistWayTbl) {
		if(!this.persistWayTbl.hasOwnProperty(persist)) continue;
		wayList=this.persistWayTbl[(/** @type {reach.road.Tile.Persist} */ persist)];

		wayCount=wayList.length;

		for(wayNum=0;wayNum<wayCount;wayNum++) {
			way=wayList[wayNum];
			// Omit ways added to connect additional points like bus stops to the road network.
			// Otherwise new points could get connected to previous connectors rather than actual roads.
			if(way.type=='routing') continue;
			// Omit ways recently visited if searching for alternative roads when few or no bus stops were
			// reachable from the closest road.
			if(runId && way.runId && way.runId>runId) continue;

			maybeNearest=way.findNearest(ll);
			if(!nearest || maybeNearest.dist<nearest.dist) nearest=maybeNearest;
		}
	}

	return(nearest);
};

/** Calculate minimum distance from point to tile edge.
  * @param {number} lat
  * @param {number} lon
  * @return {number} */
reach.road.Tile.prototype.sqDistTo=function(lat,lon) {
	var edgeList;
	var edgeNum;
	var dlon,dlat;
	var dist,minDist;

	if(lat>=this.sEdge && lat<this.nEdge && lon>=this.wEdge && lon<this.eEdge) return(0);

	edgeList=/** @type {Array.<number>} */ [
		this.sEdge,this.wEdge,
		this.sEdge,this.eEdge,
		this.nEdge,this.wEdge,
		this.nEdge,this.eEdge
	];

	// Check distance to corners.
	dlat=lat-edgeList[0];
	dlon=lon-edgeList[1];
	minDist=dlat*dlat+dlon*dlon;

	for(edgeNum=2;edgeNum<8;) {
		dlat=lat-edgeList[edgeNum++];
		dlon=lon-edgeList[edgeNum++];

		dist=dlat*dlat+dlon*dlon;
		if(dist<minDist) minDist=dist;
	}

	// Check distance to edges.
	if(lat>=this.sEdge && lat<this.nEdge) {
		edgeList=/** @type {Array.<number>} */ [this.wEdge,this.eEdge];
		for(edgeNum=0;edgeNum<2;edgeNum++) {
			dlon=lon-edgeList[edgeNum];

			dist=dlon*dlon;
			if(dist<minDist) minDist=dist;
		}
	}

	if(lon>=this.wEdge && lon<this.eEdge) {
		edgeList=/** @type {Array.<number>} */ [this.sEdge,this.nEdge];
		for(edgeNum=0;edgeNum<2;edgeNum++) {
			dlat=lat-edgeList[edgeNum];

			dist=dlat*dlat;
			if(dist<minDist) minDist=dist;
		}
	}

	return(minDist);
};

/** @param {function(string)} write
  * @param {Array.<string>} typeList
  * @param {Object.<string,number>} typeTbl
  * @param {Array.<string>} nameList
  * @param {Object.<string,number>} nameTbl */
//reach.road.Tile.prototype.exportPack=function(write,typeList,typeTbl,nameList,nameTbl) {
	/** @type {reach.data.Codec} */
/*
	var codec=new reach.data.Codec();
	var nodeNum,nodeCount;
	var wayNum,wayCount;
	var way,node;
	var nameId,typeId;
	var lat,lon;
	var lat1,lon1,latN,lonN;
	var bit,bit1,bitN;

	wayCount=this.wayList.length;
	write(codec.encodeShort([wayCount]));

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];

		typeId=typeTbl[way.type];
		if(!typeId && typeId!==0) {
			typeId=typeList.length;
			typeList[typeId]=way.type;
			typeTbl[way.type]=typeId;
		}

		nameId=nameTbl[way.name];
		if(!nameId && nameId!==0) {
			nameId=nameList.length;
			nameList[nameId]=way.name;
			nameTbl[way.name]=nameId;
		}

		nodeCount=way.nodeList.length;
		write(codec.encodeShort([nameId,typeId,(way.bike?2:0)+(way.walk?1:0),nodeCount]));

		lat=this.sEdge;
		lon=this.wEdge;

		lat1=way.nodeList[0].ll.llat;
		lon1=way.nodeList[0].ll.llon;
		latN=way.nodeList[nodeCount-1].ll.llat;
		lonN=way.nodeList[nodeCount-1].ll.llon;

		bit1=0;
		bitN=0;
		if(lat1<this.sEdge || lat1>=this.nEdge || lon1<this.wEdge || lon1>=this.eEdge) bit1=1;
		if(latN<this.sEdge || latN>=this.nEdge || lonN<this.wEdge || lonN>=this.eEdge) bitN=1;

		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=way.nodeList[nodeNum];
			if(node.clusterRef) node=node.clusterRef;

				bit=0;
				if(node.wayList.length>1) bit=1;
				if(nodeNum==0 || (bit1 && nodeNum==1)) bit=1;
				if(nodeNum==nodeCount-1 || (bitN && nodeNum==nodeCount-2)) bit=1;

				write(codec.encodeLong([reach.util.fromSigned(node.ll.llat-lat)*2+bit,reach.util.fromSigned(node.ll.llon-lon)]));

			lat=node.ll.llat;
			lon=node.ll.llon;
		}
	}
};
*/

/** @param {reach.data.Stream} stream
  * @param {boolean} readGeom
  * @return {function():number} */
reach.road.Tile.prototype.importPack=function(stream,readGeom) {
	/** @type {reach.road.Tile} */
	var self=this;
	var step;
	var typeList;
	var nameList;
	var wayNum,wayCount;

	/** @return {number} */
	var advance=function() {
		var len;
		var data;
		var dec;
		var code;
		var nameId,typeId;
		var flags;
		var access;
		var ptNum,ptCount;
		var pointList;
		var connList;
		var distList;
		var dist;
		var lat,lon;
		var ll,llPrev;
		var dataNum;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				len=stream.readLong(1)[0];
				data=stream.readPack(len,10000);
				typeList=data.split('\n');

				len=stream.readLong(1)[0];
				data=stream.readPack(len,10000);
				nameList=data.split('\n');

				wayNum=0;
				wayCount=stream.readShort(1)[0];
				return(wayCount);

			case 1:
				dec=stream.readShort(4);
				nameId=dec[0];
				typeId=dec[1];
				flags=dec[2];
				ptCount=dec[3];

				access=reach.road.Way.Access.NONE;
				if(flags&1) access|=reach.road.Way.Access.WALK;
				if(flags&2) access|=reach.road.Way.Access.BIKE;

				pointList=[];
				connList=[];
				distList=[];
				dist=0;
				ll=null;
				lat=self.sEdge;
				lon=self.wEdge;

				dec=stream.readLong(ptCount*2);
				dataNum=0;

				for(ptNum=0;ptNum<ptCount;ptNum++) {
					code=dec[dataNum++];
					lat+=reach.util.toSigned(code>>1);
					lon+=reach.util.toSigned(dec[dataNum++]);

					llPrev=ll;
					ll=new reach.MU(lat,lon);
					if(llPrev) dist=ll.distTo(llPrev);
					pointList[ptNum]=ll;
					connList[ptNum]=(ptNum==0 || ptNum==ptCount-1 || code&1);
					distList[ptNum]=dist;
				}

				self.insertWay(pointList,connList,distList,typeList[typeId],nameList[nameId],access,reach.road.Tile.Persist.ROAD,readGeom);
				wayNum++;
				return(wayCount-wayNum);
		}
	};

	step=0;
	return(advance);
};

/** @param {function(reach.road.Tile)} handler */
reach.road.Tile.prototype.forEach=function(handler) {
	/** @param {reach.road.Tile} tile */
	function rec(tile) {
		if(!tile) return;
		handler(tile);

		rec(tile.nw);
		rec(tile.ne);
		rec(tile.sw);
		rec(tile.se);
	}

	rec(this);
};
goog.provide('reach.road.TileTree');
goog.require('reach.road.Tile');
//goog.require('reach.route.InputPoint');
goog.require('reach.data.Codec');
goog.require('reach.util');
goog.require('reach.MU');

/** @constructor
  * @param {function(reach.road.Tile,reach.task.Task):reach.task.Task} loadTile */
reach.road.TileTree=function(loadTile) {
	/** @type {number} */
	this.tileCount=0;
	/** @type {reach.road.Tile} */
	this.root=new reach.road.Tile(this,'0',this.tileCount++,0,0,reach.MU.range,reach.MU.range);
	/** @type {Array.<reach.road.Tile>} */
	this.tileList=[];
	/** @type {function(reach.road.Tile,reach.task.Task):reach.task.Task} */
	this.loadTile=loadTile;
	/** @type {Object.<reach.road.Tile.Persist,Array.<reach.road.Node>>} */
	this.persistNodeTbl={};
	/** @type {Object.<reach.road.Tile.Persist,Array.<reach.road.Way>>} */
	this.persistWayTbl={};
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.road.TileTree.prototype.importPack=function(stream) {
	/** @type {reach.road.TileTree} */
	var self=this;
	var step;
	var splitCount;
	/** @type {Array.<number>} */
	var data;
	var dataPos;
	var tileList;
	/** @type {Array.<reach.road.Tile>} */
	var tileStack;
	var tileCount;

	var advance=function() {
		var sEdge,wEdge,nEdge,eEdge;
		var latSplit,lonSplit;
		var tile;
		var path;
		var i;
		var n;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				splitCount=stream.readShort(1)[0];
				data=stream.readShort(~~(splitCount/3)+1);
				dataPos=0;

				tileList=self.tileList;
				tileStack=/** @type {Array.<reach.road.Tile>} */ [self.root];
				tileCount=self.tileCount;
				return(splitCount);

			case 1:
				n=data[dataPos++];
				for(i=0;i<3 && splitCount;i++) {
					tile=/** @type {reach.road.Tile} */ tileStack.pop();
					tileList[tile.id]=tile;
					path=tile.path;

					sEdge=tile.sEdge;
					wEdge=tile.wEdge;
					nEdge=tile.nEdge;
					eEdge=tile.eEdge;
					latSplit=sEdge+((nEdge-sEdge)>>>1);
					lonSplit=wEdge+((eEdge-wEdge)>>>1);

					splitCount--;
					if((n&3)==2) tile.isLeaf=true;
					if((n&3)==1) {
						tileStack.push(tile.se=new reach.road.Tile(self,path+'3',tileCount++,sEdge,lonSplit,latSplit,eEdge));
						tileStack.push(tile.sw=new reach.road.Tile(self,path+'2',tileCount++,sEdge,wEdge,latSplit,lonSplit));
						tileStack.push(tile.ne=new reach.road.Tile(self,path+'1',tileCount++,latSplit,lonSplit,nEdge,eEdge));
						tileStack.push(tile.nw=new reach.road.Tile(self,path+'0',tileCount++,latSplit,wEdge,nEdge,lonSplit));
					}

					n=n>>>2;
				}

				return(splitCount);
		}
	};

	step=0;
	return(advance);
};

/** @param {reach.MU} ll
  * @param {number} depth Zero for unlimited.
  * @return {reach.road.Tile} */
reach.road.TileTree.prototype.findTile=function(ll,depth) {
	var lat,lon;
	var latSplit,lonSplit;
	var tile,next;

	tile=this.root;
	next=this.root;

	lat=ll.llat;
	lon=ll.llon;

	while(next && --depth) {
		tile=next;
		latSplit=tile.sEdge+((tile.nEdge-tile.sEdge)>>>1);
		lonSplit=tile.wEdge+((tile.eEdge-tile.wEdge)>>>1);

		if(lat<latSplit) next=(lon<lonSplit)?tile.sw:tile.se;
		else next=(lon<lonSplit)?tile.nw:tile.ne;
	}

	return(tile);
};

/** @param {number} boundS
  * @param {number} boundW
  * @param {number} boundN
  * @param {number} boundE
  * @return {reach.road.Tile} */
reach.road.TileTree.prototype.findBoxTile=function(boundS,boundW,boundN,boundE) {
	var latSplit,lonSplit;
	var tile,next;

	tile=this.root;
	next=this.root;

	while(next) {
		tile=next;
		latSplit=tile.sEdge+((tile.nEdge-tile.sEdge)>>>1);
		lonSplit=tile.wEdge+((tile.eEdge-tile.wEdge)>>>1);

		// If tile's center meridian or circle of latitude crosses the bounding box, tile is the innermost tile containing the box.
		if((boundS<latSplit && boundN>=latSplit) || (boundW<lonSplit && boundE>=lonSplit)) return(tile);

		if(boundN<latSplit) next=(boundE<lonSplit)?tile.sw:tile.se;
		else next=(boundE<lonSplit)?tile.nw:tile.ne;
	}

	return(tile);
};

/** @param {function(reach.road.Tile)} handler */
reach.road.TileTree.prototype.forEach=function(handler) {
	/** @param {reach.road.Tile} tile */
	function rec(tile) {
		if(!tile) return;
		handler(tile);

		rec(tile.nw);
		rec(tile.ne);
		rec(tile.sw);
		rec(tile.se);
	}

	rec(this.root);
};

/** @param {string} data */
/*
reach.road.TileTree.prototype.importText=function(data) {
	var codec=new reach.data.Codec();
	var decomp;
	var dec;
	var pos,len;

	pos=0;

	dec=codec.decodeLong(data,pos,1);
	pos=dec[0];
	len=dec[1];

	decomp=codec.decompressBytes(data,pos,len,10000);
	pos=decomp.pos;
	this.typeList=decomp.data.split('\n');

	dec=codec.decodeLong(data,pos,1);
	pos=dec[0];
	len=dec[1];

	decomp=codec.decompressBytes(data,pos,len,10000);
	pos=decomp.pos;
	this.nameList=decomp.data.split('\n');
};
*/

/** @param {string} data */
//reach.road.TileTree.prototype.importTempPack=function(data) {
	/** @type {reach.road.TileTree} */
//	var self=this;
	/** @type {number} */
//	var pos;

//	pos=0;
//	this.forEach(importTile);

	/** @param {reach.road.Tile} tile */
//	function importTile(tile) {
//		pos=tile.importPack(data,pos,self.typeList,self.nameList);
//	}
//};

/** @param {function(string)} write
  * @return {{typeList:Array.<string>,nameList:Array.<string>}} */
//reach.road.TileTree.prototype.exportTempPack=function(write) {
	/** @type {reach.data.Codec} */
//	var codec=new reach.data.Codec();
	/** @type {Array.<string>} */
//	var typeList;
	/** @type {Object.<string,number>} */
//	var typeTbl;
	/** @type {Array.<string>} */
//	var nameList;
	/** @type {Object.<string,number>} */
//	var nameTbl;
//	var typeNum,typeCount,typeLen;
//	var nameNum,nameCount,nameLen;
//	var len;

//	typeList=/** @type {Array.<string>} */ [];
//	typeTbl=/** @type {Object.<string,number>} */ {};
//	nameList=/** @type {Array.<string>} */ [];
//	nameTbl=/** @type {Object.<string,number>} */ {};

//	this.forEach(
		/** @param {reach.road.Tile} tile */
//		function(tile) {
//			if(!tile.isLeaf) return;

//			tile.exportPack(write,typeList,typeTbl,nameList,nameTbl);
//		}
//	);

//	return({typeList:typeList,nameList:nameList,typeLen:typeLen,nameLen:nameLen});
//};

/** @param {reach.MU} ll
  * @param {function(reach.road.Tile)} loadTile
  * @param {number} runId
  * @param {number} snapDist
  * @return {function():reach.road.NearWay} */
// This never returns null even if Tile.findWay does. Instead a sentinel with null way is returned.
reach.road.TileTree.prototype.findWay=function(ll,loadTile,runId,snapDist) {
	/** @type {reach.road.TileTree} */
	var self=this;
	/** @type {Array.<reach.road.Tile>} */
	var tileStack;
	var stackPos;
	/** @type {reach.road.NearWay} */
	var nearest;
	/** @type {reach.road.NearWay} */
	var sentinel;
	var lat,lon;

	lat=ll.llat;
	lon=ll.llon;

	snapDist=ll.llat-ll.offset(-snapDist,0).llat;

	tileStack=/** @type {Array.<reach.road.Tile>} */ [this.root];
	stackPos=1;
	sentinel=/** @type {reach.road.NearWay} */ {way:null,dist:snapDist*snapDist};
	nearest=sentinel;

	function advance() {
		var latSplit,lonSplit;
		var tile,next;
		var maybeNearest;
		var tileList;
		var tileNum;
		var dist;

		while(stackPos>0) {
			tile=tileStack[--stackPos];
			dist=tile.sqDistTo(lat,lon);
			if(dist>nearest.dist) continue;

			if(tile.isLeaf) {
				if(!tile.loaded) {
					// Put tile back in stack and come back to this function when it's loaded.
					stackPos++;
					loadTile(tile);
					return(null);
				}
				maybeNearest=tile.findWay(ll,runId);
				if(maybeNearest && maybeNearest.dist<nearest.dist) nearest=maybeNearest;
				continue;
			}

			latSplit=tile.sEdge+((tile.nEdge-tile.sEdge)>>1);
			lonSplit=tile.wEdge+((tile.eEdge-tile.wEdge)>>1);

			if(lat<latSplit) next=(lon<lonSplit)?tile.sw:tile.se;
			else next=(lon<lonSplit)?tile.nw:tile.ne;

			// Check other quadrants if necessary.
			tileList=/** @type {Array.<reach.road.Tile>} */ [tile.nw,tile.ne,tile.sw,tile.se];
			for(tileNum=0;tileNum<4;tileNum++) {
				tile=tileList[tileNum];
				if(tile && tile!=next) tileStack[stackPos++]=tile;
			}

			// Find closest segment in quadrant where reference point belongs.
			if(next) tileStack[stackPos++]=next;
		}

		if(nearest && nearest!=sentinel) {
			tile=self.findTile(nearest.ll,0);
			if(!tile.loaded) {
				// Come back here when the tile is loaded.
				loadTile(tile);
				// Make sure stack is empty so next call we come straight back to this point.
				stackPos=0;
				return(null);
			}
			nearest=tile.findWay(ll,runId);
			if(nearest && nearest!=sentinel) {
				nearest.ll.llat=~~(nearest.ll.llat+0.5);
				nearest.ll.llon=~~(nearest.ll.llon+0.5);
//				if(nearest.pos==1) {
//					nearest.pos=0;
//					nearest.nodeNum++;
//				}
			}
		}

		return(nearest);
	}

	return(advance);
};

/** @param {string} data
  * @param {reach.road.Tile} tile */
/*
reach.road.TileTree.prototype.importTilePack=function(data,tile) {
	var codec=new reach.data.Codec();
	var pos,len;
	var dec;
	var decomp;
	var typeList,nameList;

	pos=0;

	dec=codec.decodeLong(data,pos,1);
	pos=dec[0];
	len=dec[1];

	decomp=codec.decompressBytes(data,pos,len,10000);
	pos=decomp.pos;
	typeList=decomp.data.split('\n');

	dec=codec.decodeLong(data,pos,1);
	pos=dec[0];
	len=dec[1];

	decomp=codec.decompressBytes(data,pos,len,10000);
	pos=decomp.pos;
	nameList=decomp.data.split('\n');

	tile.importPack(data,pos,typeList,nameList);
};
*/

/** @param {reach.data.Stream} stream
  * @param {Array.<reach.trans.Stop>} stopList
  * @return {function():number} */
reach.road.TileTree.prototype.importStopRefPack=function(stream,stopList) {
	/** @type {reach.road.TileTree} */
	var self=this;
	var stopCount,stopNum;
	var step;

	var advance=function() {
		var stop;
		var lat,lon;
		var llPrev,llNext;
		var way,node;
		var ll;
		var dec;
		var i;

		switch(step) {
			// Initialize. 
			case 0:
				step++;

				stopCount=stopList.length;
				stopNum=0;

				return(stopCount);

			case 1:
				if(stopNum>=stopCount) return(0);

				stop=stopList[stopNum];
				lat=stop.ll.llat;
				lon=stop.ll.llon;
				dec=stream.readShort(4);

				llPrev=new reach.MU(lat+reach.util.toSigned(dec[0]),lon+reach.util.toSigned(dec[1]));
				llNext=new reach.MU(lat+reach.util.toSigned(dec[2]),lon+reach.util.toSigned(dec[3]));
				node=self.addCustomNode(stop.ll,llPrev,llNext,reach.road.Tile.Persist.TIMETABLE);

				if(!node.stopList) node.stopList=[];
				node.stopList.push(stop);
//				stop.inputPoint=new reach.route.InputPoint(stop.ll,null,null,stopNum);
//				stop.inputPoint.node=node;

				stopNum++;
				return(stopCount-stopNum);
		}
	};

	step=0;
	return(advance);
};

/** @param {reach.MU} ll
  * @param {reach.MU} llPrev
  * @param {reach.MU} llNext
  * @param {reach.road.Tile.Persist} persist
  * @return {reach.road.Node} */
reach.road.TileTree.prototype.addCustomNode=function(ll,llPrev,llNext,persist) {
	var llSplit;
	var lat,lon;
	var dlat,dlon;
	var dist;
	var posAlong;
	var way;

	lat=ll.llat;
	lon=ll.llon;

	if((lat==llPrev.llat && lon==llPrev.llon) || (lat==llNext.llat && lon==llNext.llon)) {
		// Node already exists so no need to connect.
		return(this.findTile(ll,0).insertNode(ll,persist));
	}

	dlat=llNext.llat-llPrev.llat;
	dlon=llNext.llon-llPrev.llon;

	if(dlat!=0 || dlon!=0) {
		// Stop is connected in the middle of a road, which needs to be split.
		dist=dlat*dlat+dlon*dlon;
		posAlong=0;
		// Dist should be > 0 since dlats/dlons aren't equal but paranoid test anyway to avoid div by zero...
		if(dist>0) {
			// Nearest position to stop along road segment.
			posAlong=((lat-llPrev.llat)*dlat+(lon-llPrev.llon)*dlon)/dist;
			// If the position lies outside the road segment, move it to one of the end points.
			// Shouldn't happen since then the stop would be connected elsewhere.
			if(posAlong<0) posAlong=0;
			if(posAlong>1) posAlong=1;
		}

		// Coordinates where to split existing road segment.
		llSplit=new reach.MU(llPrev.llat + dlat*posAlong,llPrev.llon + dlon*posAlong);

		// Keep the old segment and just add two new ones on top, connected to the split point.
		this.insertWay([llPrev,llSplit],'routing','',reach.road.Way.Access.WALK,persist);
		this.insertWay([llSplit,llNext],'routing','',reach.road.Way.Access.WALK,persist);
	} else {
		// Stop is connected to a road corner.
		llSplit=llPrev;
	}

	// Add a segment connecting the new node to the existing road network.
	// Note: way must start at ll instead of ending there, so that the returned way will be in the same tile as the new node.
	way=this.insertWay([ll,llSplit],'routing','',reach.road.Way.Access.WALK,persist);
	if(way) return(/** @type {reach.road.Node} */ way.pointList[0]);

	// Somehow failed to create a way?! Bind the stop to a dummy node to recover.
	return(this.findTile(ll,0).insertNode(ll,persist));
};

/** @param {Array.<reach.MU>} pointList
  * @param {string} type
  * @param {string} name
  * @param {reach.road.Way.Access} access
  * @param {reach.road.Tile.Persist} persist
  * @return {reach.road.Way} The part of the way fully inside the tile containing the way's starting point. */
reach.road.TileTree.prototype.insertWay=function(pointList,type,name,access,persist) {
	var boundS,boundW,boundN,boundE;
	var pointNum,pointCount;
	/** @type {Array.<number>} */
	var distList;
	var dist;
	var ll,llPrev;
	var tile;
	var result;
	/** @enum {number} */
	var Quad={
		SW:1,
		SE:2,
		NW:4,
		NE:8
	};

	pointCount=pointList.length;
	if(pointCount==0) return(null);

	ll=pointList[0];
	boundS=ll.llat;
	boundW=ll.llon;
	boundN=ll.llat;
	boundE=ll.llon;

	ll=pointList[0];
	distList=/** @type {Array.<number>} */ [];

	// Calculate bounding box and distance between each point for way.
	for(pointNum=0;pointNum<pointCount;pointNum++) {
		llPrev=ll;
		ll=pointList[pointNum];
		if(ll.llat<boundS) boundS=ll.llat;
		if(ll.llon<boundW) boundW=ll.llon;
		if(ll.llat>boundN) boundN=ll.llat;
		if(ll.llon>boundE) boundE=ll.llon;

		distList[pointNum]=ll.distTo(llPrev);
	}

	// Find tile containing entire bounding box.
	tile=this.findBoxTile(boundS,boundW,boundN,boundE);

	if(tile.isLeaf) return(tile.insertWay(pointList,null,distList,type,name,access,persist,false));

	result=null;

	/** @param {reach.road.Tile} tile
	  * @param {number} pointFirst
	  * @param {number} pointLast
	  * @return {number} */
	function handleLeaf(tile,pointFirst,pointLast) {
		var edgeS,edgeW,edgeN,edgeE;
		var pointNum;
		var lat,lon;
		var way;
		var ll;

		edgeS=tile.sEdge;
		edgeW=tile.wEdge;
		edgeN=tile.nEdge;
		edgeE=tile.eEdge;

		for(pointNum=pointFirst+1;pointNum<=pointLast;pointNum++) {
			ll=pointList[pointNum];

			lat=ll.llat;
			lon=ll.llon;

			if(lat<edgeS || lat>=edgeN || lon<edgeW || lon>=edgeE) {
				way=tile.insertWay(pointList.slice(pointFirst,pointNum+1),null,distList.slice(pointFirst,pointNum+1),type,name,access,persist,false);
				return(pointNum);
			}
		}

		way=tile.insertWay(pointList.slice(pointFirst,pointLast+1),null,distList.slice(pointFirst,pointLast+1),type,name,access,persist,false);
		if(!result) result=way;

		return(pointLast+1);
	}

	/** @param {reach.road.Tile} tile
	  * @param {number} pointPrev
	  * @param {number} pointFirst
	  * @param {number} pointLast
	  * @return {number} */
	function rec(tile,pointPrev,pointFirst,pointLast) {
		var edgeS,edgeW,edgeN,edgeE;
		var latSplit,lonSplit;
		var lat,lon,latPrev,lonPrev;
		var quad,quadPrev,quadMid;
		var pointNum;
		var next,prev;
		var ll;

		// TODO: handle reasonably the case that a line to be added goes through a tile not allocated (no data can be loaded for it).
		if(!tile) {
			return(pointLast+1);
		}

		/** @type {Array.<OpenLayers.Marker.Box>} */
		var boxList=/** @type {Array.<OpenLayers.Marker.Box>} */ [];

		/** @param {reach.road.Tile} tile
		  * @param {string} color
		  * @param {number} width */
		function drawBox(tile,color,width) {
			if(!tile) return;
			var ll1=new reach.MU(tile.sEdge,tile.wEdge).toDeg().toGoog();
			var ll2=new reach.MU(tile.nEdge,tile.eEdge).toDeg().toGoog();
			var box=new OpenLayers.Marker.Box(OpenLayers.Bounds.fromArray([ll1.llon,ll1.llat,ll2.llon,ll2.llat]));
			boxList.push(box);

			box.setBorder(color,width);
			globalMap.quadLayer.layer.addMarker(box);
		}

		function killBoxes() {
			var boxNum,boxCount;

			boxCount=boxList.length;
			for(boxNum=0;boxNum<boxCount;boxNum++) {
				globalMap.quadLayer.layer.removeMarker(boxList[boxNum]);
			}
		}

//		drawBox(tile,'blue',8);

		if(tile.isLeaf) {
//			alert('box');
//			killBoxes();
			return(handleLeaf(tile,pointFirst>0?pointFirst-1:0,pointLast));
		}

		edgeS=tile.sEdge;
		edgeW=tile.wEdge;
		edgeN=tile.nEdge;
		edgeE=tile.eEdge;
		latSplit=edgeS+((edgeN-edgeS)>>>1);
		lonSplit=edgeW+((edgeE-edgeW)>>>1);

		lat=0;
		lon=0;
		quad=0;

		/** Find tiles that the line intersects while they don't directly contain any points along the line.
		  * @param {number} pointPrev
		  * @param {number} pointNum */
		function handleIntersectTile(pointPrev,pointNum) {
			var quad,quadPrev,quadMid;
			/** @type {number} */
			var lat;
			/** @type {number} */
			var lon;
			/** @type {number} */
			var latPrev;
			/** @type {number} */
			var lonPrev;
			var ll;

			/** @param {number} latTest
			  * @param {number} west
			  * @param {number} east
			  * @return {number} */
			function latCheck(latTest,west,east) {
				var lonTest;

				if((lat<latTest)==(latPrev<latTest)) return(0);

				lonTest=(lon-lonPrev)*(latTest-latPrev)/(lat-latPrev)+lonPrev;
				if(lonTest>=edgeW && lonTest<edgeE) return((lonTest<lonSplit)?west:east);
				return(0);
			}

			/** @param {number} lonTest
			  * @param {number} south
			  * @param {number} north
			  * @return {number} */
			function lonCheck(lonTest,south,north) {
				var latTest;

				if((lon<lonTest)==(lonPrev<lonTest)) return(0);

				latTest=(lat-latPrev)*(lonTest-lonPrev)/(lon-lonPrev)+latPrev;
				if(latTest>=edgeS && latTest<edgeN) return((latTest<latSplit)?south:north);
				return(0);
			}

			quadMid=0;

			if(pointNum<=pointLast) {
//				var foop=new reach.MU(pointList[pointNum].llat,pointList[pointNum].llon).toDeg().toGoog();
//				var fooz=new OpenLayers.LonLat(foop.llon,foop.llat);
//				mark2.move(fooz);

				ll=pointList[pointNum];
				lat=ll.llat;
				lon=ll.llon;

				quad=0;
				if(lat>=edgeS && lat<edgeN && lon>=edgeW && lon<edgeE) {
					if(lat<latSplit) {
						quad=(lon<lonSplit)?Quad.SW:Quad.SE;
						next=(lon<lonSplit)?tile.sw:tile.se;
					} else {
						quad=(lon<lonSplit)?Quad.NW:Quad.NE;
						next=(lon<lonSplit)?tile.nw:tile.ne;
					}

//					drawBox(next,'green',8);
				}
			}

			if(pointPrev>=0) {
//				var foop=new reach.MU(pointList[pointPrev].llat,pointList[pointPrev].llon).toDeg().toGoog();
//				var fooz=new OpenLayers.LonLat(foop.llon,foop.llat);
//				mark1.move(fooz);

				ll=pointList[pointPrev];
				latPrev=ll.llat;
				lonPrev=ll.llon;

				quadPrev=0;
				if(latPrev>=edgeS && latPrev<edgeN && lonPrev>=edgeW && lonPrev<edgeE) {
					if(latPrev<latSplit) {
						quadPrev=(lonPrev<lonSplit)?Quad.SW:Quad.SE;
						prev=(lonPrev<lonSplit)?tile.sw:tile.se;
					} else {
						quadPrev=(lonPrev<lonSplit)?Quad.NW:Quad.NE;
						prev=(lonPrev<lonSplit)?tile.nw:tile.ne;
					}

//					drawBox(prev,'red',8);
				}

				if(pointNum<=pointLast) {
					quadMid|=latCheck(edgeN,Quad.NW,Quad.NE);
					quadMid|=latCheck(latSplit,Quad.SW|Quad.NW,Quad.SE|Quad.NE);
					quadMid|=latCheck(edgeS,Quad.SW,Quad.SE);

					quadMid|=lonCheck(edgeW,Quad.SW,Quad.NW);
					quadMid|=lonCheck(lonSplit,Quad.SW|Quad.SE,Quad.NW|Quad.NE);
					quadMid|=lonCheck(edgeE,Quad.SE,Quad.NE);

					quadMid&=~(quad|quadPrev);

//					if(quadMid&Quad.SW) drawBox(tile.sw,'yellow',4);
//					if(quadMid&Quad.SE) drawBox(tile.se,'yellow',4);
//					if(quadMid&Quad.NW) drawBox(tile.nw,'yellow',4);
//					if(quadMid&Quad.NE) drawBox(tile.ne,'yellow',4);
				}
			}

//			alert('box');
//			killBoxes();

			if(quadMid&Quad.SW) rec(tile.sw,pointPrev,pointNum,pointNum);
			if(quadMid&Quad.SE) rec(tile.se,pointPrev,pointNum,pointNum);
			if(quadMid&Quad.NW) rec(tile.nw,pointPrev,pointNum,pointNum);
			if(quadMid&Quad.NE) rec(tile.ne,pointPrev,pointNum,pointNum);
		}

		for(pointNum=pointFirst;pointNum<=pointLast;) {
			handleIntersectTile(pointPrev,pointNum);

			ll=pointList[pointNum];
			lat=ll.llat;
			lon=ll.llon;

			if(lat>=edgeS && lat<edgeN && lon>=edgeW && lon<edgeE) {
				pointNum=rec(next,pointPrev,pointNum,pointLast);
				ll=pointList[pointNum-1];
				lat=ll.llat;
				lon=ll.llon;
				pointPrev=pointNum-1;
//				drawBox(tile,'blue',8);
				if(pointNum>pointLast) handleIntersectTile(pointPrev,pointNum);
			} else break;
		}

		return(pointNum);
	}

	rec(tile,-1,0,pointCount-1);

	return(result);
};

/** @param {reach.road.Node} node
  * @param {reach.road.Tile.Persist} persist */
reach.road.TileTree.prototype.setNodePersist=function(node,persist) {
	var list;

	if(persist&(reach.road.Tile.Persist.TIMETABLE|reach.road.Tile.Persist.QUERY)) {
		// The following properties are only used here, to avoid adding the same node multiple times.
		if(!node.persist) node.persist=/** @type {reach.road.Tile.Persist} */ 0;
		// TODO: handle each set bit separately.
		if((node.persist&persist)!=persist) {
			node.persist|=persist;

			list=this.persistNodeTbl[persist];
			if(!list) {
				list=[];
				this.persistNodeTbl[persist]=list;
			}
			list.push(node);
		}
	}
};

/** @param {reach.road.Tile.Persist} persist */
reach.road.TileTree.prototype.clearData=function(persist) {
	var nodeList;
	var nodeNum,nodeCount;
	var node;
	var wayList;
	var wayNum,wayCount;
	var way;
	var pointList;
	var pointNumList;
	var posList;
	var refList;
	var refNum;
	var tile;

	nodeList=this.persistNodeTbl[persist];
	this.persistNodeTbl[persist]=[];
	if(nodeList) {
		nodeCount=nodeList.length;
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=nodeList[nodeNum];
			wayList=node.wayList;
			// Check if node has been removed already. Should never happen.
			if(!wayList) continue;

			wayCount=wayList.length;
			for(wayNum=0;wayNum<wayCount;wayNum++) {
				way=wayList[wayNum];
				// Check if the way belongs to another persistence class so it shouldn't be removed now.
				if(way.persist&~persist) {
					// TODO: maybe do way.persist&=~persist; so they won't belong to this persistent class any more? Then again that might actually
					// prevent them from getting deleted which defeats the point.
					break;
				}
			}

			if(wayNum==wayCount) {
				// Ready to remove node.
				tile=this.findTile(node.ll,0);
				if(tile) tile.removeNode(node);
				// This saves the effort of removing references to each way individually when nuking ways.
				// The only references to this node should be from ways to be deleted in the next step.
				node.wayList=null;
				node.posList=null;
			}
		}
	}

	wayList=this.persistWayTbl[persist];
	this.persistWayTbl[persist]=[];
	if(wayList) {
		wayCount=wayList.length;
		for(wayNum=0;wayNum<wayCount;wayNum++) {
			way=wayList[wayNum];
			// Check if way doesn't belong to this persistence class or also belongs to others.
			if(way.persist!=persist) {
				way.persist&=~persist;
				continue;
			}

			// TODO: handle this more efficiently somehow, now it's O(n^3) or so.
			pointList=way.pointList;
			pointNumList=way.pointNumList;
			nodeCount=way.nodeCount;
//			if(pointNumList) nodeCount=pointNumList.length;
//			else nodeCount=pointList.length;

			for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
				if(pointNumList) node=pointList[pointNumList[nodeNum]];
				else node=pointList[nodeNum];
				posList=node.posList;
				refList=node.wayList;
				if(!refList) continue;

//				for(refNum=node.wayCount;refNum--;) {
				for(refNum=node.wayList.length;refNum--;) {
					if(refList[refNum]==way) {
						// Remove reference from node to way.
//console.log(refList);
						refList.splice(refNum,1);
						posList.splice(refNum,1);
//						node.wayCount--;
//console.log(refList);
					}
				}
			}

			// Clear tile of all ways in the class to be removed.
			// TODO: would be more efficient to somehow do this assignment only once at the end for each affected tile.
			way.tile.persistWayTbl[persist]=[];

			way.tile=null;
			way.fromTile=null;
			way.toTile=null;

			way.pointList=null;
			way.pointNumList=null;
			way.distList=null;
			way.nodeDistList=null;
		}
	}
};
goog.provide('reach.data.Queue');

/** @constructor */
reach.data.Queue=function() {
	/** @type {Array.<reach.road.Node>} */
	this.list=[];
	/** @type {number} */
	this.allocated=0;
	/** @type {number} */
	this.offset=0;
};

/** @param {reach.road.Node} item */
reach.data.Queue.prototype.insert=function(item) {
	this.list[this.allocated++]=item;
};

/** @return {reach.road.Node} */
reach.data.Queue.prototype.extract=function() {
	var item;

	if(this.allocated==0) return(null);

	item=this.list[this.offset];
	this.list[this.offset++]=null;

	if(this.offset*2>this.allocated) {
		this.list=this.list.slice(this.offset);
		this.allocated-=this.offset;
		this.offset=0;
	}

	return(item);
};
goog.provide('reach.road.NodeGraph');
goog.require('reach.road.TileTree');
goog.require('reach.road.Tile');
goog.require('reach.data.Codec');
goog.require('reach.data.Queue');
goog.require('reach.trans.Stop');
goog.require('reach.util');
goog.require('reach.MU');

/** @constructor */
reach.road.NodeGraph=function() {
	/** @type {Array.<reach.road.Node>} */
	this.nodeList=null;

	/** @type {number} */
	this.distDiv=8;

	/** @type {number} */
	this.nodeNum=0;

	/** @type {number} */
	this.ll2m=0;
};

/** @param {reach.road.TileTree} tree */
//reach.road.NodeGraph.prototype.importTileTree=function(tree) {
	/** @type {Array.<reach.road.Node>} */
/*
	var nodeList;
	var id;

	nodeList=[];
	id=1;

	tree.forEach(convert);
	this.nodeList=nodeList;
*/

	/** !!!param {reach.road.Tile} tile */
/*
	function convert(tile) {
		var nodeNum,nodeCount;
		var wayNum,wayCount;
		var way,node,prevNode;
		var dist;

		wayCount=tile.wayList.length;
		for(wayNum=0;wayNum<wayCount;wayNum++) {
			way=tile.wayList[wayNum];
			nodeCount=way.nodeList.length;

			// Remove unnecessary data structures and set up new empty ones.
			for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
				node=way.nodeList[nodeNum];
				node.wayList=null;
				node.posList=null;
				if(!node.followerList) {
					node.followerCount=0;
					node.followerList=[];
					node.followerTbl={};
					node.distList=[];
				}

				if(!node.id) {
					nodeList.push(node);
					node.id=id++;
				}
			}

			node=way.nodeList[0];

			// Store connections between neighbour nodes along the way.
			for(nodeNum=1;nodeNum<nodeCount;nodeNum++) {
				prevNode=node;
				node=way.nodeList[nodeNum];
				if(node==prevNode) continue;
				dist=way.distList[nodeNum-1];

				if(!prevNode.followerTbl[node.id]) {
					prevNode.followerCount++;
					prevNode.followerList.push(node);
					prevNode.followerTbl[node.id]=prevNode.followerCount;
					prevNode.distList.push(dist);
				}

				if(!node.followerTbl[prevNode.id]) {
					node.followerCount++;
					node.followerList.push(prevNode);
					node.followerTbl[prevNode.id]=node.followerCount;
					node.distList.push(dist);
				}
			}

			way.nodeList=null;
			way.distList=null;
		}

		tile.wayList=null;
	}
};
*/

reach.road.NodeGraph.prototype.countErrors=function() {
	var followerNum,followerCount;
	var nodeNum,nodeCount;
	var node,next;
	var realDist,guessDist;
	var errorCount=0;

	nodeCount=this.nodeList.length;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;

		node.dumpId=0;
		node.runId=0;

		followerCount=node.followerCount;
		for(followerNum=0;followerCount;followerNum++) {
			next=node.followerList[followerNum];
			if(!next) continue;

			followerCount--;

			realDist=node.distList[followerNum];
			guessDist=reach.util.vincenty(node.ll.toDeg(),next.ll.toDeg());
//			if(realDist+0.5/this.distDiv<guessDist) {
			if(realDist+2/this.distDiv<guessDist) {
				console.log(realDist+'\t'+guessDist);
				errorCount++;
			}
		}
	}
	console.log('Errors: '+errorCount);
};

reach.road.NodeGraph.prototype.purge=function() {
	var nodeNum,nodeCount;
	var nodeList;
	var removeCount;
	var followerNum,followerCount;
	var node,next;

	nodeList=this.nodeList;
	nodeCount=nodeList.length;
	removeCount=0;

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=nodeList[nodeNum];
		if(!node) continue;

		if(!node.important) {
			nodeList[node.id-1]=null;
			removeCount++;

			followerCount=node.followerCount;
			for(followerNum=0;followerCount;followerNum++) {
				next=node.followerList[followerNum];
				if(!next) continue;

				followerCount--;

				if(next.important) next.removeFollower(node);
			}
		}
	}

	console.log(removeCount+' nodes removed.');
};

reach.road.NodeGraph.prototype.optimize=function() {
	var nodeNum,nodeCount;
	var nodeList;
	var removeCount,totalRemoveCount;
	var followerNum,followerCount;
	var nextNum,prevNum;
	var node,next,prev;
	var dist;

	nodeList=this.nodeList;
	nodeCount=nodeList.length;
	totalRemoveCount=0;

for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
node=nodeList[nodeNum];
if(!node) continue;
reach.util.assert(node.id-1==nodeNum,'foop','Incorrect node ID '+node.id+'-1 != '+nodeNum+'.');
}

	do {
		removeCount=0;

		// Remove all roads leading to a dead end with no transit stop present.
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=nodeList[nodeNum];
			if(!node) continue;

			reach.util.assert(node.id-1==nodeNum,'foo','Incorrect node ID '+node.id+'-1 != '+nodeNum+'.');

			while(!node.important && node.followerCount==1) {
				next=null;
				for(followerNum=0;!next;followerNum++) next=node.followerList[followerNum];
				next.removeFollower(node);
				nodeList[node.id-1]=null;
				removeCount++;
				node=next;
			}

			if(!node.important && node.followerCount==0) {
				nodeList[node.id-1]=null;
				removeCount++;
			}
		}

		// Remove nodes with exactly 2 neighbours and connect the neighbours directly to each other instead.
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=nodeList[nodeNum];
			if(!node) continue;

			reach.util.assert(node.id-1==nodeNum,'foo','Incorrect node ID '+node.id+'-1 != '+nodeNum+'.');

			if(node.followerCount==0) continue;

			if(!node.important && node.followerCount==2) {
				next=null;
				prev=null;

				for(prevNum=0;!prev;prevNum++) prev=node.followerList[prevNum];
				for(nextNum=prevNum;!next;nextNum++) next=node.followerList[nextNum];

				dist=node.distList[prevNum-1]+node.distList[nextNum-1];

				reach.util.assert(dist==node.distList[node.followerTbl[prev.id]-1]+node.distList[node.followerTbl[next.id]-1],'foo','dist');

				followerNum=next.followerTbl[prev.id];
				if(followerNum) {
					// If next and prev are already connected, update dist if connection through this node is faster.
					if(next.distList[followerNum-1]>dist) next.distList[followerNum-1]=dist;
					next.removeFollower(node);
				} else {
					// Replace node with prev in next's followers.
					followerNum=next.followerTbl[node.id];
					next.followerTbl[node.id]=null;
					next.followerTbl[prev.id]=followerNum;
					next.followerList[followerNum-1]=prev;
					next.distList[followerNum-1]=dist;
				}

				followerNum=prev.followerTbl[next.id];
				if(followerNum) {
					// If prev and next are already connected, update dist if connection through this node is faster.
					if(prev.distList[followerNum-1]>dist) prev.distList[followerNum-1]=dist;
					prev.removeFollower(node);
				} else {
					// Replace node with next in prev's followers.
					followerNum=prev.followerTbl[node.id];
					prev.followerTbl[node.id]=null;
					prev.followerTbl[next.id]=followerNum;
					prev.followerList[followerNum-1]=next;
					prev.distList[followerNum-1]=dist;
				}

				nodeList[node.id-1]=null;
				removeCount++;
			}
		}

		console.log(removeCount+' nodes removed.');
		totalRemoveCount+=removeCount;
	} while(removeCount>0);
};

/** @param {function(string)} write
  * @param {Array.<reach.trans.Stop>} stopList */
reach.road.NodeGraph.prototype.exportPack=function(write,stopList) {
var debug=0;
	var codec=new reach.data.Codec();
	var distDiv;
	var followerNum,followerCount;
	/** @type {Array.<reach.road.Node>} */
	var newList;
	/** @type {Array.<reach.road.Node>} */
	var seenList;
	var nodeNum,nodeCount;
	var stopNum,stopCount;
	var nodeTbl;
	var key;
	var queue;
	var node;
	/** @type {reach.road.Node} */
	var next;
	var lat,lon;
	var dlat,dlon,d;
	var dist;
	var id,nodeId;
	var data,data2;
	var branchCount;
	var itemNum,itemCount;

	var realDist,guessDist;
	var ll2m;

	// Distances are stored as integers so they're multiplied by distDiv to use a predefined level of
	// sub-meter accuracy.
	distDiv=this.distDiv;
	ll2m=this.ll2m;
	realDist=0;
	guessDist=0;
	next=null;

	// Prepare nodes for export and find smallest length multiplier among all node pairs to get true distance
	// in meters from Pythagoras distance in Mercator grid (used as initial guess to compress distance data).
	nodeCount=this.nodeList.length;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;

		node.dumpId=0;
		node.runId=0;
	}

	if(!ll2m) {
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=this.nodeList[nodeNum];
			if(!node) continue;

			followerCount=node.followerCount;
			for(followerNum=0;followerNum<followerCount;followerNum++) {
				next=node.followerList[followerNum];
				if(!next) continue;

				realDist=node.distList[followerNum];
				dlat=next.ll.llat-node.ll.llat;
				dlon=next.ll.llon-node.ll.llon;
				guessDist=Math.sqrt(dlat*dlat+dlon*dlon);

				d=realDist/guessDist;
				if(ll2m==0 || d<ll2m) ll2m=d;
			}
		}

		ll2m=~~(ll2m*(1<<24)*distDiv);
	}

//	console.log('ll2m='+ll2m);

	// Set up FIFO for breadth first search.
	queue=new reach.data.Queue();

	// Insert nodes of all transit stops in queue, their coordinates have already been stored with stops so
	// no need to output them. Instead they're used as a reference to store nearby coordinates as difference only.
	nodeTbl={};
	id=1;
	stopCount=stopList.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		node=stopList[stopNum].node;
		key=node.ll.llat+'\t'+node.ll.llon;
		if(!nodeTbl[key]) {
			nodeTbl[key]=node;
			node.dumpId=id++;
			queue.insert(node);
		}
	}

	data2=[];
	branchCount=0;
	itemCount=0;

	// Breadth first search through all nodes, store their location as difference from previous neighbour.
	while(node=queue.extract()) {
		// Check if node has already been output.
		reach.util.assert(!node.runId,'NodeGraph.exportPack','Node has already been output!');
		if(node.runId) continue;

		node.runId=1;
		nodeId=id;

		branchCount++;
		itemNum=0;

		newList=/** @type {Array.<reach.road.Node>} */ [];
		seenList=/** @type {Array.<reach.road.Node>} */ [];

		followerCount=node.followerCount;
		for(followerNum=0;followerCount;followerNum++) {
			next=node.followerList[followerNum];
			if(!next) continue;

			followerCount--;
			reach.util.assert(followerNum==(node.followerTbl[next.id]-1),'foo','wtf '+followerNum+' '+(node.followerTbl[next.id]-1));

			if(!next.runId) {
				if(next.dumpId) {
					seenList.push(next);
				} else {
					newList.push(next);
					next.dumpId=id++;
				}
			}
		}

		lat=node.ll.llat;
		lon=node.ll.llon;

		data=[codec.encodeShort([reach.util.zip(newList.length,seenList.length)])];

		// Output connections to new nodes along with their coordinates.
		followerCount=newList.length;
		for(followerNum=0;followerNum<followerCount;followerNum++) {
			next=newList[followerNum];
			dist=~~(node.distList[node.followerTbl[next.id]-1]*distDiv+0.5);

			dlat=next.ll.llat-lat;
			dlon=next.ll.llon-lon;
			d=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24));
			if(d>dist) console.log('ERROR '+d+'\t'+dist);
//if(debug) console.log(lat+'\t'+lon+'\t'+next.ll.llat+'\t'+next.ll.llon+'\t'+Math.sqrt(dlat*dlat+dlon*dlon)+'\t'+ll2m+'\t'+d+'\t'+dist);
//console.log(dist+'\t'+d+'\t'+(dist-d));

			data[++itemNum]=codec.encodeShort([reach.util.fromSigned(dlat),reach.util.fromSigned(dlon),dist-d]);
			queue.insert(next);
		}

		// Output connections to already stored nodes by referring to their ID.
		followerCount=seenList.length;
		for(followerNum=0;followerNum<followerCount;followerNum++) {
			next=seenList[followerNum];
			dist=~~(node.distList[node.followerTbl[next.id]-1]*distDiv+0.5);

			dlat=next.ll.llat-lat;
			dlon=next.ll.llon-lon;
			d=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24));
			reach.util.assert(d<=dist,'NodeGraph.exportPack',d+' > '+dist);
//			if(d>dist) console.log('ERROR '+d+'\t'+dist);

//if(debug) console.log(lat+'\t'+lon+'\t'+next.ll.llat+'\t'+next.ll.llon+'\t'+Math.sqrt(dlat*dlat+dlon*dlon)+'\t'+ll2m+'\t'+d+'\t'+dist+'\t'+next.dumpId+'\t'+nodeId);
//console.log(nodeId+'\t'+(nodeId-next.dumpId)+'\t'+next.dumpId+'\t'+next.ll.llat+'\t'+next.ll.llon);
//console.log(dist+'\t'+d+'\t'+(dist-d));
			data[++itemNum]=codec.encodeShort([nodeId-next.dumpId,dist-d]);
		}

		itemCount+=itemNum;
		data2.push(data.join(''));
	}

	write(codec.encodeLong([ll2m,branchCount,itemCount]));
	write(data2.join(''));

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;
		if(!node.dumpId) this.nodeList[nodeNum]=null;
		node.dumpId=0;
	}
};

/** @param {reach.data.Stream} stream
  * @param {Array.<reach.trans.Stop>} stopList
  * @return {function():number} */
reach.road.NodeGraph.prototype.importPack=function(stream,stopList) {
	/** @type {reach.road.NodeGraph} */
	var self=this;
	/** @type {Object.<string,reach.road.Node>} */
	var nodeTbl;
	/** @type {Array.<reach.road.Node>} */
	var nodeList;
	/** @type {number} */
	var nodeNum;
	var stopNum,stopCount;
	var distDiv,ll2m;
	/** @type {reach.data.Queue} */
	var queue;
	var pos;
	var step;
	var branchCount;
	var itemNum,itemCount;

	var advance=function() {
		var followerNum,followerCount;
		var node,next;
		var lat,lon;
		var dlat,dlon,dist,d;
		var key;
		var stop;
		var dec;
		var counts;
		var nodeId;

		switch(step) {
			// Initialize. 
			case 0:
				step++;

				nodeTbl=/** @type {Object.<string,reach.road.Node>} */ {};
				nodeList=/** @type {Array.<reach.road.Node>} */ [];
				nodeNum=1;

				distDiv=self.distDiv;

				// Set up FIFO for breadth first search.
				queue=new reach.data.Queue();

				// Start from nodes for all transit stops, node coordinates are then stored as difference
				// from previous nodes.
				stopCount=stopList.length;
				for(stopNum=0;stopNum<stopCount;stopNum++) {
					stop=stopList[stopNum];
					key=stop.ll.llat+'\t'+stop.ll.llon;
					node=nodeTbl[key];
					if(!node) {
						node=new reach.road.Node(stop.ll);
						nodeTbl[key]=node;

						node.followerCount=0;
//						node.followerTbl={};
						node.followerList=[];
						node.distList=[];

						node.stopList=[];

						nodeList[nodeNum-1]=node;
						queue.insert(node);
						node.id=nodeNum++;
					}

					// Several stops can overlap and share a node.
					node.stopList.push(stop);
					stop.node=node;
				}

				dec=stream.readLong(3);
				ll2m=dec[0];
				branchCount=dec[1];
				itemCount=dec[2];
				self.ll2m=ll2m;
				self.nodeList=nodeList;

				break;

			case 1:
				node=queue.extract();
				if(!node) {
					step++;
					self.nodeNum=nodeNum;
					return(0);
				}

				// Check if node has already been processed.
				reach.util.assert(!node.runId,'NodeGraph.importPack','Node has already been processed!');
				if(node.runId) break;

				node.runId=1;
				nodeId=nodeNum;
				branchCount--;

				lat=node.ll.llat;
				lon=node.ll.llon;

				counts=reach.util.unzip(stream.readShort(1)[0]);

				// Read connections to new nodes that haven't been seen before.
				followerCount=counts[0];
				for(followerNum=0;followerNum<followerCount;followerNum++) {
					dec=stream.readShort(3);
					dlat=reach.util.toSigned(dec[0]);
					dlon=reach.util.toSigned(dec[1]);

					d=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24));
					dist=(d+dec[2])/distDiv;
//					dist=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24)+dec[3]+0.5)/distDiv;
//					dist=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24)+dec[3]+0.5)/distDiv;
//					dist=(~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24))/distDiv+dec[3]+0.5)/distDiv;
					next=new reach.road.Node(new reach.MU(lat+dlat,lon+dlon));
					key=(lat+dlat)+'\t'+(lon+dlon);
//					nodeTbl[key]=next;

					next.followerCount=1;
//					next.followerTbl={};
					next.followerList=[node];
					next.distList=[dist];
//					next.followerTbl[node.id]=1;

					nodeList[nodeNum-1]=next;
					queue.insert(next);
					next.id=nodeNum++;

					node.followerList[node.followerCount]=next;
					node.distList[node.followerCount++]=dist;
//					node.followerTbl[next.id]=node.followerCount;
				}

				// Read connections to previously seen nodes.
				followerCount=counts[1];
				for(followerNum=0;followerNum<followerCount;followerNum++) {
					dec=stream.readShort(2);

					next=nodeList[nodeId-dec[0]-1];
					dlat=next.ll.llat-lat;
					dlon=next.ll.llon-lon;
					d=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24));
					dist=(d+dec[1])/distDiv;
//					dist=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24)+dec[2]+0.5)/distDiv;
//					dist=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24)+dec[2]+0.5)/distDiv;
//					dist=(~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24))/distDiv+dec[2]+0.5)/distDiv;

					next.followerList[next.followerCount]=node;
					next.distList[next.followerCount++]=dist;
//					next.followerTbl[node.id]=next.followerCount;

					node.followerList[node.followerCount]=next;
					node.distList[node.followerCount++]=dist;
//					node.followerTbl[next.id]=node.followerCount;

//if(debug) console.log(lat+'\t'+lon+'\t'+next.ll.llat+'\t'+next.ll.llon+'\t'+Math.sqrt(dlat*dlat+dlon*dlon)+'\t'+ll2m+'\t'+d+'\t'+(dist*distDiv)+'\t'+next.id+'\t'+nodeId);
//console.log(nodeId+'\t'+dec[1]+'\t'+next.id+'\t'+next.ll.llat+'\t'+next.ll.llon);
//console.log(dist*distDiv+'\t'+d+'\t'+dec[2]);
//			dist=~~(dist*distDiv+0.5);
//			if(dist-d!=dec[2]) console.log((dist-d)+'\t'+dec[2]);
				}

				break;
		}

		return(branchCount+1);
	};

	step=0;
	return(advance);
};

/** @param {string} data
  * @param {reach.trans.StopSet} stopSet */
reach.road.NodeGraph.prototype.importTweaks=function(data,stopSet) {
	var txtList;
	var txtNum,txtCount;
	var fieldList;
	var srcList,dstList;
	var srcNum,srcCount;
	var dstNum,dstCount;
	var srcStop,dstStop;
	var dist;

	txtList=data.split(/\r?\n\r?/);
	txtCount=txtList.length;
//console.log(txtList);
	for(txtNum=0;txtNum<txtCount;txtNum++) {
		// Split on single tabs or any whitespace longer than one character.
		// Can't use () in split regexp due to cross-browser issues.
		if(txtList[txtNum].match(/(^[ \t]*#)|(^[ \t]*$)/)) continue;
		fieldList=txtList[txtNum].replace(/\t/g,'\t ').split(/[ \t][ \t][ \t]*/);
//console.log('Line '+txtNum+'\t'+fieldList.length);
		if(fieldList.length<5) {
			console.log('Too few fields ('+fieldList.length+' when 5 needed) on connections line '+(txtNum+1));
//console.log(fieldList);
			continue;
		}
//		console.log(fieldList);

		srcList=fieldList[0].split(',');
		dstList=fieldList[2].split(',');
		dist=+fieldList[4];

		srcCount=srcList.length;
		dstCount=dstList.length;
//console.log(srcCount+'\t'+dstCount);

		for(srcNum=0;srcNum<srcCount;srcNum++) {
			srcStop=stopSet.tbl[+srcList[srcNum]];
			if(!srcStop) {
				console.log('No stop with ID '+srcList[srcNum]+' on connections line '+(txtNum+1));
				continue;
			}
			// Make sure stop name matches conf file, but only compare alphanumeric characters in lowercase to avoid errors from minor differences.
			if(srcStop.name.replace(/[^A-Za-z]/g,'').toLowerCase()!=fieldList[1].replace(/[^A-Za-z]/g,'').toLowerCase()) {
				console.log('Stop name mismatch in connections line '+(txtNum+1)+', found '+srcStop.name+' and wanted '+fieldList[1]);
				continue;
			}

			for(dstNum=0;dstNum<dstCount;dstNum++) {
				dstStop=stopSet.tbl[+dstList[dstNum]];
				if(!dstStop) {
					console.log('No stop with ID '+dstList[dstNum]+' on connections line '+(txtNum+1));
					continue;
				}
				if(dstStop.name.replace(/[^A-Za-z]/g,'').toLowerCase()!=fieldList[3].replace(/[^A-Za-z]/g,'').toLowerCase()) {
					console.log('Stop name mismatch in connections line '+(txtNum+1)+', found '+dstStop.name+' and wanted '+fieldList[3]);
					continue;
				}

				srcStop.node.connectTo(dstStop.node,dist);
				dstStop.node.connectTo(srcStop.node,dist);
//console.log(srcStop.name+'\t'+dstStop.name+'\t'+dist);
			}
		}
	}
};

/** @param {function(string)} write */
/*
reach.road.NodeGraph.prototype.dumpOSM=function(write) {
	var followerNum,followerCount;
	var nodeNum,nodeCount;
	var node,next;
	var ll;
	var id;
	var lst;
	var i,l;
	var stop;

	write('<?xml version="1.0" encoding="UTF-8"?>\n');
	write('<osm version="0.6" generator="BusFaster Reach">\n');

	id=1;
	nodeCount=this.nodeList.length;

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;

		node.dumpId=0;
	}

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;

		node.dumpId=-(id++);
		ll=node.ll.toDeg();
		write('<node id="'+node.dumpId+'" visible="true" lat="'+ll.llat+'" lon="'+ll.llon+'">');
		if(node.stopList) {
			lst=[];
			l=node.stopList.length;
			for(i=0;i<l;i++) {
				stop=node.stopList[i];
			lst.push(stop.origId+' '+stop.name);
			}
			write('\t<tag k="name" v="'+lst.join(', ')+'" />');
		}
		write('</node>\n');

		followerCount=node.followerCount;
		for(followerNum=0;followerCount;followerNum++) {
			next=node.followerList[followerNum];
			if(!next) continue;

			followerCount--;

			if(next.dumpId) {
				write('<way id="'+(-(id++))+'">\n');
				write('\t<nd ref="'+node.dumpId+'" />\n');
				write('\t<nd ref="'+next.dumpId+'" />\n');
				write('\t<tag k="name" v="'+node.distList[followerNum]+'" />');
				write('</way>\n');
			}
		}
	}

	write('</osm>\n');
};
*/
goog.provide('reach.road.Net');
goog.require('reach.road.NodeGraph');
goog.require('reach.road.TileTree');
goog.require('reach.data.Stream');
goog.require('reach.trans.City');

/** @constructor
  * @param {reach.trans.City} city */
reach.road.Net=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/* type {reach.road.NodeGraph} */
	this.graph=null;
	/** @type {reach.road.TileTree} */
	this.tree=null;

	/** @type {Array.<Array.<number>>} */
	this.areaList=[
//		[60.17163,24.93930,60.17220,24.93986],	// Elielinaukion bussilaiturit
		[60.17130,24.93929,60.17220,24.93986],	// Elielinaukion bussilaiturit
		[60.17053,24.94004,60.17219,24.94045],	// Vltavan it‰puolinen aukio
		[60.17213,24.93992,60.17258,24.94047],	// Elielinaukion junalaiturit ja tunnelin sis‰‰nk‰ynti
		[60.19845,24.93266,60.19916,24.93457],	// Pasilan asema
		[60.16864,24.93057,60.16898,24.93153],	// Kampin bussilaiturit
		[60.20976,25.07690,60.21010,25.07730],	// It‰keskuksen metroaseman bussilaiturit
		[60.20863,25.07873,60.21042,25.08480],	// It‰keskus
		[60.20980,25.07990,60.21144,25.08206],	// Tallinnanaukio
		[60.22985,24.94215,60.23057,24.94260],	// Tuusulanv‰yl‰n liittym‰ Maunulan kohdalla
		[60.25112,25.01005,60.25203,25.01161]	// Malmin asema
	];

	/** @type {Object.<string,reach.road.Node>} */
	this.areaNodeTbl={};
	/** @type {number} */
	this.areaGrain=512;
	/** @type {number} */
	this.areaNodeMinID=0;
};

/** @param {reach.data.Stream} stream
  * @param {function(reach.road.Tile,reach.task.Task):reach.task.Task} loadTile
  * @return {function():number} */
reach.road.Net.prototype.initTree=function(stream,loadTile) {
	this.tree=new reach.road.TileTree(loadTile);
	return(this.tree.importPack(stream));
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.road.Net.prototype.parseGraph=function(stream) {
	this.graph=new reach.road.NodeGraph();
	return(this.graph.importPack(stream,this.city.stopSet.list));
};

/** @param {string} data */
reach.road.Net.prototype.parseTweaks=function(data) {
//	return(this.graph.importTweaks(data,this.city.stopSet));
	this.graph.importTweaks(data,this.city.stopSet);
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.road.Net.prototype.parseRefs=function(stream) {
	return(this.tree.importStopRefPack(stream,this.city.stopSet.list));
};

/** Add to each tile a list of routing graph nodes within its bounds.
  * @param {reach.task.Task} task
  * @return {function():number} */
reach.road.Net.prototype.bindGraph=function(task) {
	/** @type {reach.road.Net} */
	var self=this;
	var step;

	/** @enum {number} */
	var steps={
		init:0
	};

	var advance=function() {
		switch(step) {
			// Initialize.
			case steps.init:
				step++;

				// TODO: consider removing recursion.
				/** Recursively partition list of nodes according to boundaries of tile's children.
				  * @param {reach.road.Tile} tile
				  * @param {Array.<reach.road.Node>} nodeList */
				function rec(tile,nodeList) {
					var listSW,listSE,listNW,listNE,list;
					var latSplit,lonSplit;
					var nodeNum,nodeCount;
					var node;
					var ll;

					if(tile.isLeaf) {
						tile.graphNodeList=nodeList;
					} else {
						listSW=[];
						listSE=[];
						listNW=[];
						listNE=[];

						latSplit=tile.sEdge+((tile.nEdge-tile.sEdge)>>>1);
						lonSplit=tile.wEdge+((tile.eEdge-tile.wEdge)>>>1);

						nodeCount=nodeList.length;
						for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
							node=nodeList[nodeNum];
							ll=node.ll;
							if(ll.llat<latSplit) list=(ll.llon<lonSplit)?listSW:listSE;
							else list=(ll.llon<lonSplit)?listNW:listNE;

							list.push(node);
						}

						if(listSW.length && tile.sw) rec(tile.sw,listSW);
						if(listSE.length && tile.se) rec(tile.se,listSE);
						if(listNW.length && tile.nw) rec(tile.nw,listNW);
						if(listNE.length && tile.ne) rec(tile.ne,listNE);
					}

					nodeList=null;
				}

				self.addWalkAreas(task);
				rec(self.tree.root,self.graph.nodeList);
				self.bindWalkAreas(task);

				break;
		}

		return(0);
	}

	step=steps.init;
	return(advance);
};

/** @param {reach.task.Task} task */
reach.road.Net.prototype.addWalkAreas=function(task) {
	var areaList;
	var pos,posCount;
	var layer;
	var ll1,ll2;
	var llSW,llNE;
	var edgeS,edgeW,edgeN,edgeE;
	var lat,lon;
	var key;
	var nodeTbl;
	var node;
	var nodeNum;
	var box;
	var grain,mask;

	areaList=this.areaList;
	posCount=areaList.length;

/*
	if(reach.env.platform==reach.env.Type.BROWSER) {
		layer=new OpenLayers.Layer.Boxes('Walk areas');
		for(pos=0;pos<posCount;pos++) {
			ll1=new reach.Deg(areaList[pos][0],areaList[pos][1]).toGoog();
			ll2=new reach.Deg(areaList[pos][2],areaList[pos][3]).toGoog();
			box=new OpenLayers.Marker.Box(OpenLayers.Bounds.fromArray([ll1.llon,ll1.llat,ll2.llon,ll2.llat]));
			layer.addMarker(box);
		}

		globalMap.map.addLayers([layer]);
	}
*/

	grain=this.areaGrain;
	mask=grain-1;
	nodeNum=this.graph.nodeNum;
	nodeTbl=this.areaNodeTbl;
	this.areaNodeMinID=nodeNum;

	for(pos=0;pos<posCount;pos++) {
		llSW=new reach.Deg(areaList[pos][0],areaList[pos][1]).toMU();
		llNE=new reach.Deg(areaList[pos][2],areaList[pos][3]).toMU();
		edgeS=(~~llSW.llat+mask)&~mask;
		edgeW=(~~llSW.llon+mask)&~mask;
		edgeN=~~llNE.llat&~mask;
		edgeE=~~llNE.llon&~mask;

		if(edgeS>edgeN || edgeW>edgeE) continue;

		for(lat=edgeS;lat<=edgeN;lat+=grain) {
			for(lon=edgeW;lon<=edgeE;lon+=grain) {
				key=lat+'\t'+lon;
				node=nodeTbl[key];

				if(!node) {
					node=new reach.road.Node(new reach.MU(lat,lon));
					node.followerCount=0;
					node.followerList=[];
					node.distList=[];

					nodeTbl[key]=node;
					this.graph.nodeList[nodeNum-1]=node;
					node.id=nodeNum++;
				}
//node.followerList[node.followerCount]=next;
//node.distList[node.followerCount++]=dist;
			}
		}
	}

	this.graph.nodeNum=nodeNum;
};

reach.road.Net.prototype.bindWalkAreas=function(task) {
	var areaList;
	var pos,posCount;
	var tile;
	var llSW,llNE;
	var edgeS,edgeW,edgeN,edgeE;
	var lat,lon;
	var key;
	var nodeTbl;
	var node,nodeW,nodeSW,nodeS,nodeSE;
	var nodeNum;
	var box;
	var grain,mask;
	var areaNodeMinID;

	areaList=this.areaList;
	posCount=areaList.length;
	areaNodeMinID=this.areaNodeMinID;

	grain=this.areaGrain;
	mask=grain-1;
	nodeNum=this.graph.nodeNum;
	nodeTbl=this.areaNodeTbl;
	this.areaNodeMinID=nodeNum-1;

	for(pos=0;pos<posCount;pos++) {
		llSW=new reach.Deg(areaList[pos][0],areaList[pos][1]).toMU();
		llNE=new reach.Deg(areaList[pos][2],areaList[pos][3]).toMU();
		edgeS=(~~llSW.llat+mask)&~mask;
		edgeW=(~~llSW.llon+mask)&~mask;
		edgeN=~~llNE.llat&~mask;
		edgeE=~~llNE.llon&~mask;

		if(edgeS>edgeN || edgeW>edgeE) continue;

		tile=this.tree.findBoxTile(llSW.llat,llSW.llon,llNE.llat,llNE.llon);
		tile.forEach(
			/** @param {reach.road.Tile} tile */
			function(tile) {
				var nodeList;
				var nodeNum,nodeCount;
				var node,areaNode;
				var lat,lon;
				var key;

				if(!tile.isLeaf) return;

				tile.areaList.push({boundSW:llSW,boundNE:llNE});
				nodeList=tile.graphNodeList;
				nodeCount=nodeList.length;
				for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
					node=nodeList[nodeNum];
					lat=node.ll.llat;
					lon=node.ll.llon;

					if(node.id>areaNodeMinID || lat<llSW.llat || lat>llNE.llat || lon<llSW.llon || lon>llNE.llon) continue;

					if(lat<edgeS) lat=edgeS;
					if(lat>edgeN) lat=edgeN;
					if(lon<edgeW) lon=edgeW;
					if(lon>edgeE) lon=edgeE;

					lat=(lat+grain/2)&~mask;
					lon=(lon+grain/2)&~mask;

					key=lat+'\t'+lon;
					areaNode=nodeTbl[key];
					if(!areaNode) continue;

					node.connectTo(areaNode,node.ll.distTo(areaNode.ll));
					node.area=true;
				}
			}
		);

		for(lat=edgeS+grain;lat<=edgeN;lat+=grain) {
			lon=edgeW;
			key=lat+'\t'+lon;
			node=nodeTbl[key];

			key=(lat-grain)+'\t'+lon;
			nodeS=nodeTbl[key];

			key=(lat-grain)+'\t'+(lon+grain);
			nodeSE=nodeTbl[key];

			for(lon=edgeW+grain;lon<=edgeE;lon+=grain) {
				key=lat+'\t'+lon;
				nodeW=node;
				node=nodeTbl[key];

				key=(lat-grain)+'\t'+(lon+grain);
				nodeSW=nodeS;
				nodeS=nodeSE;
				nodeSE=nodeTbl[key];

				if(!node || node.area) continue;

				if(nodeS) node.connectTo(nodeW,node.ll.distTo(nodeW.ll));
				if(nodeSW) node.connectTo(nodeSW,node.ll.distTo(nodeSW.ll));
				if(nodeS) node.connectTo(nodeS,node.ll.distTo(nodeS.ll));
				if(nodeSE) node.connectTo(nodeSE,node.ll.distTo(nodeSE.ll));
				node.area=true;

//if(!node.boundNW && nodeNW) console.log('NW '+node.ll.distTo(nodeNW.ll));
//if(!node.boundN && nodeN) console.log('N '+node.ll.distTo(nodeN.ll));

//				node.boundW=true;
//				node.boundSW=true;
//				node.boundS=true;
//				node.boundSE=true;
/*
				node=new reach.road.Node(new reach.MU(lat,lon));
				node.followerCount=0;
				node.followerList=[];
				node.distList=[];

				nodeTbl[key]=node;
				this.graph.nodeList[nodeNum-1]=node;
				node.id=nodeNum++;
//node.followerList[node.followerCount]=next;
//node.distList[node.followerCount++]=dist;
*/
			}
		}
	}
};
goog.provide('reach.control.TaskDef');
goog.require('reach.task.Task');

// TODO: maybe these classes should be called reach.task.Def*

/** @typedef {{task:reach.task.Task,nextList:Array.<reach.task.Task>,result:reach.task.Result}} */
reach.control.TaskDef.Def;

/** @typedef {reach.control.TaskDef.Def|reach.control.TaskDef.DefGroup} */
reach.control.TaskDef.DefItem;

/** @typedef {Object.<string,reach.control.TaskDef.DefItem>} */
reach.control.TaskDef.DefGroup;
goog.provide('reach.task.Custom');
goog.require('reach.task.Task');

/** @constructor
  * @extends {reach.task.Task}
  * @param {string} name
  * @param {function(reach.task.Task):?function():number} init */
reach.task.Custom=function(name,init) {
	reach.task.Task.call(this,name);

	/** @type {function(reach.task.Task):?function():number} */
	this.onInit=init;
};

reach.inherit(reach.task.Custom,reach.task.Task);

reach.task.Custom.prototype.init=function() {
	var advance;

	advance=this.onInit(this);
	if(advance) this.advance=advance;
	else this.success();
};
goog.provide('reach.task.Trigger');
goog.require('reach.task.Task');

/** @constructor
  * @extends {reach.task.Task}
  * @param {string} name */
reach.task.Trigger=function(name) {
	reach.task.Task.call(this,name);
	/** @type {boolean} */
	this.done=false;
};

reach.inherit(reach.task.Trigger,reach.task.Task);

reach.task.Trigger.prototype.init=function() {
	if(this.done) this.success();
};
goog.provide('reach.control.ModelTasks');
goog.require('reach.control.TaskDef');
goog.require('reach.task.Fetch');
goog.require('reach.task.Image');
goog.require('reach.task.Custom');
goog.require('reach.task.Trigger');
goog.require('reach.data.Stream');
goog.require('reach.trans.City');
goog.require('reach.road.Net');
goog.require('reach.route.Conf');

/** @const */
reach.control.ModelTasks={
	assets:{
		markers:{}
	},
	transit:{
		fetch:{},
		open:{},
		stops:{
			parse:{},
			show:{},
			clean:{}
		},
		lines:{
			parse:{}
		},
		day:{
			change:{}
		},
		trips:{
			parse:{},
			sort:{}
		},
		deltas:{
			parse:{}
		},
		load:{}
	},
	road:{
		tree:{
			fetch:{},
			open:{},
			parse:/** @type {reach.control.TaskDef.Def} */ {},
			bindGraph:{},
			show:{}
		},
		refs:{
			parse:/** @type {reach.control.TaskDef.Def} */ {},
			show:{}
		},
		graph:{
			fetch:{},
			parse:{}
		}
	},
	preload:/** @type {reach.control.TaskDef.Def} */ {}
};

/** @param {reach.core.Opt} opt
  * @param {reach.map.OpenLayers} map
  * @param {reach.trans.City} city
  * @param {reach.road.Net} net
  * @param {reach.route.Conf} conf
  * @return {reach.control.TaskDef.DefGroup} */
reach.control.initTasks=function(opt,map,city,net,conf) {
	var tasks;
	var def=reach.control.defineTask;
	/** @type {reach.data.Stream} */
	var transitStream;
	/** @type {reach.data.Stream} */
	var treeStream;
	/** @type {reach.data.Stream} */
	var graphStream;

	/** @type {reach.control.TaskDef.DefGroup} */
	tasks=reach.control.ModelTasks;

	def(tasks.assets.markers,
		[],
		new reach.task.Image('Load markers','markers.png')
	);

	def(
		tasks.transit.fetch,
		[],
		new reach.task.Fetch('Fetch transit',opt.def.base+'/data/trans.txt',null)
	);

	def(
		tasks.transit.open,
		[tasks.transit.fetch],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Open transit',function(task) {
			var data;
			var tasks;
			var dec;

			/** @type {reach.control.TaskDef.DefGroup} */
			tasks=reach.control.ModelTasks;
			data=(/** @type {reach.task.FetchResult} */ (tasks.transit.fetch.result)).data;
			if(!data) return(null);

			transitStream=new reach.data.Stream(data);
			dec=transitStream.readLong(2);
			reach.util.assert(dec[0]==1,'control.initTasks','Incorrect data version '+dec[0]);
			reach.util.assert(dec[1]==transitStream.len-transitStream.pos,'control.initTasks','Incorrect data size '+dec[1]);
			return(null);
		})
	);

	def(
		tasks.transit.stops.parse,
		[tasks.transit.open],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Parse stops',function(task) {
			var dec;

			dec=transitStream.readLong(2);
			reach.util.assert(dec[1]==transitStream.verify(dec[0]),'control.initTasks','Corrupt stop data');
			return(city.parseStops(transitStream));
		})
	);

	def(
		tasks.transit.stops.show,
		[tasks.transit.stops.parse,tasks.transit.trips.sort,tasks.assets.markers],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Show stops',function(task) {
			var tasks;

			/** @type {reach.control.TaskDef.DefGroup} */
			tasks=reach.control.ModelTasks;

			map.stopLayer=new reach.map.StopLayer(map,'Stops',city,(/** @type {reach.task.ImageResult} */ (tasks.assets.markers.result)).img);
			map.stopLayer.layer.setZIndex(reach.map.Level.STOP);

			return(null);
		})
	);

	def(
		tasks.transit.lines.parse,
		[tasks.transit.stops.parse],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Parse lines',function(task) {
			var dec;

			dec=transitStream.readLong(2);
			reach.util.assert(dec[1]==transitStream.verify(dec[0]),'control.initTasks','Corrupt line data');
			return(city.parseLines(transitStream));
		})
	);

	def(
		tasks.transit.day.change,
		[tasks.transit.stops.parse],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Set day',function(task) {
			var d;
			var today;
			var dateParts;
			var dateSrc;
			var dayNum,delta;

			today=null;
			if(conf.dateText) {
				dateParts=conf.dateText.split('-');
				if(dateParts.length==3) today=reach.core.Date.fromYMD(+dateParts[0],+dateParts[1],+dateParts[2]);
				if(today) {
					dateSrc='Input';
				} else {
					task.showMessage(reach.task.Health.WARN,'Invalid date '+conf.dateText+'. Using today instead.');
				}
			}

			if(!today) {
				d=new Date();
				today=reach.core.Date.fromYMD(d.getFullYear(),d.getMonth()+1,d.getDate());
				dateSrc='Computer';
			}

			dayNum=today.jd-city.firstDate.jd;

			if(dayNum<0 || dayNum>=city.dayCount) {
				task.showMessage(reach.task.Health.WARN,'Input date '+today.format()+' is out of data range.');

				if(dayNum>=city.dayCount) {
					delta=dayNum-city.dayCount+7;
					dayNum-=delta-delta%7;
					if(dayNum<0) dayNum=0;
				}

				if(dayNum<0) {
					delta=-dayNum+6;
					dayNum+=delta-delta%7;
					if(dayNum>=city.dayCount) dayNum=city.dayCount-1;
				}

				today=new reach.core.Date(city.firstDate.jd+dayNum);
				dateSrc='New';
			}

			conf.date=today;

			task.showMessage(reach.task.Health.OK,dateSrc+' date '+today.format()+' is day '+(dayNum+1)+' of range '+city.firstDate.format()+' to '+new reach.core.Date(city.firstDate.jd+city.dayCount-1).format()+'.');

			return(null);
		})
	);

	def(
		tasks.transit.trips.parse,
		[tasks.transit.lines.parse,tasks.transit.day.change],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Parse trips',function(task) {
			var dec;

			dec=transitStream.readLong(2);
			reach.util.assert(dec[1]==transitStream.verify(dec[0]),'control.initTasks','Corrupt trip data');
			return(city.parseTrips(transitStream,conf.date.jd-city.firstDate.jd));
		})
	);

	def(
		tasks.transit.trips.sort,
		[tasks.transit.trips.parse],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Sort trips',function(task) {
			city.lineSet.sortTrips();
			city.stopSet.calcModes();

			return(null);
		})
	);

	def(
		tasks.transit.deltas.parse,
		[tasks.transit.trips.parse],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Parse deltas',function(task) {
			var dec;

			dec=transitStream.readLong(2);
			reach.util.assert(dec[1]==transitStream.verify(dec[0]),'control.initTasks','Corrupt delta data');
			return(city.parseDeltas(transitStream));
		})
	);

/*
	def(
		tasks.transit.trips.sort,
		[tasks.transit.deltas.parse],
		new reach.task.Custom('Sort trips',function(task) {
		})
	);
*/

	def(
		tasks.transit.load,
		[
			tasks.transit.stops.parse,
			tasks.transit.lines.parse,
			tasks.transit.trips.parse,
			tasks.transit.trips.sort,
			tasks.transit.deltas.parse
		],
		new reach.task.Trigger('Start')
	);

	def(
		tasks.road.tree.fetch,
		[],
		new reach.task.Fetch('Fetch roads',opt.def.base+'/data/ref.txt',null)
	);

	def(
		tasks.road.tree.open,
		[tasks.road.tree.fetch],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Open roads',function(task) {
			var tasks;
			var data;
			var dec;

			/** @type {reach.control.TaskDef.DefGroup} */
			tasks=reach.control.ModelTasks;
			data=(/** @type {reach.task.FetchResult} */ (tasks.road.tree.fetch.result)).data;
			if(!data) return(null);

			treeStream=new reach.data.Stream(data);
			dec=treeStream.readLong(2);
			reach.util.assert(dec[0]==1,'control.initTasks','Incorrect data version '+dec[0]);
			reach.util.assert(dec[1]==treeStream.len-treeStream.pos,'control.initTasks','Incorrect data size '+dec[1]);
			return(null);
		})
	);

	def(
		tasks.road.tree.parse,
		[tasks.road.tree.open],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Parse roads',function(task) {
			var dec;

			/** @param {reach.road.Tile} tile
			  * @param {reach.task.Task} task */
			function loadTile(tile,task) {
				return(new reach.task.Fetch('Fetch tile',opt.def.base+'/tiles/'+tile.path+'.txt',null));
			}

			dec=treeStream.readLong(2);
			reach.util.assert(dec[1]==treeStream.verify(dec[0]),'control.initTasks','Corrupt road data');
			return(net.initTree(treeStream,loadTile));
		})
	);

	def(
		tasks.road.tree.bindGraph,
		[tasks.road.tree.parse,tasks.road.graph.parse],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Bind graph',function(task) {
			return(net.bindGraph(task));
		})
	);

	def(
		tasks.road.tree.show,
		[tasks.road.tree.parse],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Show tiles',function(task) {
			map.quadLayer=new reach.map.QuadLayer(map,'Tiles',net.tree);
			map.quadLayer.layer.setZIndex(reach.map.Level.QUAD);

			return(null);
		})
	);

	def(
		tasks.road.refs.parse,
		[tasks.road.tree.parse,tasks.transit.stops.parse,tasks.road.tree.bindGraph],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Parse refs',function(task) {
			// Parse connections from stops to road network. These can change when stop data is updated, without needing
			// to alter road network data (cached on user's end).
			var dec;

			dec=treeStream.readLong(2);
			reach.util.assert(dec[1]==treeStream.verify(dec[0]),'control.initTasks','Corrupt ref data');
// For testing what happens if all tiles are loaded at the same time.
//net.tree.forEach(function(tile) {if(tile.isLeaf) {console.log(tile.path);tile.load(task,null,function() {console.log(tile.path+' done');});}});
//return(null);
			return(net.parseRefs(treeStream));
//			return(net.initTree(treeStream));
//			return(null);
		})
	);

	def(
		tasks.road.refs.show,
		[tasks.road.refs.parse,tasks.road.tree.parse],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Show refs',function(task) {
			map.roadLayer=new reach.map.RoadLayer(map,'Roads',task,net.tree,'tiles');
			map.roadLayer.layer.setZIndex(reach.map.Level.ROAD);

			return(null);
		})
	);

	def(
		tasks.road.graph.fetch,
		[],
		new reach.task.Fetch('Fetch graph',opt.def.base+'/data/map2.txt',null)
	);

	def(
		tasks.road.graph.parse,
		// tree.parse could be added in dependencies so graph nodes could be inserted into the same tree.
//		[tasks.road.graph.fetch,tasks.transit.stops.parse,tasks.road.tree.parse],
		[tasks.road.graph.fetch,tasks.transit.stops.parse],
		/** @param {reach.task.Task} task */
		new reach.task.Custom('Parse graph',function(task) {
			var tasks;
			var data;
			var dec;

			/** @type {reach.control.TaskDef.DefGroup} */
			tasks=reach.control.ModelTasks;
			data=(/** @type {reach.task.FetchResult} */ (tasks.road.graph.fetch.result)).data;
			if(!data) return(null);

			graphStream=new reach.data.Stream(data);
//			dec=graphStream.readLong(2);
//			reach.util.assert(dec[0]==1,'control.initTasks','Incorrect data version '+dec[0]);
//			reach.util.assert(dec[1]==transitStream.len-transitStream.pos,'control.initTasks','Incorrect data size '+dec[1]);
//			return(null);


//			var dec;

//			dec=graphStream.readLong(2);
//			reach.util.assert(dec[1]==stream.verify(dec[0]),'control.initTasks','Corrupt data');
			return(net.parseGraph(graphStream));
		})
	);

	def(
		tasks.preload,
		[
			tasks.transit.load,
			tasks.road.refs.parse,
			tasks.road.graph.parse
		],
		new reach.task.Trigger('Preload')
	);

	return(tasks);
};

/** @param {reach.control.TaskDef.Def|Object} def
  * @param {Array.<reach.control.TaskDef.Def|Object>} deps
  * @param {reach.task.Task} task */
reach.control.defineTask=function(def,deps,task) {
	var depNum,depCount;
	var dep;
	var nextList;

	depCount=deps.length;
	for(depNum=0;depNum<depCount;depNum++) {
		dep=/** @type {reach.control.TaskDef.Def} */ (deps[depNum]);

		if(dep.task) {
			task.addDep(dep.task);
		} else {
			nextList=dep.nextList;
			if(!nextList) {
				nextList=[];
				dep.nextList=nextList;
			}

			nextList.push(task);
		}
	}

	def=/** @type {reach.control.TaskDef.Def} */ def;
	def.task=task;
	def.result=task.result;

	if(def.nextList) {
		depCount=def.nextList.length;
		for(depNum=0;depNum<depCount;depNum++) {
			def.nextList[depNum].addDep(task);
		}

//		task.nextList=def.nextList;
	}
};
goog.provide('reach.loc.Location');
goog.require('reach.Obj');
goog.require('reach.MU');

/** @constructor */
reach.loc.Location=function() {
	/** @type {reach.MU} */
	this.ll;
	/** @type {string} */
	this.id='';
	/** @type {number} */
	this.runId=0;
	/** @type {number} */
	this.cost=0;
	/** @type {number} */
	this.time=0;
	/** @type {reach.loc.InputSet} */
	this.inputSet;
	/** @type {Array.<string>} */
	this.fieldList;
};
goog.provide('reach.route.result.Leg');
goog.require('reach.Obj');

/** @constructor */
reach.route.result.Leg=function() {
	/** @type {number} */
//	this.startTime=0;
	/** @type {number} Cost of this route leg. */
	this.cost=1;
	/** @type {number} Duration in time units. */
	this.duration=0;
	/** @type {number} Distance in meters. */
	this.dist=0;
	/** @type {boolean} */
//	this.invert=false;
	/** @type {reach.route.result.Leg.Type} */
	this.type;
};

/** Mode of travel.
  * @enum {number} */
reach.route.result.Leg.Type={
	NONE:0,
    WALK:1,
    TRANS:2,
	EXTRA:3
};

/** @enum {boolean} */
reach.route.result.Leg.Dir={
	FORWARD:true,
	BACKWARD:false
};

/** @param {reach.route.result.Leg} leg
  * @return {reach.route.result.Leg} */
/*
reach.route.result.Leg.prototype.copy=function(leg) {
	if(!leg) leg=new reach.route.result.Leg();

    leg.startTime=this.startTime;
	leg.cost=this.cost;
	leg.duration=this.duration;
	leg.dist=this.dist;
	leg.type=this.type;

    return(leg);
};
*/

reach.route.result.Leg.prototype.dir=reach.route.result.Leg.Dir.FORWARD;

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @param {Array.<reach.MU>} prev
  * @return {Array.<reach.MU>} */
reach.route.result.Leg.prototype.getPoints=function(conf,dir,prev) {
	return([]);
};

/*
reach.route.result.Leg.prototype.reverse=function() {
	this.invert=!this.invert;
};
*/
goog.provide('reach.route.result.WalkLeg');
goog.require('reach.route.result.Leg');
goog.require('reach.util');

/** @constructor
  * @extends {reach.route.result.Leg} */
reach.route.result.WalkLeg=function() {
	reach.route.result.Leg.call(this);

	// Array.<{way:reach.road.Way,pos:Array.<number>}>
	/** @type {Array.<number>} */
	this.posList=[];
	/** @type {Array.<reach.road.Way>} */
	this.wayList=[];
	/** @type {Array.<number>} */
	this.distList=[];

	/** @type {reach.road.Node} */
	this.startNode=null;
	/** @type {reach.loc.Outdoor} */
	this.endLoc=null;

	this.type=reach.route.result.Leg.Type.WALK;
};

reach.inherit(reach.route.result.WalkLeg,reach.route.result.Leg);

/** @param {reach.route.result.WalkLeg} leg
  * @return {reach.route.result.WalkLeg} */
/*
reach.route.result.WalkLeg.prototype.copy=function(leg) {
	if(!leg) leg=new reach.route.result.WalkLeg();
	reach.route.result.Leg.prototype.copy.call(this);

	leg.posList=this.posList;
	leg.wayList=this.wayList;
	leg.distList=this.distList;
	leg.startNode=this.startNode;
	leg.endLoc=this.endLoc;

	return(leg);
};
*/

/** @param {number} pos1
  * @param {reach.road.Way} way
  * @param {number} pos2
  * @param {number} dist */
reach.route.result.WalkLeg.prototype.insert=function(pos1,way,pos2,dist) {
	this.posList.push(pos1);
	this.wayList.push(way);
	this.posList.push(pos2);
	this.distList.push(dist);
	this.dist+=dist;
};

/*
reach.route.result.WalkLeg.prototype.check=function() {
	var posList;
	var wayList;
	var node,wayNode,wayNode2;
	var i,l;

	posList=this.posList;
	wayList=this.wayList;

	node=this.startNode;
	wayNode=wayList[0].nodeList[posList[0]];
	reach.util.assert(node==wayNode,'WalkLeg.check','Start node '+node.ll.pretty()+' != route first node '+wayNode.ll.pretty()+'.');

	node=this.endNode;
	wayNode=wayList[wayList.length-1].nodeList[posList[posList.length-1]];
	reach.util.assert(node==wayNode,'WalkLeg.check','end node '+node.ll.pretty()+' != route last node '+wayNode.ll.pretty()+'.');

	l=wayList.length-1;
	for(i=0;i<l;i++) {
		wayNode=wayList[i].nodeList[posList[i*2+1]];
		wayNode2=wayList[i+1].nodeList[posList[i*2+2]];
		reach.util.assert(wayNode==wayNode2,'WalkLeg.check','way node '+wayNode.ll.pretty()+' != way node '+wayNode2.ll.pretty()+'.');
	}
};
*/

/*
reach.route.result.WalkLeg.prototype.shrink=function() {
	var wayList;
	var wayNum,wayCount;
	var way;

	wayList=this.wayList;
	wayCount=wayList.length-1;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		way.costList=null;
		way.timeList=null;
		way.srcPosList=null;
		way.srcWayList=null;
	}
};
*/

/*
reach.route.result.WalkLeg.prototype.debug=function(conf) {
	var out;
	var wayNum,wayCount;
	var way;
	var nodeList;
	var pos,lastPos,delta;
	var deg;

	out=[];
	wayCount=this.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];
		nodeList=way.nodeList;
		pos=this.posList[wayNum*2];
		lastPos=this.posList[wayNum*2+1];
		if(pos<lastPos) delta=1;
		else delta=-1;
		while(1) {
			deg=nodeList[pos].ll.toDeg();
			out.push(deg.llon+','+deg.llat+',2');
			if(pos==lastPos) break;
			pos+=delta;
		}
	}

	return(out);
};
*/

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @param {Array.<reach.MU>} prev
  * @return {Array.<reach.MU>} */
reach.route.result.WalkLeg.prototype.getPoints=function(conf,dir,prev) {
	var out;
	var wayNum,wayCount;
	var way;
	var pointNumList;
	var pointList;
	var pos,lastPos,delta;

//	out=prev;
//	if(!out) out=/** @type {Array.<reach.MU>} */ [];
	out=/** @type {Array.<reach.MU>} */ [];

	wayCount=this.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.wayList[wayNum];
		pointNumList=way.pointNumList;
		pointList=way.pointList;

		pos=this.posList[wayNum*2];
		lastPos=this.posList[wayNum*2+1];
		delta=pos<lastPos?1:-1;

		if(pointNumList) {
			while(1) {
				out.push(pointList[pointNumList[pos]].ll);
				if(pos==lastPos) break;
				pos+=delta;
			}
		}
	}

	if(dir==reach.route.result.Leg.Dir.BACKWARD) out.reverse();
	if(prev) {
		prev.push.apply(prev,out);
		out=prev;
	}

	return(out);
};
goog.provide('reach.route.result.LegRef');
goog.require('reach.route.result.Leg');

/** @constructor
  * @param {reach.route.result.Leg} leg
  * @param {reach.route.result.Leg.Dir} dir */
reach.route.result.LegRef=function(leg,dir) {
	/** @type {reach.route.result.Leg} */
	this.leg=leg;
	/** @type {reach.route.result.Leg.Dir} */
	this.dir=dir;
	/** @type {number} */
	this.startTime=0;
};

/** @return {reach.route.result.LegRef} */
reach.route.result.LegRef.prototype.copy=function() {
	var ref;

	ref=new reach.route.result.LegRef(this.leg,this.dir);
	ref.startTime=this.startTime;

	return(ref);
};
goog.provide('reach.loc.Outdoor');
goog.require('reach.Obj');
goog.require('reach.loc.Location');
goog.require('reach.route.result.WalkLeg');
goog.require('reach.route.result.LegRef');

/** @constructor
  * @extends {reach.loc.Location}
  * @param {reach.MU} ll */
reach.loc.Outdoor=function(ll) {
	reach.loc.Location.call(this);
	this.ll=ll;

	/** @type {number} */
	this.lineNum;
	/** @type {Array.<Array.<reach.route.result.LegRef>>} Walking routes to nearby stops or input points. */
	this.walkList=[];
	/** @type {reach.road.Node} */
	this.node=null;
	/** @type {number} How many nearby stops have been found. */
	this.stopCount=0;
	/** @type {reach.route.result.WalkLeg} */
	this.srcLeg=null;
	/** @type {reach.route.result.LegRef} */
//	this.directWalk;
	/** @type {boolean} */
//	this.ready=false;
};

reach.inherit(reach.loc.Outdoor,reach.loc.Location);

/** @enum {number} */
reach.loc.Outdoor.Type={
    GRAPH:0,
    SRC:1,
    DST:2,
    EXTRA:3
};

/** @param {reach.route.result.WalkLeg} leg
  * @param {reach.loc.Outdoor.Type} mode
  * @param {reach.route.result.Leg.Dir} dir */
reach.loc.Outdoor.prototype.addWalk=function(leg,mode,dir) {
	var lst;

	lst=this.walkList[mode];
	if(!lst) {
		lst=/** @type {Array.<reach.route.result.LegRef>} */[];
		this.walkList[mode]=lst;
	}

	lst.push(new reach.route.result.LegRef(leg,dir));
};
goog.provide('reach.loc.InputSet');
goog.require('reach.Obj');
goog.require('reach.loc.Outdoor');

/** @constructor
  * @param {reach.road.Net} net
  * @param {reach.loc.InputSet.Type} mode */
reach.loc.InputSet=function(net,mode) {
	/** @type {reach.road.Net} */
	this.net=net;

	/** @type {Array.<reach.loc.Location>} */
	this.list=[];
	/** @type {Array.<string>} */
	this.fieldList=[];

	/** @type {number} */
	this.count=0;

	/** @type {boolean} */
	this.onlyStops=false;

	/** @type {reach.loc.InputSet.Type} */
	this.mode=mode;

	/** @type {string} */
	this.path;
};

/** @enum {number} */
reach.loc.InputSet.Type={
	STOP:0,
	SRC:1,
	DST:2,
	EXTRA:3
};

/** @param {string} data
  * @param {Proj4js.Proj} srcProj
  * @param {Proj4js.Proj} dstProj
  * @param {string} path
  * @return {function():number} */
reach.loc.InputSet.prototype.importList=function(data,srcProj,dstProj,path) {
	/** @type {reach.loc.InputSet} */
	var self=this;
	var step;
	/** @type {Array.<string>} */
	var lineList;
	/** @type {number} */
	var lineNum;
	var lineCount;
	var line;
	var fieldList;
	var ll;
	var loc;
	var tile;
	var warnCount;
	var projPt;

	/** @enum {number} */
	var steps={
		init:0,
		read:1
	};

	var advance=function() {
		switch(step) {
			// Initialize.
			case steps.init:
				self.path=path;
				lineList=data.split(/[\n\r]+/);
				lineCount=lineList.length;
				lineNum=0;

				step=steps.read;

			case steps.read:
				line=lineList[lineNum++];
				if(line.length==0) break;

				fieldList=line.split(';');
				if(!fieldList[fieldList.length-1]) fieldList.pop();
				if(fieldList.length<3) break;
				if(fieldList[0].match(/^[ \t]*#/) || fieldList[1].match(/[^-.0-9]/) || fieldList[2].match(/[^-.0-9]/)) {
					if(lineNum-1==0) self.fieldList=fieldList;
					break;
				}
				projPt=Proj4js.transform(srcProj,dstProj,new Proj4js.Point(+fieldList[1],+fieldList[2]));
//				console.log(projPt.x+' '+projPt.y);

				ll=new reach.Deg(projPt.y,projPt.x).toMU();
				// Just check that tile is available, don't load it yet.
				tile=self.net.tree.findTile(ll,0);
				if(tile.isLeaf) {
					loc=new reach.loc.Outdoor(ll);
//					loc.inputSet=self;
					loc.fieldList=fieldList;
					loc.id=fieldList[0];
					loc.lineNum=lineNum;
					self.insertLocation(loc);
				} else {
					console.log('Point is out of data bounds:');
					console.log(fieldList.join(';'));
//					warn(path+' line '+lineNum+' has point ('+ll.toDeg().format()+') out of data bounds:');
				}

				break;
		}

		return(lineCount-lineNum);
	};

	step=steps.init;
	return(advance);
};

reach.loc.InputSet.prototype.clear=function() {
	var locNum;
	var pt;
	var loc;
	var walkList;
	var locWalkNum,nodeWalkNum;
	var leg;
	var node;

	locNum=this.list.length;
	while(locNum--) {
		pt=this.list[locNum];
		// TODO: test that pt is of type outdoor.
		loc=/** @type {reach.loc.Outdoor} */ pt;

		walkList=loc.walkList[reach.loc.Outdoor.Type.GRAPH];
		if(!walkList) continue;
		locWalkNum=walkList.length;
		while(locWalkNum--) {
			leg=/** @type {reach.route.result.WalkLeg} */ (walkList[locWalkNum].leg);
			node=leg.startNode;
			nodeWalkNum=node.walkList.length;
			while(nodeWalkNum--) {
				if(node.walkList[nodeWalkNum].leg==leg) {
					node.walkList.splice(nodeWalkNum,1);
//					console.log('YAY');
					break;
				}
			}
		}
	}

	this.list=[];
	this.count=0;
};

/** @param {reach.loc.Location} loc */
reach.loc.InputSet.prototype.insertLocation=function(loc) {
	this.list[this.count++]=loc;
	loc.inputSet=this;
};
goog.provide('reach.data.SplayTreeItem');

/** @constructor
  * @param {*} key
  * @param {reach.data.SplayTreeItem} prev
  * @param {reach.data.SplayTreeItem} next */
reach.data.SplayTreeItem=function(key,prev,next) {
	/** @type {reach.data.SplayTreeItem} */
	this.parent=null;
	/** @type {reach.data.SplayTreeItem} */
	this.left=null;
	/** @type {reach.data.SplayTreeItem} */
	this.right=null;

	/** @type {reach.data.SplayTreeItem} */
	this.prev=prev;
	/** @type {reach.data.SplayTreeItem} */
	this.next=next;

	if(prev) prev.next=this;
	if(next) next.prev=this;

	/** @type {*} */
	this.key=key;
	/** @type {*} */
	this.data;
};

reach.data.SplayTreeItem.prototype.rotateLeft=function() {
	var node=this;
	var newparent;

	newparent=node.right;

	node.right=newparent.left;
	if(node.right) node.right.parent=node;
	newparent.left=node;

	if(node.parent) {
		if(node.parent.left==node) node.parent.left=newparent;
        else node.parent.right=newparent;
    }

    newparent.parent=node.parent;
    node.parent=newparent;
};

reach.data.SplayTreeItem.prototype.rotateRight=function() {
	var node=this;
	var newparent;

	newparent=node.left;

	node.left=newparent.right;
	if(node.left) node.left.parent=node;
	newparent.right=node;

	if(node.parent) {
		if(node.parent.left==node) node.parent.left=newparent;
        else node.parent.right=newparent;
    }

	newparent.parent=node.parent;
	node.parent=newparent;
};

/** @return {reach.data.SplayTreeItem} */
reach.data.SplayTreeItem.prototype.splay=function() {
	var node=this;
	var grand,parent;

	while(node.parent) {
		parent=node.parent;
		grand=parent.parent;

		if(!grand) {
			if(node==parent.left) parent.rotateRight();
			else parent.rotateLeft();
			return(this);
        }

		if(node==parent.left) {
			if(parent==grand.left) {
				grand.rotateRight();
				parent.rotateRight();
			} else {
				parent.rotateRight();
				grand.rotateLeft();
			}
		} else {
			if(parent==grand.left) {
				parent.rotateLeft();
				grand.rotateRight();
			} else {
				grand.rotateLeft();
				parent.rotateLeft();
			}
		}
	}

	return(this);
};
goog.provide('reach.data.SplayTree');
goog.require('reach.data.SplayTreeItem');

/** @constructor
  * @param {function(*,*):number} compare
  * @param {boolean} combineDupes */
reach.data.SplayTree=function(compare,combineDupes) {
	/** @type {reach.data.SplayTreeItem} */
	this.root=null;
	/** @type {reach.data.SplayTreeItem} */
	this.first=null;
	/** @type {function(*,*):number} */
	this.compare=compare;
	/** @type {boolean} */
	this.combineDupes=combineDupes;
};

/** @param {*} key
  * @return {reach.data.SplayTreeItem} */
reach.data.SplayTree.prototype.insert=function(key) {
	var tree=this;
	var node,newNode;
	var d;

	if(!tree.root) {
		newNode=new reach.data.SplayTreeItem(key,null,null);
		tree.root=newNode;
		tree.first=newNode;
		return(newNode);
	}

	node=tree.root;

	while(1) {
		d=tree.compare(key,node.key);

		if(d==0 && tree.combineDupes) return(node);

		if(d<0) {
			if(!node.left) {
				newNode=new reach.data.SplayTreeItem(key,node.prev,node);
				if(!newNode.prev) this.first=newNode;
				node.left=newNode;
				break;
			}
			node=node.left;
		} else {
			if(!node.right) {
				newNode=new reach.data.SplayTreeItem(key,node,node.next);
				node.right=newNode;
				break;
			}
			node=node.right;
		}
	}

	newNode.parent=node;
	tree.root=newNode.splay();

	return(newNode);
};

/** @param {reach.data.SplayTreeItem} node */
reach.data.SplayTree.prototype.remove=function(node) {
	var tree=this;
	var successor,replacement,parent;
	var tmp;

	parent=node.parent;
	successor=node.next;
    
	if(node.left && node.right) {
		// successor will take the place of node, replacement will take the place of successor. successor can't have a left child.
		replacement=successor.right;

		// Connect successor's parent (which can be node) with replacement.
		if(successor.parent.left==successor) successor.parent.left=replacement;
		else successor.parent.right=replacement;
		if(replacement) replacement.parent=successor.parent;

		// Move node's left subtree under successor.
		successor.left=node.left;
		successor.left.parent=successor;

		// Move node's right subtree under successor.
		successor.right=node.right;
		// Right child can be null if successor is node's right child and replacement is null.
		if(successor.right) successor.right.parent=successor;

		replacement=successor;
	} else {
		replacement=node.left;
		if(!replacement) replacement=node.right;
	}

	// Connect node's parent with replacement.
	if(!parent) tree.root=replacement;
	else if(parent.left==node) parent.left=replacement;
	else parent.right=replacement;
	if(replacement) replacement.parent=parent;

	if(successor) successor.prev=node.prev;
	if(node.prev) node.prev.next=successor;
	else this.first=successor;

	if(parent) tree.root=parent.splay();
};
// Sweep line style algorithm for connecting walkable points with only a slice of the road graph in memory at a time.
// Slice is only 2*maxWalk meters plus tile size in north-south direction, covers whole graph in east-west direction.

goog.provide('reach.loc.EventSet');
goog.require('reach.loc.InputSet');
goog.require('reach.loc.Outdoor');
goog.require('reach.data.SplayTree');

/** @constructor
  * @param {number} maxWalk */
reach.loc.EventSet=function(maxWalk) {
	/** @type {Array.<reach.loc.InputSet>} */
	this.setList=[];

	/** @type {number} */
	this.maxWalk=maxWalk;
	/** @type {reach.data.SplayTree} */
	this.tree=new reach.data.SplayTree(this.comparePoints,true);
	/** @type {number} */
	this.count=0;
};

/** @enum {number} */
reach.loc.EventSet.Type={
	BIND:0,	// Connect a point to the road graph.
	WALK:1,	// Walk in all directions in road graph to find other points.
	FREE:2	// Free unnecessary road graph tile.
};

reach.loc.EventSet.prototype.clear=function() {
	this.setList=[];
	this.tree=new reach.data.SplayTree(this.comparePoints,true);
	this.count=0;
};

/** @param {*} a
  * @param {*} b
  * @return {number} */
reach.loc.EventSet.prototype.comparePoints=function(a,b) {
	var d;

	a=/** @type {reach.MU} */ a;
	b=/** @type {reach.MU} */ b;

	d=a.llat-b.llat;
	if(d) return(d);
	return(a.llon-b.llon);
};

/** @param {reach.MU} ll
  * @param {reach.loc.EventSet.Type} mode
  * @param {reach.loc.Outdoor} pt
  * @param {reach.road.Tile} tile Tile to be freed. */
reach.loc.EventSet.prototype.insert=function(ll,mode,pt,tile) {
	var leaf;
	var data;

	leaf=this.tree.insert(ll);
	data=/** @type {Array.<{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}>} */ (leaf.data);
	if(!data) {
		data=/** @type {Array.<{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}>} */ [];
		leaf.data=data;
	}
	data.push({type:mode,pt:pt,tile:tile});
	this.count++;
};

/** @param {reach.loc.InputSet} inputSet */
reach.loc.EventSet.prototype.importSet=function(inputSet) {
	var maxWalk;
	var ptList;
	var ptNum,ptCount;
	var pt;
	var loc;

	maxWalk=this.maxWalk;
	ptList=inputSet.list;
	ptCount=ptList.length;
	this.setList.push(inputSet);

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];
		// TODO: test that pt is of type outdoor.
		loc=/** @type {reach.loc.Outdoor} */ pt;

		// When reaching the point, walk in all directions to look for points in other input sets.
		this.insert(loc.ll,reach.loc.EventSet.Type.WALK,loc,null);
		// When point is max walking distance ahead, bind it to the road graph so it can be found by walking from other points.
		this.insert(loc.ll.offset(-maxWalk,0),reach.loc.EventSet.Type.BIND,loc,null);
//console.log('count '+this.count);
	}
};

/** @return {?{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}} */
reach.loc.EventSet.prototype.getNext=function() {
	var leaf;
	var data;
	var event;

	if(!this.count) return(null);
	this.count--;

	leaf=this.tree.first;
	data=/** @type {Array.<{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}>} */ (leaf.data);
	event=/** @type {{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}} */ data.pop();
	if(!data.length) this.tree.remove(leaf);

	return(event);
};
goog.provide('reach.data.List');
goog.require('reach.data.Link');

/** @constructor */
reach.data.List=function() {
	/** @type {reach.data.Link} */
	this.first=null;
};

/** @param {*} item
  * @return {reach.data.Link} */
reach.data.List.prototype.insert=function(item) {
	var link,next;

	link=new reach.data.Link(item);
	next=this.first;
	if(next) next.prev=link;

	link.next=next;
	this.first=link;

	return(link);
};

/** @param {reach.data.Link} link */
reach.data.List.prototype.remove=function(link) {
	if(this.first==link) this.first=link.next;

	if(link.prev) link.prev.next=link.next;
	if(link.next) link.next.prev=link.prev;
};
goog.provide('reach.control.Dispatch');
goog.require('reach.task.Task');
goog.require('reach.data.List');

/** @constructor */
reach.control.Dispatch=function() {
	/** @type {number} Number of running tasks. */
	this.runCount=0;
	/** @type {number} Number of tasks waiting for dependencies. */
	this.waitCount=0;
	/** @type {number} Number of tasks blocked waiting for IO. */
	this.blockCount=0;
	/** @type {number} Number of tasks queued for unblocking. */
	this.unblockCount=0;

	/** @type {reach.data.List} Linked list of tasks doing background processing. Tasks are frequently added and removed. */
	this.runList=new reach.data.List();

	/** @type {?number} ID of timer for deactivating it. */
	this.timerId=null;
	/** @type {boolean} Flag set if calculation is running during a timer firing. */
	this.advancing=false;
	/** @type {number} How many timer firings with nothing to do, until timer gets deactivated. */
	this.idleMax=5;
	/** @type {number} Consecutive timer firing count with no tasks calculating. */
	this.idleNum=0;
	/** @type {number} Timer firing interval in milliseconds. */
	this.interval=200;

	/** @type {reach.data.Link} */
	this.latestLink=null;

	/** @type {number} Total time for calculations in milliseconds per timer firing. */
	this.quotaTotal=200;
	/** @type {number} Unused calculation time during previous timer firing. */
	this.quotaFree=this.quotaTotal;

	/** @type {number} */
	this.maxTaskId=1;
	/** @type {Array.<reach.task.Task>} */
	this.taskList=[];
	/** @type {Array.<reach.task.Task>} */
	this.unblockList=[];
};

/** @param {reach.control.TaskDef.Def|Object} def */
reach.control.Dispatch.prototype.run=function(def) {
	def=/** @type {reach.control.TaskDef.Def} */ def;
	this.runTask(def.task);
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.runTask=function(task) {
	var depNum,depCount;
	var dep;
	var depWaitCount;

	// Note that tasks marked as done can't be restarted here, because this function may get called several times when dependencies finish.
	if(task.state!=reach.task.State.NONE && task.state!=reach.task.State.WAIT) return;
	if(!task.dispatch) {
		task.dispatch=this;
		task.id=this.maxTaskId++;
		this.taskList[task.id]=task;
	}
	task.preInit();
	// Task can finish before it even gets run, if its init function calls finishTask through its success method.
	if(task.state!=reach.task.State.NONE && task.state!=reach.task.State.WAIT) return;
	if(task.state==reach.task.State.WAIT) this.waitCount--;

	// Task is not yet running and other tasks finishing shouldn't alter its state.
	task.state=reach.task.State.FUZZY;

	// Check if the task's dependencies have finished running and start them if necessary.
	// Effectively this is a topological sort of the dependency graph.
	depWaitCount=0;
	depCount=task.depList.length;
	for(depNum=0;depNum<depCount;depNum++) {
		dep=task.depList[depNum];
		if(!dep.dispatch) {
			dep.dispatch=this;
			dep.id=this.maxTaskId++;
			this.taskList[dep.id]=dep;
		}
		if(dep.state!=reach.task.State.DONE) {
			// A dependency is not done yet. If it's never been run, run it now.
			if(dep.state==reach.task.State.NONE) this.runTask(dep);
			// After scheduling dep to run, it might already have been marked finished by its init function.
			if(dep.state!=reach.task.State.DONE) {
				// Will have to wait for dep to finish first, so tell it to run this task when done.
				depWaitCount++;
				dep.addNextOnce(task);
			}
		}
	}

//	console.log(task.name+(depWaitCount?' waiting.':' running.'));

	if(depWaitCount==0) {
		task.runPtr=this.runList.insert(task);
		task.state=reach.task.State.RUN;
		this.runCount++;
		// Tell the task that its dependencies are ready.
		task.init();

		if(task.state==reach.task.State.RUN) this.advance();
	} else {
		task.state=reach.task.State.WAIT;
		this.waitCount++;
	}
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.runFollowers=function(task) {
	var next;

	for(var nextNum in task.nextTbl) {
		next=this.taskList[nextNum];
//console.log(task.name+' ('+task.id+')'+' -> '+next.name+' ('+next.id+') '+nextNum);
		this.runTask(next);
	}

	task.nextTbl={};
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.finishTask=function(task) {
	var memUsed;

	if(task.state==reach.task.State.DONE) return;
//	if(task.onSuccess) task.onSuccess();
	task.endTime=new Date().getTime();

	if(task.runTime>200) {
		if(typeof(window)!='undefined' && window.gc) {
			window.gc();
		} else if(typeof(global)!='undefined' && global.gc) {
			global.gc();
		}
	}

	if(task.runTime>200 && task.name!='') {
		memUsed=0;

		if(typeof(window)!='undefined' && window.performance && window.performance.memory) memUsed=window.performance.memory.usedJSHeapSize;
		if(typeof(process)!='undefined' && process.memoryUsage) memUsed=process.memoryUsage()['heapUsed'];

		console.log('Task '+task.name+' done, run time '+task.runTime+', heap now '+~~(memUsed/1024/1024+0.5)+' megs.');
	}

	if(task.state==reach.task.State.BLOCK) this.blockCount--;
	if(task.state==reach.task.State.WAIT) this.waitCount--;
	if(task.state==reach.task.State.RUN) this.runCount--;
	if(task.runPtr) {
		this.runList.remove(task.runPtr);
		task.runPtr=null;
	}
	task.state=reach.task.State.DONE;

//	console.log(task.name+' done.');
	this.runFollowers(task);

//	if(this.progress) this.progress.showFinish(task);
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.blockTask=function(task) {
	if(task.state==reach.task.State.BLOCK) return;
	if(task.state==reach.task.State.WAIT) this.waitCount--;
	if(task.state==reach.task.State.RUN) this.runCount--;
	if(task.runPtr) {
		this.runList.remove(task.runPtr);
		task.runPtr=null;
	}
	task.state=reach.task.State.BLOCK;
	this.blockCount++;

//	console.log(task.name+' blocked.');
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.unblockTask=function(task) {
	this.unblockList[this.unblockCount++]=task;
	// This will return if advance is already running, and so task will be unblocked on next tick.
	// Tick timer will be restarted if necessary.
	this.advance();
};

/** @param {reach.task.Task} task */
reach.control.Dispatch.prototype.reallyUnblockTask=function(task) {
	// The same task can be queued for unblocking several times so this counter should decrease also for already unblocked tasks.
	this.unblockCount--;
	if(task.state!=reach.task.State.BLOCK) return;
	this.blockCount--;

	task.runPtr=this.runList.insert(task);
	task.state=reach.task.State.RUN;
	this.runCount++;
	this.advance();
};

reach.control.Dispatch.prototype.tick=function() {
//	console.log('tick');
	if(this.runCount>0 || this.unblockCount>0) {
		this.quotaFree=this.quotaTotal;
		// There are tasks running so let them continue processing.
		this.advance();
	} else {
		this.idleNum++;
		if(this.idleNum>=this.idleMax || this.runCount+this.waitCount+this.blockCount==0) {
			// If there are no pollable tasks for a while or active tasks of any kind, stop timer.
			clearInterval(this.timerId);
			this.timerId=null;
		}
	}
};

// Called every <interval> milliseconds and spends <quota> milliseconds advancing the first active task that needs polling.
reach.control.Dispatch.prototype.advance=function() {
	/** @type {reach.control.Dispatch} */
	var self=this;
	var link;
	var task;
	var startTime,time,taskStartTime;
	var stepsRemaining;
	var pollNum,pollCount;
	var fraction;
	var quota;

	// Avoid recursive calls to advance (when a task pauses regularly waiting for another). Otherwise stack runs out.
	if(this.advancing) return;
	this.advancing=true;

	// Handle all tasks queued for unblocking.
	// The loop variable is updated inside the function call.
	while(this.unblockCount) this.reallyUnblockTask(this.unblockList[this.unblockCount-1]);
	this.unblockList=[];

//	console.log('Event loop start.');
	quota=this.quotaFree;

	startTime=new Date().getTime();
	time=startTime;

	link=this.latestLink;
	// Get first running task.
	if(!link || (/** @type {reach.task.Task} */ link.item).state!=reach.task.State.RUN) link=this.runList.first;
	while(time<startTime+quota) {
		if(!link) {
			link=this.runList.first;
			if(!link) break;
		}

		task=/** @type {reach.task.Task} */ link.item;
		reach.util.assert(task.state==reach.task.State.RUN,'Dispatch.advance','Incorrect task state '+task.state);

		// Get next task now in case current task list item gets removed if the task terminates.
		link=link.next;

		stepsRemaining=1;
		pollCount=task.pollCount;

//		TODO: uncomment try/catch block.
//		try {
			// Repeat until task is done or quota is used.
			while(stepsRemaining>0 && time<startTime+quota) {
				taskStartTime=time;
				pollNum=pollCount;
				// Advance task <pollCount> steps.
				while(stepsRemaining>0 && pollNum--) stepsRemaining=task.advance();

				time=new Date().getTime();

				// If less than 1/16th of time quota was used, double <pollCount> to do more steps before next quota check.
				// Otherwise halve <pollCount>.
				if(time-taskStartTime<quota/16) pollCount*=2;
				else if(pollCount>1) pollCount/=2;
				task.runTime+=time-taskStartTime;
			}
//		} catch(e) {
//			this.blockTask(task);
//			console.log(e);
//		}

		// Save number of steps between quota checks, to re-use when timer fires next.
		task.pollCount=pollCount;

		if(stepsRemaining>0) {
			//if(this.progress) this.progress.show(task,stepsRemaining);
		} else if(stepsRemaining<0) {
			//if(this.progress) this.progress.show(task,-stepsRemaining);
			if(task.state!=reach.task.State.BLOCK) this.blockTask(task);
		} else {
			if(task.state!=reach.task.State.DONE) this.finishTask(task);
		}
	}

	this.latestLink=link;

	quota-=time-startTime;
	if(quota<0) quota=0;
//	console.log('Event loop end quota '+quota+'.');
	// Store quota left unused and allow entering this function again.
	this.quotaFree=quota;
	if((this.runCount || this.unblockCount) && !this.timerId) {
		if(task) console.log(task.name+' activate timer.');
		this.timerId=setInterval(function() {return(self.tick());},this.interval);
	}
	this.advancing=false;
};
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
/** @fileoverview Calendrical calculations. */

goog.provide('gis.util.Date');

/** @constructor
  * @param {number} jd */
gis.util.Date=function(jd) {
	var year,month,day;
	var century;
	var isoWeekDay,weekDay,yearDay,isoYear,isoWeek;
	var jd1,jd4;
	var y;

	/** @param {number} jd */
	function getYMD(jd) {
		var century,centuryDay,yearDay;

		// Make the year start on March 1st so the weird month of February is moved to the end.
		jd+=305;
		// Get century and number of day within it. 146097 is the number of days in 400 years.
		century=~~((jd*4+3)/146097);
		centuryDay=jd-((century*146097)>>2);
		// Get year within century and day within year. 1461 is the number of days in 4 years.
		year=~~((centuryDay*4+3)/1461);
		yearDay=centuryDay-((year*1461)>>2);
		// 153 is the number of days in 5-month periods Mar-Jul and Aug-Dec. Here month 0 is March.
		// Formula gives month lengths 31 30 31 30 31 within those periods and February gets cut to 28 or 29 days.
		month=~~((5*yearDay+2)/153);

		day=yearDay-~~((month*153+2)/5)+1;
		// Offset months so counting starts from 1 and March becomes 3.
		month=(month+2)%12+1;
		// If month is Jan-Feb, increment year because it was effectively decremented when years were modified to start on March 1st.
		year=century*100+year+((18-month)>>4);
	}

	// US day of the week minus one, 0 is Sunday.
	weekDay=jd%7;
	// ISO day of the week minus one, 0 is Monday.
	isoWeekDay=(jd+6)%7;


	// Handle ISO week which belongs to the year its Thursday falls on.
	// Get year on this week's Thursday, which may not be this year but by definition is on this ISO year.
	getYMD(jd-isoWeekDay+3);
	isoYear=/** @type {number} */ (year);

	y=isoYear-1;
	century=~~(y/100);
	// Julian day of this ISO year's January 3rd.
	jd4=(century>>2)-century+(y>>2)+y*365+3;
	// Get last Sunday before January 4th. January 4th always falls on the first week of the ISO year because:
	// If January 1st is Thursday then 4th is Sunday, last day of the first week.
	// If January 1st is Friday then 4th is Monday, first day of the first week (previous week belongs to previous ISO year).
	// The Sunday before is the last day of the previous ISO year.
	jd4-=jd4%7;
	// Calculate ISO week number: Number of days from Sunday before ISO year's January 4th, divided by 7 rounded up.
    isoWeek=~~((jd-jd4+6)/7);

	getYMD(jd);

	y=year-1;
	century=~~(y/100);
	// Julian day of the last day of previous year.
	jd1=(century>>2)-century+(y>>2)+y*365;
	// Get day number of the year by comparing with last day of previous year.
	yearDay=jd-jd1;

	/** @type {number} */
	this.jd=jd;
	/** @type {number} */
	this.year=year;
	/** @type {number} */
	this.month=month;
	/** @type {number} */
	this.day=day;
	/** @type {number} */
	this.weekDay=weekDay;
	/** @type {number} */
	this.yearDay=yearDay;
	/** @type {number} */
	this.isoYear=isoYear;
	/** @type {number} */
	this.isoWeek=isoWeek;
};

/** @param {number} year
  * @param {number} month
  * @param {number} day
  * @return {gis.util.Date} */
gis.util.Date.fromYMD=function(year,month,day) {
	var y,century,leapDays;

	if(isNaN(year) || isNaN(month) || isNaN(day) || month<1 || month>12 || day<1 || day>31) return(null);

	// ((18-month)>>4)==1 if month<=2, else 0.
	// if month<=2 then this year's leap status doesn't affect julian day,
	// so check cumulative leap years only until previous year.
	y=year-((18-month)>>4);
	century=~~(y/100);
	leapDays=(century>>2)-century+(y>>2);

	return(new gis.util.Date(~~(((month+9)%12*153+2)/5)+leapDays+y*365+day-306));
};

/** @return {string} */
gis.util.Date.prototype.toFull=function() {
	/** @type {Array.<string>} */
	var weekDays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	/** @type {Array.<string>} */
	var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

	/** @param {number} n
	  * @param {number} width
	  * @return {string} */
	function pad(n,width) {
		return(new Array(width-(''+n).length+1).join('0')+n);
	}

	return(
		pad(this.year,4)+'-'+pad(this.month,2)+'-'+pad(this.day,2)+
		' '+
		pad(this.isoYear,4)+'-W'+pad(this.isoWeek,2)+'-'+((this.weekDay+6)%7+1)+
		' '+
		this.jd+
		' '+
		weekDays[this.weekDay]+
		' '+
		this.day+' '+months[this.month-1]+' '+this.year
	);
};

/** @return {string} */
gis.util.Date.prototype.format=function() {
	/** @param {number} n
	  * @param {number} width
	  * @return {string} */
	function pad(n,width) {
		return(new Array(width-(''+n).length+1).join('0')+n);
	}

	return(pad(this.year,4)+'-'+pad(this.month,2)+'-'+pad(this.day,2));
};

gis.util.Date.prototype.toString=gis.util.Date.prototype.format;
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
goog.provide('gis.format.DbfField');
goog.require('gis.Obj');

/** @constructor */
gis.format.DbfField=function() {
	/** @type {string} */
	this.name;
	/** @type {gis.format.DbfField.Type} */
	this.type;
	/** @type {number} */
	this.len;
	/** @type {number} */
	this.digitCount;
};

/** @enum {number} */
gis.format.DbfField.Type={
	NUMBER:0,
	STRING:1
};
goog.provide('gis.io.Stream');
goog.require('gis.Obj');

/** @constructor */
gis.io.Stream=function() {
	/** @type {number} */
	this.pos=0;
};

/** @enum {boolean} */
gis.io.Stream.Endian={
	BIG:true,
	LITTLE:false
};
goog.provide('gis.io.OctetStream');
goog.require('gis.Obj');
goog.require('gis.io.Stream');

/** @constructor
  * @extends {gis.io.Stream} */
gis.io.OctetStream=function() {
	gis.io.Stream.call(this);
    /** @type {gis.io.Stream.Endian} */
    this.endian;
	/** @type {string} */
	this.encoding;
};

gis.inherit(gis.io.OctetStream,gis.io.Stream);

/** @param {gis.io.Stream.Endian} endian */
gis.io.OctetStream.prototype.setEndian=function(endian) {};

/** @param {string} encoding */
gis.io.OctetStream.prototype.setEncoding=function(encoding) {};

/** @param {number} count */
gis.io.OctetStream.prototype.skip=function(count) {
	this.pos+=count;
};

/** @return {number} */
gis.io.OctetStream.prototype.peek8=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.read8=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.read16=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.read32=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.readFloat=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.readDouble=function() {};

/** @param {number} count
  * @return {string} */
gis.io.OctetStream.prototype.readChars=function(count) {};
goog.provide('gis.format.Dbf');
goog.require('gis.Obj');
goog.require('gis.format.DbfField');
goog.require('gis.io.OctetStream');
goog.require('gis.util.Date');

/** @constructor */
gis.format.Dbf=function() {
	/** @type {gis.io.OctetStream} */
	this.buf;
	/** @type {number} */
	this.len;

	/** @type {gis.util.Date} */
	this.date;
	/** @type {number} */
	this.rowCount;
	/** @type {number} */
	this.rowLen;

	/** @type {Array.<gis.format.DbfField>} */
	this.fieldList;
	/** @type {number} */
	this.fieldCount;
};

/** @enum {number} */
gis.format.Dbf.FieldTypeTbl={
	67:gis.format.DbfField.Type.STRING,
	78:gis.format.DbfField.Type.NUMBER
};

/** Read dBASE header.
  * @param {number} len */
gis.format.Dbf.prototype.readHeader=function(len) {
	var buf;
	var ver,year,month,day;
	var last;
	var field;

	if(len<68) console.log('Incomplete dbf file');

	buf=this.buf;
	buf.setEndian(gis.io.Stream.Endian.LITTLE);
	// A .cpg/.cst file can define the character set for content, headers should always be ASCII.
	buf.setEncoding('ISO-8859-1');

	ver=buf.read8()&7;
	if(ver!=3 && ver!=4) console.log('Incompatible dbf version');

	year=buf.read8()+1900;
	month=buf.read8();
	day=buf.read8();
	this.date=gis.util.Date.fromYMD(year,month,day);

	this.rowCount=buf.read32();
	last=buf.read16();
	this.rowLen=buf.read16();

	if(ver==3) {
		buf.skip(2+1+1+12+1);	// Reserved, dirty, encrypted, reserved, MDX.
		buf.read8();
		buf.skip(2);	// Reserved.
	} else {
		buf.skip(2+1+1+12+1);	// Reserved, dirty, encrypted, reserved, MDX.
		console.log(buf.readChars(32));
		buf.read8();
		buf.skip(2);	// Reserved.
		buf.skip(32);
		buf.skip(4);
	}

	this.fieldList=[];
	this.fieldCount=0;

	while(buf.peek8()!=13) {	// Character 0x13 (CR) terminates list of table columns.
		field=new gis.format.DbfField();

		if(ver==3) {
			field.name=buf.readChars(11).toLowerCase();
			field.type=gis.format.Dbf.FieldTypeTbl[buf.read8()];
			buf.skip(4);	// Reserved.
			field.len=buf.read8();
			field.digitCount=buf.read8();
			buf.skip(2+1+10+1);	// Reserved, area, reserved, MDX.
//			console.log(field);
		} else {
			console.log(buf.readChars(32));
//			buf.skip(2+1+2+4+4);	// Reserved, MDX, reserved, next autoincrement, reserved.
		}

		this.fieldList[this.fieldCount++]=field;
	}

	buf.read8();
};

gis.format.Dbf.prototype.readRow=function() {
	var buf;
	var pos,last;
	var fieldList;
	var fieldNum,fieldCount;
	var field;
	var mark;
	var txt;
	var row;

	row=null;
	buf=this.buf;
	pos=buf.pos;
	do {
		last=pos+this.rowLen;
		mark=buf.read8();
		if(mark==32) {
			row={};
			fieldList=this.fieldList;
			fieldCount=fieldList.length;
			for(fieldNum=0;fieldNum<fieldCount;fieldNum++) {
				field=fieldList[fieldNum];
				txt=buf.readChars(field.len);
				row[field.name.toLowerCase()]=(field.type==gis.format.DbfField.Type.NUMBER?+txt:txt.replace(/ +$/,''));
			}
		} else if(mark==26) break;

		buf.skip(last-buf.pos);
	} while(!row);

	return(row);
};

/** @param {gis.io.OctetStream} buf
  * @param {number} len
  * @param {Array.<string>=} fieldNameList */
gis.format.Dbf.prototype.importStream=function(buf,len,fieldNameList) {
	this.buf=buf;
	this.readHeader(len);
};
// "Attribute records in the dBASE file must be in the same order as records in the main (.shp) file."
// - Library of Congress, National Digital Information Infrastructure and Preservation Program
// http://www.digitalpreservation.gov/formats/fdd/fdd000326.shtml

goog.provide('gis.format.Shp');
goog.require('gis.Obj');
goog.require('gis.io.OctetStream');
goog.require('gis.format.Dbf');

/** @constructor */
gis.format.Shp=function() {
	/** @type {gis.io.OctetStream} */
	this.buf;
	/** @type {number} */
	this.len;
	this.proj;

	/** @type {number} */
	this.geometryCode;
	/** @type {gis.format.Shp.GeometryType} */
	this.geometryType;

	/** @type {gis.format.Dbf} */
	this.dbf=new gis.format.Dbf();
};

/** @enum {number} */
gis.format.Shp.GeometryType={
	POINT:0,
	POLYLINE:1,
	POLYGON:2
};

/** @type {Object.<number,gis.format.Shp.GeometryType>} */
gis.format.Shp.geometryTypeTbl={
	1:gis.format.Shp.GeometryType.POINT,
	3:gis.format.Shp.GeometryType.POLYLINE,
	5:gis.format.Shp.GeometryType.POLYGON,
	11:gis.format.Shp.GeometryType.POINT,
	13:gis.format.Shp.GeometryType.POLYLINE,
	15:gis.format.Shp.GeometryType.POLYGON,
	21:gis.format.Shp.GeometryType.POINT,
	23:gis.format.Shp.GeometryType.POLYLINE,
	25:gis.format.Shp.GeometryType.POLYGON
};

/** Read Shapefile header.
  * @param {number} len */
gis.format.Shp.prototype.readHeader=function(len) {
	var buf;

	if(len<100) console.log('Incomplete shp file');

	buf=this.buf;
	buf.setEndian(gis.io.Stream.Endian.BIG);

	// Read Shapefile header.
	if(buf.read32()!=9994) console.log('Wrong shp magic header');
	buf.skip(4*5); // Unused
	this.len=buf.read32()*2;
	if(len<this.len) console.log('Incomplete shp file');

	buf.setEndian(gis.io.Stream.Endian.LITTLE);

	if(buf.read32()!=1000) console.log('Incompatible shp version');
	this.geometryCode=buf.read32();
	this.geometryType=gis.format.Shp.geometryTypeTbl[this.geometryCode];
	buf.skip(8*8); // Bounds for X, Y, Z, M.
};

/** @param {gis.io.OctetStream} shpBuf
  * @param {number} shpLen
  * @param {gis.io.OctetStream} dbfBuf
  * @param {number} dbfLen
  * @param {Array.<string>=} fieldNameList */
gis.format.Shp.prototype.importStream=function(shpBuf,shpLen,dbfBuf,dbfLen,srcProj,dstProj,fieldNameList) {
	this.buf=shpBuf;
	this.srcProj=srcProj;
	this.dstProj=dstProj;

	this.readHeader(shpLen);
	if(dbfBuf) this.dbf.importStream(dbfBuf,dbfLen,fieldNameList);
};

gis.format.Shp.prototype.readShape=function() {
	var buf;
	var num;
	var len,last;
	var geometryCode;
	var ringNum,ringCount;
	var ptNumList;
	var ptNum,ptNumPrev,ptCount;
	var lat,lon;
	var srcProj,dstProj;
	var projPt;
	var row;

	buf=this.buf;
	if(buf.pos==this.len) return(null);

	buf.setEndian(gis.io.Stream.Endian.BIG);

	num=buf.read32();
	len=buf.read32()*2;

	buf.setEndian(gis.io.Stream.Endian.LITTLE);

	last=buf.pos+len;
	if(last>this.len) console.log('Record reaches past end of file');

	geometryCode=buf.read32();
	if(geometryCode!=this.geometryCode) console.log('Mixing shape types not allowed');

	srcProj=this.srcProj;
	dstProj=this.dstProj;

	ptList=[];

	switch(this.geometryType) {
		case gis.format.Shp.GeometryType.POLYLINE:
		case gis.format.Shp.GeometryType.POLYGON:
			buf.skip(8*4); // Bounding box.
			ringCount=buf.read32();
			ptCount=buf.read32();
			ptNumList=[];
			ptNumPrev=0;

			for(ringNum=0;ringNum<ringCount;ringNum++) {
				ptNum=buf.read32();
				if(ptNum<ptNumPrev) console.log('Polygon rings are out of order');
				ptNumList[ringNum]=ptNum;
				ptNumPrev=ptNum;
			}

			for(ptNum=0;ptNum<ptCount;ptNum++) {
				lon=buf.readDouble();
				lat=buf.readDouble();

				projPt=Proj4js.transform(srcProj,dstProj,new Proj4js.Point(lon,lat));
				lon=projPt.x;
				lat=projPt.y;
				ptList.push(new reach.Deg(lat,lon).toMU());
			}

			break;
	}

	buf.skip(last-buf.pos);

	row=this.dbf.readRow();

//	return(this.len-buf.pos);
	return([ptList,row]);
};
goog.provide('reach.srid');

/** @constructor */
reach.srid=function() {
	// WGS 84
	this['EPSG:4326']='+proj=longlat +datum=WGS84 +no_defs';
	// ETRS89 / TM35FIN(E,N)
	this['EPSG:3067']='+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89
	this['EPSG:4258']='+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs';
	// ETRS89 / ETRS-GK19FIN
	this['EPSG:3126']='+proj=tmerc +lat_0=0 +lon_0=19 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK20FIN
	this['EPSG:3127']='+proj=tmerc +lat_0=0 +lon_0=20 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK21FIN
	this['EPSG:3128']='+proj=tmerc +lat_0=0 +lon_0=21 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK22FIN
	this['EPSG:3129']='+proj=tmerc +lat_0=0 +lon_0=22 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK23FIN
	this['EPSG:3130']='+proj=tmerc +lat_0=0 +lon_0=23 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK24FIN
	this['EPSG:3131']='+proj=tmerc +lat_0=0 +lon_0=24 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK25FIN
	this['EPSG:3132']='+proj=tmerc +lat_0=0 +lon_0=25 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK26FIN
	this['EPSG:3133']='+proj=tmerc +lat_0=0 +lon_0=26 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK27FIN
	this['EPSG:3134']='+proj=tmerc +lat_0=0 +lon_0=27 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK28FIN
	this['EPSG:3135']='+proj=tmerc +lat_0=0 +lon_0=28 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK29FIN
	this['EPSG:3136']='+proj=tmerc +lat_0=0 +lon_0=29 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK30FIN
	this['EPSG:3137']='+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK31FIN
	this['EPSG:3138']='+proj=tmerc +lat_0=0 +lon_0=31 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / TM34
	this['EPSG:3046']='+proj=utm +zone=34 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / TM35
	this['EPSG:3047']='+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / TM36
	this['EPSG:3048']='+proj=utm +zone=36 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// KKJ / Finland zone 0
	this['EPSG:3386']='+proj=tmerc +lat_0=0 +lon_0=18 +k=1 +x_0=500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland zone 1
	this['EPSG:2391']='+proj=tmerc +lat_0=0 +lon_0=21 +k=1 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland zone 2
	this['EPSG:2392']='+proj=tmerc +lat_0=0 +lon_0=24 +k=1 +x_0=2500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland Uniform Coordinate System
	this['EPSG:2393']='+proj=tmerc +lat_0=0 +lon_0=27 +k=1 +x_0=3500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland zone 4
	this['EPSG:2394']='+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=4500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland zone 5
	this['EPSG:3387']='+proj=tmerc +lat_0=0 +lon_0=33 +k=1 +x_0=5500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
};
goog.provide('reach.data.HeapItem');

/** @interface */
reach.data.HeapItem=function() {};

/** @type {number} */
reach.data.HeapItem.prototype.heapIndex;

/** @type {number} Travel cost for reaching this stop. */
reach.data.HeapItem.prototype.cost;

/** @type {reach.data.HeapItem} */
reach.data.HeapItem.prototype.heapPrev;

/** @type {reach.data.HeapItem} */
reach.data.HeapItem.prototype.heapNext;
goog.provide('reach.route.Visitor');
goog.require('reach.Obj');
goog.require('reach.data.HeapItem');

/** @constructor
  * @implements {reach.data.HeapItem} */
reach.route.Visitor=function() {
	/** @type {number} */
	this.cost=0;
	/** @type {number} */
	this.time=0;
	/** @type {number} Index of this stop in Dijkstra's heap. */
	this.heapIndex;
	/** @type {reach.route.Visitor} */
	this.heapPrev=null;
	/** @type {reach.route.Visitor} */
	this.heapNext=null;
};

/** @param {reach.route.Dijkstra} dijkstra
  * @return {reach.route.Visitor.State} */
reach.route.Visitor.prototype.visit=function(dijkstra) {};

/** @enum {number} */
reach.route.Visitor.State={
	OK:0,
	WAIT:-1
};
goog.provide('reach.route.WayVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.route.result.WalkLeg');
goog.require('reach.road.Node');
goog.require('reach.road.Way');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.road.Way} way
  * @param {number} pos
  * @param {number} cost
  * @param {reach.road.Way} srcWay
  * @param {number} srcPos */
reach.route.WayVisitor=function(dijkstra,way,pos,cost,srcWay,srcPos) {
	reach.route.Visitor.call(this);
	/** @type {reach.road.Way} */
	this.way=way;
	/** @type {number} */
	this.pos=pos;
	/** @type {number} */
	this.cost=cost;
	/** @type {number} */
//	this.time=time;

	/** @type {reach.road.Way} */
	this.srcWay=srcWay;
	/** @type {number} */
	this.srcPos=srcPos;

	/** @type {number} */
//	this.tripCount=tripCount;

	if(way.runId!=dijkstra.runId) {
		// If this way hasn't been seen before in this Dijkstra run,
		// it may still contain old routing data from a previous run. Remove the data.
		way.runId=dijkstra.runId;
		way.costList=[];
//		way.timeList=[];
		if(dijkstra.conf.saveTrack) {
			way.srcWayList=[];
			way.srcPosList=[];
		}
	}
};

reach.inherit(reach.route.WayVisitor,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.WayVisitor.prototype.visit=function(dijkstra) {
	var runId;
	var stopNum;
	var stop;
	var wayNum;
	var way,otherWay;
	var node;
	var duration,durationAhead;
	var cost,newCost,otherCost,turnCost;
	var dist;
//	var time;
	var pos,newPos,otherPos;
//	var tripCount;

	way=this.way;
	pos=this.pos;
	cost=this.cost;

	// Check if this location has already been visited with lower or equal cost.
	// To get alternative routes, try replacing the line below with logic to add this visitor's data to the node
	// until a certain number of additional visitors have been found.
	if(way.costList[pos] && way.costList[pos]<=cost) return(reach.route.Visitor.State.OK);

//	time=this.time;
//	tripCount=this.tripCount;

	// Make sure tile containing current node is loaded (possibly containing other connected ways).
	if(pos==0 && way.fromTile && !way.fromTile.loaded /* && tilesLoaded<maxTiles */ ) {
		dijkstra.loadTile(way.fromTile); // way.nodeList[0].ll
		return(reach.route.Visitor.State.WAIT);
	}
	if(pos==way.nodeCount-1 && way.toTile && !way.toTile.loaded /* && tilesLoaded<maxTiles */ ) {
		dijkstra.loadTile(way.toTile) // way.nodeList.length-1].ll
		return(reach.route.Visitor.State.WAIT);
	}

	runId=dijkstra.runId;
	if(dijkstra.conf.saveTrack) {
		way.srcWayList[pos]=this.srcWay;
		way.srcPosList[pos]=this.srcPos;
//		way.timeList[pos]=time;
	}

//	if(dijkstra.onVisitRoad) dijkstra.onVisitRoad(dijkstra,this);

	way.costList[pos]=cost;
	// Get node along way at pos.
	if(way.pointNumList) node=/** @type {reach.road.Node} */ way.pointList[way.pointNumList[pos]];
	else node=/** @type {reach.road.Node} */ way.pointList[pos];

	if(node.runId!=dijkstra.runId) {
		// Node has not yet been visited. The current way is the fastest route to the node.
		node.runId=dijkstra.runId;

		if(node.followerCount) {
			// This node is also part of the abstract routing graph.
			dijkstra.onVisitGraphNode(dijkstra,this,node);
		}

		if(node.stopList && dijkstra.onVisitStopNode) {
			// There's stops attached to the node, so visit them all.
			stopNum=node.stopList.length;
			while(stopNum--) {
				stop=node.stopList[stopNum];
				if(stop.runId!=runId) {
					dijkstra.onVisitStopNode(dijkstra,this,node,stop);
					stop.runId=runId;
				}
			}
		}

		// Routing flag makes sure nodes added for input points can't bridge otherwise disconnected road networks.
		if(!node.routing) {
			// Visit all other ways connected to this node.
			// This is done only when first reaching the node without regard to other ways possibly having lower cost after considering
			// turn penalties. The case of going straight along other ways will still be considered by their visitors and for efficiency
			// we assume the turn penalty is the same for all ways, so coming from another way we couldn't later turn more efficiently
			// to ways found now.
//			wayNum=node.wayCount;
			wayNum=node.wayList.length;
			// TODO: check somehow (based on angle) if we're going straight at the intersection (road name may change or road may otherwise be split,
			// turn cost should still be 0 for such roads).
			if(wayNum>2) turnCost=dijkstra.conf.walkTurnCost;
			else turnCost=0;
			while(wayNum--) {
				otherWay=node.wayList[wayNum];
				if(otherWay==way) continue;
				otherPos=node.posList[wayNum];

				if(otherWay.runId==runId) {
					otherCost=otherWay.costList[otherPos];
					if(otherCost && otherCost<=cost) continue;
				}

				// Fork because another way connected to this node was found.
				dijkstra.found(new reach.route.WayVisitor(dijkstra,otherWay,otherPos,cost+turnCost,way,pos));
			}
		}
	}

	newCost=0;
	newPos=pos-1;
	dist=way.nodeDistList[pos];

	if(pos>0) {
		newCost=cost+(dist-way.nodeDistList[pos-1])*dijkstra.walkCostPerM;
		if(way.costList[newPos] && way.costList[newPos]<=newCost) newCost=0;
	}

	if(pos<way.nodeCount-1) {
//		durationAhead=way.distList[pos]*dijkstra.conf.walkTimePerM;
//		cost+=durationAhead*dijkstra.conf.walkCostMul;
		cost+=(way.nodeDistList[pos+1]-dist)*dijkstra.walkCostPerM;
		if(!way.costList[pos+1] || way.costList[pos+1]>newCost) {
			if(newCost) {
				// Fork because way was entered in the middle and must be traversed both ways.
				dijkstra.found(new reach.route.WayVisitor(dijkstra,way,newPos,newCost,way,pos));
			}

			newCost=cost;
			newPos=pos+1;
		}
	}

	if(newCost) {
		this.srcWay=way;
		this.srcPos=pos;
		this.cost=newCost;
		this.pos=newPos;
		dijkstra.found(this);
	}

	return(reach.route.Visitor.State.OK);
};

/** @param {reach.route.Conf} conf
  * @return {reach.route.result.WalkLeg} */
reach.route.WayVisitor.prototype.getLeg=function(conf) {
	var leg;
	var way,nextWay;
	var pos,nextPos,enterPos;
	var dist;
	var node;
	var turns;

	leg=new reach.route.result.WalkLeg();
	nextPos=this.pos;
	nextWay=this.way;
	enterPos=nextPos;
	turns=0;

	while(nextWay) {
		pos=nextPos;
		way=nextWay;

		nextPos=way.srcPosList[pos];
		nextWay=way.srcWayList[pos];

		if(nextWay!=way) {
			dist=way.nodeDistList[pos]-way.nodeDistList[enterPos];
			if(dist<0) dist=-dist;
			leg.insert(enterPos,way,pos,dist);
			enterPos=nextPos;

			if(way.pointNumList) node=/** @type {reach.road.Node} */ way.pointList[way.pointNumList[pos]];
			else node=/** @type {reach.road.Node} */ way.pointList[pos];
			if(node.wayList.length>2) turns++;
		}
	}

	leg.cost=this.cost-way.costList[pos];
	leg.duration=leg.dist*conf.walkTimePerM;
	// TODO: add assert, this should always be true: leg.cost==leg.duration*conf.walkCostMul
	// The leg can be used as a Dijkstra edge and having 0 cost causes loops in the resulting path.
	if(leg.cost<1) leg.cost=1;
//	leg.cost=leg.duration*conf.walkCostMul+turns*conf.walkTurnCost;
//console.log(leg.cost+' '+(leg.duration*conf.walkCostMul+turns*conf.walkTurnCost));

	return(leg);
};
goog.provide('reach.trans.ExtraLine');

/** @constructor
  * @param {Array.<reach.loc.Outdoor>} extraPtList */
reach.trans.ExtraLine=function(extraPtList) {
	/** @type {number} */
	this.runId=0;
	/** @type {Array.<number>} */
	this.costList=[];
	/** @type {Array.<number>} */
	this.timeList=[];
	/** @type {Array.<reach.road.Node>} */
	this.srcNodeList=[];
	this.ptList=extraPtList;
	this.durationList=[];

	/** @type {number} Number of departures around search start time, to evaluate line niceness. */
	this.departureCount=0;
	this.freq=3;
};

/** @param {reach.route.Conf} conf
  * @return {number} */
reach.trans.ExtraLine.prototype.getTransitCost=function(conf) {
	var id;

	id=''+this.routeId;

	if(conf.transitJoreCost) {
		for(var i in conf.transitJoreCost) {
			if(id && id.substr(0,i.length)==i) return(conf.transitJoreCost[i]);
		}
	}

	return(conf.transitCost);
};

goog.provide('reach.route.ExtraVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.trans.ExtraLine');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra */
reach.route.ExtraVisitor=function(dijkstra,extraLine,pos,cost,time,srcNode,tripCount) {
	reach.route.Visitor.call(this);

	if(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD) {
		time+=globalFrequency*60*dijkstra.conf.timeDiv/2;
		cost+=globalFrequency*60*dijkstra.conf.timeDiv/2*dijkstra.conf.waitCostMul;
	}

	this.extraLine=extraLine;
	/** @type {number} */
	this.enterPos=pos;
	this.enterTime=time;
	/** @type {number} */
	this.pos=pos;
	/** @type {number} */
	this.cost=cost;
	/** @type {number} */
	this.time=time;
	/** @type {reach.road.Node} */
	this.srcNode=srcNode;

	/** @type {number} */
	this.tripCount=tripCount;

/*
	if(line.runId!=dijkstra.runId) {
		// If this line hasn't been seen before in this Dijkstra run,
		// it may still contain old routing data from a previous run. Remove the data.
		line.runId=dijkstra.runId;
		line.firstPos=pos;
		line.costList=[];
		line.timeList=[];
//		line.srcPosList=[];
		line.srcStopList=[];
	}
globalTripVisitors++;
*/
};

reach.inherit(reach.route.ExtraVisitor,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.ExtraVisitor.prototype.visit=function(dijkstra) {
	var cost;
	var pos;
	var loc;
	var runId;
	var forward;
	var node;
	var time,nextTime,timeDiff;
	var transitCost;

	time=this.time;
	cost=this.cost;
	pos=this.pos;
	loc=this.extraLine.ptList[pos];
//	console.log(this.extraLine.ptList[this.pos].name+'\t'+cost+'\t'+pos+'\t'+this.extraLine.ptList.length);

	transitCost=this.extraLine.getTransitCost(dijkstra.conf);
	if(!transitCost) return(reach.route.Visitor.State.OK);

	forward=(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD);

	runId=dijkstra.runId;
	node=loc.node;
	if(node.runId!=runId || !node.cost || node.cost>this.cost+1) {
		// Increase cost by 1 when leaving the stop because zero-cost transitions are bad luck.
		if(forward) {
			dijkstra.found(reach.route.NodeVisitor.create(dijkstra,node,this.cost+1,time,this.srcNode,null,0,this.tripCount,[this.extraLine,this.enterPos,pos,this.enterTime,time]));
		} else {
			timeDiff=globalFrequency*60*dijkstra.conf.timeDiv/2;
			dijkstra.found(reach.route.NodeVisitor.create(dijkstra,node,this.cost+1+timeDiff*dijkstra.conf.waitCostMul,time-timeDiff,this.srcNode,null,0,this.tripCount,[this.extraLine,pos,this.enterPos,time,this.enterTime]));
		}
	}

	if(forward && pos<this.extraLine.ptList.length-1) {
		nextTime=time+this.extraLine.durationList[pos]*60*dijkstra.conf.timeDiv;
		pos++;
	} else if(!forward && pos>0) {
		pos--;
		nextTime=time-this.extraLine.durationList[pos]*60*dijkstra.conf.timeDiv;
	} else return(reach.route.Visitor.State.OK);

	this.cost+=(nextTime-time)*dijkstra.timeDelta*transitCost;
/*
	if(forward && pos<this.extraLine.ptList.length-1) {
		if(this.pos==this.enterPos) {
			nextTime+=globalFrequency*60*dijkstra.conf.timeDiv/2;
			this.cost+=globalFrequency*60*dijkstra.conf.timeDiv/2*dijkstra.conf.waitCostMul;
		}
	}
*/
	this.pos=pos;
	this.cost++;
	this.time=nextTime;

	dijkstra.found(this);

	return(reach.route.Visitor.State.OK);

/*
	var runId;
	var printMul;
	var line,trip,stop;
	var time,nextTime;
	var cost,pendingCost;
	var waitTime;
	var pos;
	var tripCount;
	var transferCost;
	var transitCost;
	var forward;

	line=this.line;
	pos=this.pos;
	cost=this.cost;

	if(line.costList[pos] && line.costList[pos]<=cost) return(reach.route.Visitor.State.OK);

	time=this.time;
	trip=this.trip;
	tripCount=this.tripCount;

	transitCost=trip.getTransitCost(dijkstra.conf);
	if(!transitCost) return(reach.route.Visitor.State.OK);

//	forward=dijkstra.conf.forward;
	forward=(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD);
	runId=dijkstra.runId;
	printMul=dijkstra.conf.timeDiv*60;
	stop=line.stopList[pos];

	line.costList[pos]=cost;
	line.timeList[pos]=time;
	if(this.srcStop) line.srcStopList[pos]=this.srcStop;
//	else line.srcPosList[pos]=pos-1;

//	if(dijkstra.onVisitLine) dijkstra.onVisitLine(dijkstra,this);

//	if(stop.runId!=runId || stop.costList.length==0 || stop.costList[0]>cost+modeCost) {
	if(this.srcStop!=stop) {
		transferCost=trip.getTransferCost(pos,!forward,dijkstra.conf);
		// Fork.
		if(forward) {
			waitTime=-trip.getTransferTime(false,dijkstra.conf);
			transferCost+=waitTime*dijkstra.conf.waitCostMul;
		} else {
			waitTime=-trip.getTransferTime(true,dijkstra.conf)-dijkstra.conf.minWait;
			transferCost-=waitTime*dijkstra.conf.waitCostMul;
		}
		dijkstra.found(reach.route.StopVisitor.create(dijkstra,stop,cost+transferCost,time+waitTime,null,trip,pos,tripCount));
	}

	pendingCost=this.pendingCost;
	if(!pendingCost) pendingCost=0;

	if(forward && pos<line.stopList.length-1) {
		pos++;
		nextTime=trip.guessArrival(pos)*printMul;
		if(nextTime<time) {
			// Arrival at next stop can happen in the past if original schedule data has errors or if compression delta
			// has kicked in so original times were 1 2 2 4, prediction was 1 3 4 4 and after applying delta 1 3 2 4.
			// TODO: best way to handle is to disable next stop if too far in the past, and detect also erroneously
			// late single arrivals in the schedule.
			if(time-nextTime>2*60*dijkstra.conf.timeDiv) {
				reach.util.assert(false,'TripVisitor.visit','Too much time travel for '+trip.key.longCode+' from '+stop.name+': '+reach.util.formatMins(time/60/dijkstra.conf.timeDiv)+' and '+reach.util.formatMins(nextTime/60/dijkstra.conf.timeDiv));
				return(reach.route.Visitor.State.OK);
			}
			pendingCost-=(time-nextTime)*dijkstra.timeDelta*transitCost;
			nextTime=time;
		}
	} else if(!forward && pos>0) {
		pos--;
		nextTime=trip.guessArrival(pos)*printMul;
		if(nextTime>time) {
			// Arrival at previous stop can happen in the future (see above case).
			if(nextTime-time>2*60*dijkstra.conf.timeDiv) {
				reach.util.assert(false,'TripVisitor.visit','Too much time travel for '+trip.key.longCode+' from '+stop.name+': '+reach.util.formatMins(time/60/dijkstra.conf.timeDiv)+' and '+reach.util.formatMins(nextTime/60/dijkstra.conf.timeDiv));
				return(reach.route.Visitor.State.OK);
			}
			pendingCost-=(nextTime-time)*dijkstra.timeDelta*transitCost;
			nextTime=time;
		}
	} else return(reach.route.Visitor.State.OK);

	pendingCost+=(nextTime-time)*dijkstra.timeDelta*transitCost;
	if(pendingCost<0) {
		pendingCost=0;
		this.pendingCost=pendingCost;
	}

	cost+=pendingCost+dijkstra.conf.transitCostAdd;
//	if(!trip.longCode) console.log('Will visit '+pos+' at '+reach.util.formatMins((nextTime)/printMul)+' with cost '+reach.util.formatMins((cost)/printMul)+' '+reach.util.formatMins(time/printMul)+'.');
	if(!line.costList[pos] || line.costList[pos]>cost) {
		this.pos=pos;
		this.cost=cost;
		this.time=nextTime;
		this.srcStop=null;
		dijkstra.found(this);
	}
*/
};
goog.provide('reach.route.TripVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.trans.Line');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.trans.Trip} trip
  * @param {number} pos
  * @param {number} cost
  * @param {number} time
  * @param {reach.trans.Stop} srcStop
  * @param {number} tripCount Number of trips taken so far on the route. */
reach.route.TripVisitor=function(dijkstra,trip,pos,cost,time,srcStop,tripCount) {
	var line;

	reach.route.Visitor.call(this);
	line=trip.key.line;

	/** @type {reach.trans.Trip} */
	this.trip=trip;
	/** @type {reach.trans.Line} */
	this.line=line;
	/** @type {number} */
	this.pos=pos;
	/** @type {number} */
	this.cost=cost;
	/** @type {number} */
	this.pendingCost;
	/** @type {number} */
	this.time=time;
	/** @type {reach.trans.Stop} */
	this.srcStop=srcStop;

	/** @type {number} */
	this.tripCount=tripCount;

	if(line.runId!=dijkstra.runId) {
		// If this line hasn't been seen before in this Dijkstra run,
		// it may still contain old routing data from a previous run. Remove the data.
		line.runId=dijkstra.runId;
		line.firstPos=pos;
		line.costList=[];
		line.timeList=[];
//		line.srcPosList=[];
		line.srcStopList=[];
	}
globalTripVisitors++;
};

var globalTripVisitors=0;

reach.inherit(reach.route.TripVisitor,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.TripVisitor.prototype.visit=function(dijkstra) {
	var runId;
	var printMul;
	var line,trip,stop;
	var time,nextTime;
	var cost,pendingCost;
	var waitTime;
	var pos;
	var tripCount;
	var transferCost;
	var transitCost;
	var forward;

	line=this.line;
	pos=this.pos;
	cost=this.cost;

	if(line.costList[pos] && line.costList[pos]<=cost) return(reach.route.Visitor.State.OK);

	time=this.time;
	trip=this.trip;
	tripCount=this.tripCount;

	transitCost=trip.getTransitCost(dijkstra.conf);
	if(!transitCost) return(reach.route.Visitor.State.OK);

//	forward=dijkstra.conf.forward;
	forward=(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD);
	runId=dijkstra.runId;
	printMul=dijkstra.conf.timeDiv*60;
	stop=line.stopList[pos];

	line.costList[pos]=cost;
	line.timeList[pos]=time;
	if(this.srcStop) line.srcStopList[pos]=this.srcStop;
//	else line.srcPosList[pos]=pos-1;

//	if(dijkstra.onVisitLine) dijkstra.onVisitLine(dijkstra,this);

//	if(stop.runId!=runId || stop.costList.length==0 || stop.costList[0]>cost+modeCost) {
	if(this.srcStop!=stop) {
		transferCost=trip.getTransferCost(pos,!forward,dijkstra.conf);
		// Fork.
		if(forward) {
			waitTime=-trip.getTransferTime(false,dijkstra.conf);
			transferCost+=waitTime*dijkstra.conf.waitCostMul;
		} else {
			waitTime=-trip.getTransferTime(true,dijkstra.conf)-dijkstra.conf.minWait;
			transferCost-=waitTime*dijkstra.conf.waitCostMul;
		}
		dijkstra.found(reach.route.StopVisitor.create(dijkstra,stop,cost+transferCost,time+waitTime,null,trip,pos,tripCount));
	}

	pendingCost=this.pendingCost;
	if(!pendingCost) pendingCost=0;

	if(forward && pos<line.stopList.length-1) {
		pos++;
		nextTime=trip.guessArrival(pos)*printMul;
		if(nextTime<time) {
			// Arrival at next stop can happen in the past if original schedule data has errors or if compression delta
			// has kicked in so original times were 1 2 2 4, prediction was 1 3 4 4 and after applying delta 1 3 2 4.
			// TODO: best way to handle is to disable next stop if too far in the past, and detect also erroneously
			// late single arrivals in the schedule.
			if(time-nextTime>2*60*dijkstra.conf.timeDiv) {
				reach.util.assert(false,'TripVisitor.visit','Too much time travel for '+trip.key.longCode+' from '+stop.name+': '+reach.util.formatMins(time/60/dijkstra.conf.timeDiv)+' and '+reach.util.formatMins(nextTime/60/dijkstra.conf.timeDiv));
				return(reach.route.Visitor.State.OK);
			}
			pendingCost-=(time-nextTime)*dijkstra.timeDelta*transitCost;
			nextTime=time;
		}
	} else if(!forward && pos>0) {
		pos--;
		nextTime=trip.guessArrival(pos)*printMul;
		if(nextTime>time) {
			// Arrival at previous stop can happen in the future (see above case).
			if(nextTime-time>2*60*dijkstra.conf.timeDiv) {
				reach.util.assert(false,'TripVisitor.visit','Too much time travel for '+trip.key.longCode+' from '+stop.name+': '+reach.util.formatMins(time/60/dijkstra.conf.timeDiv)+' and '+reach.util.formatMins(nextTime/60/dijkstra.conf.timeDiv));
				return(reach.route.Visitor.State.OK);
			}
			pendingCost-=(nextTime-time)*dijkstra.timeDelta*transitCost;
			nextTime=time;
		}
	} else return(reach.route.Visitor.State.OK);

	pendingCost+=(nextTime-time)*dijkstra.timeDelta*transitCost;
	if(pendingCost<0) {
		pendingCost=0;
		this.pendingCost=pendingCost;
	}

	cost+=pendingCost+dijkstra.conf.transitCostAdd;
//	if(!trip.longCode) console.log('Will visit '+pos+' at '+reach.util.formatMins((nextTime)/printMul)+' with cost '+reach.util.formatMins((cost)/printMul)+' '+reach.util.formatMins(time/printMul)+'.');
	if(!line.costList[pos] || line.costList[pos]>cost) {
		this.pos=pos;
		this.cost=cost;
		this.time=nextTime;
		this.srcStop=null;
		dijkstra.found(this);
	}

	return(reach.route.Visitor.State.OK);
};
goog.provide('reach.route.StopVisitor');
goog.require('reach.route.TripVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.StopVisitor=function() {
	reach.route.Visitor.call(this);
	/** @type {reach.trans.Stop|reach.route.StopVisitor} Stop to visit or for unused visitors the next visitor. */
	this.stop;
	/** @type {reach.road.Node} */
	this.srcNode;
	/** @type {reach.trans.Trip} */
	this.srcTrip;
	/** @type {number} Which stop along the trip this is. */
	this.srcPos;
	/** @type {number} */
	this.tripCount;
};

reach.inherit(reach.route.StopVisitor,reach.route.Visitor);

/** @type {reach.route.StopVisitor} */
reach.route.StopVisitor.freeItem=null;

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.trans.Stop} stop
  * @param {number} cost
  * @param {number} time
  * @param {reach.road.Node} srcNode
  * @param {reach.trans.Trip} srcTrip
  * @param {number} srcPos
  * @param {number} tripCount */
reach.route.StopVisitor.create=function(dijkstra,stop,cost,time,srcNode,srcTrip,srcPos,tripCount) {
	var self;

	self=reach.route.StopVisitor.freeItem;
	if(self) {
		reach.route.StopVisitor.freeItem=/** @type {reach.route.StopVisitor} */ self.stop;
	} else {
		self=new reach.route.StopVisitor();
	}

	self.stop=stop;
	self.cost=cost;
	self.time=time;
	self.srcNode=srcNode;
	self.srcTrip=srcTrip;
	self.srcPos=srcPos;
	self.tripCount=tripCount;

	if(stop.runId!=dijkstra.runId) {
		// If this node hasn't been seen before in this Dijkstra run,
		// it may still contain old routing data from a previous run. Remove the data.
		stop.runId=dijkstra.runId;
//		stop.costList=[];
//		stop.timeList=[];
		stop.cost=0;
		stop.srcNodeList=[];
		stop.srcTripList=[];
		stop.srcPosList=[];
	}

	return(self);
};

reach.route.StopVisitor.prototype.free=function() {
	this.stop=reach.route.StopVisitor.freeItem;
	reach.route.StopVisitor.freeItem=this;
	return(reach.route.Visitor.State.OK);
};

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.StopVisitor.prototype.visit=function(dijkstra) {
	var runId;
	var arrivalData;
	var testTime,departTime,arrivalTime;
	var waitTime;
	var lineNum,lineCount;
	var minuteMul,printMul;
	var cost;
	var line;
	/** @type {reach.trans.Trip} */
	var trip;
	var node;
	var stop;
	var pos;
	var first,last,mid,prevMid;
	var tripCount;
	var forward;
	var transferCost;

	stop=/** @type {reach.trans.Stop} */ this.stop;
	if(stop.disabled) return(this.free());

	forward=(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD);

	if(dijkstra.optimal) {
		// Check if time is different enough from previous entry.
//		if(stop.costList.length>1 && stop.timeList[0]+1*60*dijkstra.conf.timeDiv*60<=this.time) return;
		if(forward) {
			if(stop.cost && stop.time<this.time-dijkstra.conf.altRouteTimeSpan) return(this.free());
		} else {
			if(stop.cost && stop.time>this.time+dijkstra.conf.altRouteTimeSpan) return(this.free());
		}
	} else {
		// Exit if stop has already been reached with lower cost.
		if(stop.cost && stop.cost<=this.cost) return(this.free());
	}

	// Store current source node and stop as possible ways to reach this stop regardless of whether cost is better than found before.
	// This is to allow searching for alternative later departure times after initial Dijkstra is done.
	if(this.srcNode) stop.srcNodeList.push(this.srcNode);
	if(this.srcTrip) {
		stop.srcTripList.push(this.srcTrip);
		stop.srcPosList.push(this.srcPos);
	}

	// Exit if stop has already been reached with lower cost.
	if(stop.cost && stop.cost<=this.cost) return(this.free());

	// Not used for routing.
//	if(dijkstra.onVisitStop) dijkstra.onVisitStop(dijkstra,this);

	tripCount=this.tripCount;
	runId=dijkstra.runId;
	node=stop.node;
	if(node.runId!=runId || !node.cost || node.cost>this.cost+1) {
		// Increase cost by 1 when leaving the stop because zero-cost transitions are bad luck.
		dijkstra.found(reach.route.NodeVisitor.create(dijkstra,stop.node,this.cost+1,this.time,null,stop,0,tripCount));
	}

	if(forward) testTime=this.time+(tripCount>0?dijkstra.conf.minWait:dijkstra.conf.firstWait);
	else testTime=this.time;

	stop.cost=this.cost;
	// To handle minimum wait time while backtracking, include it in stop visit time.
	stop.time=testTime;

	lineCount=stop.lineList.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=stop.lineList[lineNum];
		pos=stop.posList[lineNum];
		reach.util.assert(line.stopList[pos]==stop,'StopVisitor.visit','Incorrect line or pos '+pos+', '+stop.name+' != '+line.stopList[pos].name+'.');
		// No point even checking for opportunities to enter buses at earlier stops if they've already been entered at later stops.
		// There's a tolerance of 1 stop because sometimes it might be possible to catch an earlier bus by walking to the previous stop
		// instead of a closer stop following it.
		if(line.runId==runId && ((forward && line.firstPos>pos+1) || (!forward && line.firstPos<pos-1))) continue;

		arrivalData=line.guessArrival(pos,testTime,dijkstra.conf);
		if(!arrivalData) continue;

		trip=arrivalData.trip;
		arrivalTime=arrivalData.time;

		waitTime=(arrivalTime-this.time)*dijkstra.timeDelta;
		reach.util.assert(waitTime>=0,'StopVisitor','Negative wait time! '+this.time+' '+arrivalTime);

		if(tripCount>0) cost=waitTime*dijkstra.conf.waitCostMul;
		else cost=waitTime*dijkstra.conf.initWaitCostMul;

		transferCost=trip.getTransferCost(pos,forward,dijkstra.conf);
		cost+=this.cost+transferCost;

//		if(line.runId!=runId || ((!forward || line.firstPos<=pos) && (!line.costList[pos] || line.costList[pos]>cost))) {
		if(line.runId!=runId || !line.costList[pos] || line.costList[pos]>cost) {
			// Fork.
			dijkstra.found(new reach.route.TripVisitor(dijkstra,trip,pos,cost,arrivalTime,this.stop,tripCount+1));
		}
	}

	return(this.free());
};
goog.provide('reach.route.NodeVisitor');
goog.require('reach.route.Visitor');
goog.require('reach.route.StopVisitor');
goog.require('reach.route.ExtraVisitor');
goog.require('reach.road.Node');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.NodeVisitor=function() {
	reach.route.Visitor.call(this);
	/** @type {reach.road.Node|reach.route.NodeVisitor} Node to visit or for unused visitors the next visitor. */
	this.node;
	/** @type {reach.road.Node} */
	this.srcNode;
	/** @type {reach.trans.Stop} */
	this.srcStop;
	/** @type {reach.trans.Extra} */
	this.srcExtra;
	/** @type {number} */
	this.srcDist;
	/** @type {number} */
	this.tripCount;
};

//var globalNew=0;

reach.inherit(reach.route.NodeVisitor,reach.route.Visitor);

/** @type {reach.route.NodeVisitor} */
reach.route.NodeVisitor.freeItem=null;

/** Initialization separated from constructor so existing objects can be recycled instead of calling new.
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.road.Node} node
  * @param {number} cost
  * @param {number} time
  * @param {reach.road.Node} srcNode
  * @param {reach.trans.Stop} srcStop
  * @param {number} srcDist
  * @param {number} tripCount */
reach.route.NodeVisitor.create=function(dijkstra,node,cost,time,srcNode,srcStop,srcDist,tripCount,srcExtra) {
	var self;

	self=reach.route.NodeVisitor.freeItem;
	if(self) {
		reach.route.NodeVisitor.freeItem=/** @type {reach.route.NodeVisitor} */ self.node;
	} else {
		self=new reach.route.NodeVisitor();
//console.log(globalNew++);
	}

	self.node=node;
	self.cost=cost;
	self.time=time;
	self.srcNode=srcNode;
	self.srcStop=srcStop;
	self.srcExtra=srcExtra;
	self.srcDist=srcDist;
	self.tripCount=tripCount;

	if(node.runId!=dijkstra.runId) {
		// If this node hasn't been seen before in this Dijkstra run,
		// it may still contain old routing data from a previous run. Remove the data.
		node.runId=dijkstra.runId;
//		node.cost=dijkstra.conf.infCost;
		node.cost=0;
		node.time=0;	// For isochrones.
		node.srcNode=null;
		node.srcStop=null;
		node.srcExtra=null;
		node.srcDist=0;
	}

	return(self);
};

reach.route.NodeVisitor.prototype.free=function() {
	this.node=reach.route.NodeVisitor.freeItem;
	reach.route.NodeVisitor.freeItem=this;
	return(reach.route.Visitor.State.OK);
};

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.NodeVisitor.prototype.visit=function(dijkstra) {
	var runId;
	var stopNum,stopCount;
	var followerNum,followerCount;
	var cost,otherCost;
	var time,duration;
	var dist;
	var node,next;
	var stop;
	var tripCount;
	var forward;
	var walkList;
	var walkNum;
	var leg;
	var loc;

	node=/** @type {reach.road.Node} */ this.node;
	cost=this.cost;

	// Exit if node has already been reached with lower cost.
	if(node.cost && node.cost<=cost) return(this.free());
//	if(node.cost<=cost) return(this.free());

	time=this.time;
	tripCount=this.tripCount;
	forward=(dijkstra.dir==reach.route.Dijkstra.Dir.FORWARD);

	runId=dijkstra.runId;
	node.cost=cost;
	node.time=time;	// For isochrones.
	node.srcNode=this.srcNode;
	node.srcStop=this.srcStop;
//if(this.srcExtra) console.log(this.srcExtra);
	node.srcExtra=this.srcExtra;
	// Store distance to previous node because otherwise recovering it would require going through previous node's followerList.
	node.srcDist=this.srcDist;

	// Not used for routing.
//	if(dijkstra.onVisitNode) dijkstra.onVisitNode(dijkstra,this);

	walkList=node.walkList;
	if(walkList) {
		walkNum=walkList.length;
		while(walkNum--) {
			leg=/** @type {reach.route.result.WalkLeg} */ walkList[walkNum].leg;
			loc=leg.endLoc;
			if(loc.runId!=runId || !loc.cost || loc.cost>cost+leg.cost) {
				dijkstra.found(new reach.route.LocVisitor(dijkstra,loc,cost+1,time,leg,tripCount));
			}
		}
	}

	// Check transit stops connected to this node.
	if(node.stopList) {
		stopCount=node.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=node.stopList[stopNum];
//			if(stop.runId!=runId || !stop.costList[0] || stop.costList[0]>cost+1) dijkstra.found(new reach.route.StopVisitor(dijkstra,stop,cost+1,time,node,null,0,tripCount));
			if(this.srcStop!=stop) {
				// Increase cost by 1 when entering the stop because zero-cost transitions are bad luck.
				dijkstra.found(reach.route.StopVisitor.create(dijkstra,stop,cost+1,time,node,null,0,tripCount));
			}
		}
	}

	if(node.extraLine) {
//		console.log(node.extraLine+' '+node.ll+' '+node.cost+' '+cost);
		dijkstra.found(new reach.route.ExtraVisitor(dijkstra,node.extraLine,node.extraPos,cost+1,time,node,tripCount+1));
	}

	this.free();
	// Look for surrounding nodes to walk to.
	followerCount=node.followerCount;
	for(followerNum=0;followerCount;followerNum++) {
		// List might have gaps but there's still followerCount items. (TODO: Can there actually be gaps nowadays???)
		next=node.followerList[followerNum];
		if(!next) continue;
		followerCount--;
//		if(next.runId==runId && next.cost && next.cost<=otherCost) continue;
		// Shortcut, we don't even need to calculate distance to the next node if its cost is less than current node's.
		if(next.runId==runId && next.cost && next.cost<=otherCost) continue;

		dist=node.distList[followerNum];
		duration=dist*dijkstra.conf.walkTimePerM;
		otherCost=cost+duration*dijkstra.conf.walkCostMul;
		if(otherCost<cost+1) otherCost=cost+1;
		if(!forward) duration=-duration;

		if(next.runId!=runId || !next.cost || next.cost>otherCost) {
//		if(next.runId!=runId || next.cost>otherCost) {
			dijkstra.found(reach.route.NodeVisitor.create(dijkstra,next,otherCost,time+duration,node,null,dist,tripCount));
		}
	}

	return(reach.route.Visitor.State.OK);
};
goog.provide('reach.route.LocVisitor');
goog.require('reach.route.Visitor');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.loc.Location} loc
  * @param {number} cost
  * @param {reach.route.result.WalkLeg} srcLeg
  * @param {number} tripCount */
reach.route.LocVisitor=function(dijkstra,loc,cost,time,srcLeg,tripCount) {
	reach.route.Visitor.call(this);
	/** @type {reach.loc.Location} */
	this.loc=loc;
	/** @type {number} */
	this.cost=cost;
	/** @type {number} */
	this.time=time;
	/** @type {number} */
	this.tripCount=tripCount;

	if(loc.runId!=dijkstra.runId) {
		loc.runId=dijkstra.runId;
		loc.cost=0;
		loc.srcLeg=null;
    }
};

reach.inherit(reach.route.LocVisitor,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.LocVisitor.prototype.visit=function(dijkstra) {
	var loc;
	var cost;
	var tripCount;
	var walkList;
	var walkNum,walkCount;
	var node;

	loc=this.loc;
	cost=this.cost;

	if(loc.cost && loc.cost<=cost) return(reach.route.Visitor.State.OK);
	loc.cost=cost;

	if(dijkstra.onVisitLoc) dijkstra.onVisitLoc(dijkstra,this,loc);
/*
	if(loc.inputSet.mode==reach.loc.InputSet.Type.EXTRA) {
		tripCount=this.tripCount;
		walkList=loc.walkList[reach.loc.Outdoor.Type.GRAPH];
		walkCount=walkList.length;
		for(walkNum=0;walkNum<walkCount;walkNum++) {
			walk=walkList[walkNum].leg;
			node=walk.startNode;
			if(node.cost>cost) {
//				console.log(walk.startNode);
//				dijkstra.found(new reach.route.StopVisitor(dijkstra,stop,cost+transferCost,time+waitTime,null,trip,pos,tripCount));
				dijkstra.found(reach.route.NodeVisitor.create(dijkstra,node,cost+1,this.time,null,null,0,tripCount));
			}
		}
	}
*/

	return(reach.route.Visitor.State.OK);
};
goog.provide('reach.data.RadixHeap');
goog.require('reach.data.HeapItem');

/** @constructor
  * @param {number} size */
reach.data.RadixHeap=function(size) {
	var i;

	/** @type {Array.<reach.data.HeapItem>} */
	this.heap=[];
//	this.heap=new Array(size);
	/** @type {number} */
	this.cursor=0;
	/** @type {number} */
	this.size=size;
	/** @type {number} */
	this.itemCount=0;

//	for(i=0;i<size;i++) this.heap[i]=null;
};

reach.data.RadixHeap.prototype.clear=function() {
	var i;

	this.heap=[];
//	this.heap=new Array(size);
	this.cursor=0;
	this.itemCount=0;

//	for(i=0;i<this.size;i++) this.heap[i]=null;
};

/** @param {reach.data.HeapItem} item */
reach.data.RadixHeap.prototype.remove=function(item) {
	var next;

	next=item.heapNext;

	if(next) next.heapPrev=item.heapPrev;
	if(item.heapPrev) {
		item.heapPrev.heapNext=next;
	} else {
		this.heap[~~item.cost]=next;
	}

	item.heapPrev=null;
	item.heapNext=null;
	this.itemCount--;
};

/** @param {reach.data.HeapItem} item
  * @param {number} cost */
reach.data.RadixHeap.prototype.insert=function(item,cost) {
	var old;

//if(cost<this.cursor) console.log('RadixHeap.insert says: The cursor decrease IS necessary.');
//	if(cost<this.cursor) this.cursor=cost;
	item.cost=cost;

	old=this.heap[~~item.cost];
	item.heapNext=old;
	item.heapPrev=null;
	if(old) old.heapPrev=item;

	this.heap[~~item.cost]=item;
	this.itemCount++;
};

/** @param {reach.data.HeapItem} item
  * @param {number} cost */
reach.data.RadixHeap.prototype.setKey=function(item,cost) {
	this.remove(item);
	this.insert(item,cost);
};

/** @return {reach.data.HeapItem} */
reach.data.RadixHeap.prototype.extractMin=function() {
	var item;

	if(this.itemCount==0) return(null);
	while(!this.heap[this.cursor]) {
		this.cursor++;
//if(this.cursor%1000==0) console.log(this.cursor);
//		console.log(this.itemCount+'\t'+this.cursor);
	}

	item=this.heap[this.cursor];
	if(item) this.remove(item);

	return(item);
};
goog.provide('reach.route.Dijkstra');
goog.require('reach.route.Visitor');
goog.require('reach.route.WayVisitor');
goog.require('reach.route.NodeVisitor');
goog.require('reach.route.StopVisitor');
goog.require('reach.route.LocVisitor');
goog.require('reach.road.Node');
goog.require('reach.road.Tile');
goog.require('reach.data.RadixHeap');

/** Dijkstra's algorithm, the core of the reachability analysis.
  * @constructor */
reach.route.Dijkstra=function() {
	/** @type {reach.route.Conf} */
	this.conf=null;
	/** @type {reach.data.RadixHeap} */
	this.heap=null;
	/** @type {number} */
	this.runId=0;

	/** @type {?function(reach.route.Dijkstra,reach.route.WayVisitor)} */
//	this.onVisitRoad=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.NodeVisitor)} */
//	this.onVisitNode=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.StopVisitor)} */
//	this.onVisitStop=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.TripVisitor)} */
//	this.onVisitLine=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.WayVisitor,reach.road.Node)} */
	this.onVisitGraphNode=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.WayVisitor,reach.road.Node,reach.trans.Stop)} */
	this.onVisitStopNode=null;
	/** @type {?function(reach.route.Dijkstra,reach.route.LocVisitor,reach.loc.Location)} */
	this.onVisitLoc=null;

	/** @type {Array.<reach.road.Node>} */
	this.visitList=[];
	/** @type {number} */
	this.visitCount=0;

	/** @type {number} */
	this.clusterDist=10;
//	this.clusterDist=15;

	/** @type {Array.<{stop:reach.trans.Stop,cost:number,time:number}>} */
	this.visitStopList=[];

//	this.finalData=[];

	/** @type {function(reach.road.Tile)} */
	this.loadTile;

	/** @type {number} Stop Dijkstra when cost becomes too large */
	this.maxCost=0;
	/** @type {number} Currently only used to check if search explored the entire road graph (happens on islands and isolated graph segments).
      * Then if too few stops were found, routing would fail and it's better to find another nearest road outside the segment. */
	this.finalCost=0;

	/** @type {number} Unit: Time Units/m */
	this.walkCostPerM=0;

	/** @type {reach.route.Dijkstra.Dir} Direction of time as cost increases, boolean enum. */
	this.dir=reach.route.Dijkstra.Dir.FORWARD;
	/** @type {number} Direction of time as cost increases, multiplication factor 1 or -1. */
	this.timeDelta=1;

	/** @type {boolean} True if we will search in both directions to get optimal departure and arrival time. */
	this.optimal=false;
};

/** @enum {boolean} */
reach.route.Dijkstra.Dir={
    FORWARD:true,
    BACKWARD:false
};

/** @constructor Exception object returned on IO error when trying to load a road network tile.
  * @param {reach.road.Tile} tile
  * @param {reach.MU} ll */
reach.route.Dijkstra.LoadTileException=function(tile,ll) {
	/** @type {reach.road.Tile} */
	this.tile=tile;
	/** @type {reach.MU} */
	this.ll=ll;
};

/** Method to stop Dijkstra execution. */
reach.route.Dijkstra.prototype.stop=function() {
	this.maxCost=1;
};

/** Start from a road network tile node. Search for stops and routing graph nodes up to maxWalk meters. The batch process will retry binding to a
  * different road if too few stops are found (less than conf.stopNearMin). TODO: consider only stops with departures in Batch.js
  * @param {reach.road.Node} node
  * @param {reach.route.Conf} conf
  * @param {function(reach.road.Tile)} loadTile Callback function to load another map tile. */
reach.route.Dijkstra.prototype.startWayNode=function(node,conf,loadTile) {
	var wayNum,wayCount;
	var visitor;

	this.runId++;
	this.conf=conf;
	this.loadTile=loadTile;
	// Heap used as a priority queue. The radix "heap" isn't actually a heap...
	this.heap=new reach.data.RadixHeap(conf.maxCost);

	this.walkCostPerM=conf.walkTimePerM*conf.walkCostMul;
	// Note: maxWalk only affects distance up to which walks are guaranteed to have optimal geometry
	// in the beginning and end of routes or when transferring to custom transit lines.
	this.maxCost=conf.maxWalk*this.walkCostPerM;

	wayCount=node.wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		// Starting cost is 1 because 0 can have strange special meanings
		// (mainly because undefined and 0 both evaluate to boolean false in tests).
		visitor=new reach.route.WayVisitor(this,node.wayList[wayNum],node.posList[wayNum],1,null,0);
		this.heap.insert(visitor,~~(visitor.cost+0.5));
	}
};

/** @param {reach.loc.Outdoor} loc
  * @param {number} startTime
  * @param {reach.route.Dijkstra.Dir} dir
  * @param {reach.route.Conf} conf */
reach.route.Dijkstra.prototype.startOutdoor=function(loc,startTime,dir,conf) {
	var walkList;
	var legNum,legCount;
	var leg;
	var visitor;

	reach.route.NodeVisitor.freeItem=null;
	reach.route.StopVisitor.freeItem=null;

	// TODO: This is a kludge. Nothing should read conf.forward I think, it should be deprecated.
	conf.forward=(dir==reach.route.Dijkstra.Dir.FORWARD);

	if(dir==reach.route.Dijkstra.Dir.FORWARD) {
		this.timeDelta=1;
	} else {
		this.timeDelta=-1;
	}
	this.runId++;
	this.dir=dir;
	this.conf=conf;
	// Heap used as a priority queue. The radix "heap" isn't actually a heap...
	this.heap=new reach.data.RadixHeap(conf.maxCost);

//	this.walkCostPerM=conf.walkTimePerM*conf.walkCostMul;
	this.maxCost=conf.maxCost;

	walkList=loc.walkList[reach.loc.Outdoor.Type.GRAPH];
	if(walkList) {
		legCount=walkList.length;
		for(legNum=0;legNum<legCount;legNum++) {
			leg=/** @type {reach.route.result.WalkLeg} */ walkList[legNum].leg;
			leg.startNode.firstWalk=walkList[legNum];

			// Note: leg.cost must be >=1! If dijkstra starting cost is 0, bad things happen because 0 evaluates to false in tests.
			if(leg.cost<1) leg.cost++;
			visitor=reach.route.NodeVisitor.create(this,leg.startNode,leg.cost,startTime+leg.duration*this.timeDelta,null,null,0,0);
			this.heap.insert(visitor,~~(visitor.cost+0.5));
		}
	}
};

/** @param {reach.route.Visitor} visitor */
reach.route.Dijkstra.prototype.found=function(visitor) {
//	this.heap.insert(visitor,~~(visitor.cost+0.5));
	this.heap.insert(visitor,visitor.cost);
	return(true);
};

/** Advance Dijkstra's algorithm by one step, visiting one stop.
  * @return {number} 0 means the function can be called again,
  * 1 means search is done and -1 means we need to wait for some callback (mainly loadTile) to fire before continuing. */
reach.route.Dijkstra.prototype.step=function() {
	var visitor;
	var ret;

	visitor=/** @type {reach.route.Visitor} */ this.heap.extractMin();
	// Checking maxCost here instead of step so search can be stopped immediately by lowering it.
	if(!visitor || (this.maxCost>0 && visitor.cost>this.maxCost)) {
		// Save memory by allowing the heap to be garbage collected.
		this.heap=null;
		if(visitor) this.finalCost=visitor.cost;
		else this.finalCost=0;
		return(1);
	}
	ret=visitor.visit(this);
	if(ret==reach.route.Visitor.State.WAIT) {
		// The visitor was interrupted, likely to wait for more data to load.
		// Put it back in the heap so it's visited again next when routing can continue.
		this.heap.insert(visitor,~~(visitor.cost+0.5));
		return(-1);
	}

	return(0);
};
goog.provide('reach.core.Opt');

/** @constructor
  * @param {Array.<string>} argv
  * @param {Object.<string,Array.<*>>} conf
  * @return {Object.<string,*>} */
reach.core.Opt=function(argv,conf,restConf,appName,ver) {
	var argNum,argCount;
	var arg;
	var rest;
	var fields,keys;
	var key;
	var keyNum,keyCount;
	var parsed;
	var pending;
	var pendNum,pendCount;
	var alias;
	var def;

	this.conf=conf;
	this.restConf=restConf;
	this.restTbl={};
	/** @type {string} */
	this.appName=appName;
	/** @type {string} */
	this.ver=ver;

	/** @param {string} key
	  * @param {string|boolean} val */
	function setArg(key,val) {
		if(alias[key]) parsed.def[alias[key].name]=val;
		else parsed.undef[key]=val;
	}

	/** @param {string} key
	  * @return {string} */
	function camel(key) {
		return(key.replace(/-([a-z])/,
			/** @param {string} s
			  * @param {string} c */
			function(s,c) {
				return(c.toUpperCase());
			}
		));
	}

	argCount=argv.length;
	parsed={def:{},undef:{},rest:[]};
	pending=[];
	rest=[];
	pendCount=0;
	pendNum=0;

	keyCount=this.restConf.length;
	for(keyNum=0;keyNum<keyCount;keyNum++) {
		this.restTbl[restConf[keyNum]]='?';
	}

	alias={};
	for(var key in conf) {
		if(!conf.hasOwnProperty(key)) continue;
		def=conf[key];
		fields=(/** @type {string} */ def[0]).split(/[ ,|]/);
		keyCount=fields.length;
		for(keyNum=0;keyNum<keyCount;keyNum++) {
//			alias[fields[keyNum]]=key;
			alias[camel(fields[keyNum])]={name:key,type:def[1]};
		}
		if(typeof(def[2])!='undefined') parsed.def[key]=def[2];

		if(this.restTbl[conf[key][0]]) this.restTbl[conf[key][0]]=key;
	}

	for(argNum=2;argNum<argCount;argNum++) {
		arg=argv[argNum];

		if(arg=='--') {
			rest.push.apply(rest,argv.slice(argNum+1));
			break;
		}

		if(arg.match(/^-[A-Za-z]/)) {
			fields=arg.split(/[A-Za-z]/);
			keys=arg.match(/[A-Za-z]/g);

			keyCount=keys.length;
			for(keyNum=0;keyNum<keyCount;keyNum++) {
				key=keys[keyNum];
				if(fields[keyNum+1]) {
					setArg(key,fields[keyNum+1]);
				} else {
					if(key=='v' && !alias['v']) {
						this.printVersion();
						process.exit();
					}
					if(key=='h' && !alias['h']) {
						this.printUsage();
						process.exit();
					}
					if(alias[key].type) pending[pendCount++]=key;
					setArg(key,true);
				}
			}

			continue;
		}

		fields=arg.match(/^--(no-)?([^=]+)(=(.*))?/);

		if(!fields) {
			if(pendNum<pendCount) setArg(pending[pendNum++],arg);
			else rest.push(arg);
			continue;
		}

		key=fields[2];

		if(fields[4]) {
			setArg(camel((fields[1]||'')+key),fields[4]);
		} else if(fields[1]) {
			setArg(camel(key),false);
		} else {
			if(key=='version' && !alias['version']) {
				this.printVersion();
				process.exit();
			}
			if(key=='help' && !alias['help']) {
				this.printUsage();
				process.exit();
			}
			pending[pendCount++]=camel(key);
		}
	}

	while(pendNum<pendCount) {
		setArg(pending[pendNum++],true);
	}

	keyCount=restConf.length;
	if(rest.length<keyCount) {
		keyCount=rest.length;
//		this.printUsage();
//		process.exit();
	}
	for(keyNum=0;keyNum<keyCount;keyNum++) {
		parsed.def[this.restTbl[restConf[keyNum]]]=rest.shift();
	}

	parsed.rest=rest;

	this.def=parsed.def;
	this.undef=parsed.undef;
	this.rest=parsed.rest;
};

reach.core.Opt.prototype.printVersion=function() {
	if(this.ver) {
		console.log(this.appName+' '+this.ver);
	}
};

reach.core.Opt.prototype.printUsage=function() {
	var aliasList;
	var aliasNum,aliasCount;
	var alias;
	var conf;
	var restTbl;
	var i,l;

	if(this.ver) {
		console.log(this.appName+' '+this.ver);
	}

	conf=this.conf;
	restTbl=this.restTbl;

	console.log('\nUsage:\n');

	alias='';
	l=this.restConf.length;
	for(i=0;i<l;i++) {
		alias+=' '+conf[restTbl[this.restConf[i]]][1];
	}

	console.log(this.appName+' [OPTION]...'+alias);

	for(i=0;i<l;i++) {
		alias=conf[restTbl[this.restConf[i]]][1];
		console.log('  '+alias+Array(28-alias.length).join(' ')+conf[restTbl[this.restConf[i]]][3]+'.');
	}

	console.log('\nOptions:');

	for(var key in conf) {
		if(!conf.hasOwnProperty(key)) continue;
		if(restTbl[conf[key][0]]) continue;
		aliasList=conf[key][0].split(/[ ,|]/);
		aliasCount=aliasList.length;
		for(aliasNum=0;aliasNum<aliasCount;aliasNum++) {
			alias=aliasList[aliasNum];
			if(alias.match(/^[A-Za-z]$/)) alias='-'+alias;
			else alias='--'+alias;
			aliasList[aliasNum]=alias;
		}

		alias=aliasList.join(', ');

		if(conf[key][1]) {
			if(aliasList[aliasList.length-1].substr(0,2)=='--') alias+='=';
			else alias+=' ';
			alias+=conf[key][1];
		}

		console.log('  '+alias+Array(28-alias.length).join(' ')+conf[key][3]+'.');
	}
};
goog.provide('gis.io.NodeStream');
goog.require('gis.Obj');
goog.require('gis.io.OctetStream');

/** @constructor
  * @extends {gis.io.OctetStream}
  * @param {gis.io.Stream.Endian=} endian
  * @param {NodeBuffer=} data */
gis.io.NodeStream=function(endian,data) {
	gis.io.OctetStream.call(this);
	/** @type {NodeBuffer} */
	this.data=data;
	/** @type {Iconv} */
	this.dec;

	this.setEndian(endian);
};

gis.inherit(gis.io.NodeStream,gis.io.OctetStream);

/** @param {gis.io.Stream.Endian} endian */
gis.io.NodeStream.prototype.setEndian=function(endian) {
	this.endian=endian;

	if(endian==gis.io.Stream.Endian.LITTLE) {
		this.read16=this.read16L;
		this.read32=this.read32L;
		this.readFloat=this.readFloatL;
		this.readDouble=this.readDoubleL;
	} else {
		this.read16=this.read16B;
		this.read32=this.read32B;
		this.readFloat=this.readFloatB;
		this.readDouble=this.readDoubleB;
	}
};

/** @param {string} encoding */
gis.io.NodeStream.prototype.setEncoding=function(encoding) {
    this.encoding=encoding;
	this.dec=new Iconv(encoding,'UTF-8//IGNORE');
};

/** @return {number} */
gis.io.NodeStream.prototype.peek8=function() {
	return(this.data.readUInt8(this.pos));
};

/** @return {number} */
gis.io.NodeStream.prototype.read8=function() {
	return(this.data.readUInt8(this.pos++));
};

/** @return {number} */
gis.io.NodeStream.prototype.read16L=function() {
	return(this.data.readUInt16LE((this.pos+=2)-2));
};

/** @return {number} */
gis.io.NodeStream.prototype.read16B=function() {
	return(this.data.readUInt16BE((this.pos+=2)-2));
};

/** @return {number} */
gis.io.NodeStream.prototype.read32L=function() {
	return(this.data.readUInt32LE((this.pos+=4)-4));
};

/** @return {number} */
gis.io.NodeStream.prototype.read32B=function() {
	return(this.data.readUInt32BE((this.pos+=4)-4));
};

/** @return {number} */
gis.io.NodeStream.prototype.readFloatL=function() {
	return(this.data.readFloatLE((this.pos+=4)-4));
};

/** @return {number} */
gis.io.NodeStream.prototype.readFloatB=function() {
	return(this.data.readFloatLE((this.pos+=4)-4));
};

/** @return {number} */
gis.io.NodeStream.prototype.readDoubleL=function() {
	return(this.data.readDoubleLE((this.pos+=8)-8));
};

/** @return {number} */
gis.io.NodeStream.prototype.readDoubleB=function() {
	return(this.data.readDoubleBE((this.pos+=8)-8));
};

/** @param {number} count
  * @return {string} */
gis.io.NodeStream.prototype.readChars=function(count) {
	var first;

	first=this.pos;

	// Read bytes, convert to UTF8 string and remove trailing ASCII NUL characters.
	return(this.dec.convert(this.data.slice(first,this.pos+=count)).toString('utf8').replace(/[\0]+$/,''));
};
goog.provide('reach.route.result.OutWalkLeg');
goog.require('reach.route.result.Leg');

/** @constructor
  * @extends {reach.route.result.Leg} */
reach.route.result.OutWalkLeg=function() {
	reach.route.result.Leg.call(this);

	/** @type {Array.<reach.route.result.LegRef>} */
	this.refList=[];

	this.type=reach.route.result.Leg.Type.WALK;
};

reach.inherit(reach.route.result.OutWalkLeg,reach.route.result.Leg);

/** @param {reach.route.result.LegRef} ref */
reach.route.result.OutWalkLeg.prototype.insert=function(ref) {
	var leg;

	leg=/** @type {reach.route.result.WalkLeg} */ (ref.leg);

	this.refList.push(ref);

	this.cost+=leg.cost;
	this.duration+=leg.duration;
	this.dist+=leg.dist;
};

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @param {Array.<reach.MU>} prev
  * @return {Array.<reach.MU>} */
reach.route.result.OutWalkLeg.prototype.getPoints=function(conf,dir,prev) {
	var refList;
	var legNum,legCount;
	var out;

	out=prev;
	if(!out) out=[];

	refList=this.refList;
	legCount=refList.length;
	if(dir==reach.route.result.Leg.Dir.FORWARD) {
		for(legNum=0;legNum<legCount;legNum++) {
			refList[legNum].leg.getPoints(conf,refList[legNum].dir,out);
		}
	} else {
		for(legNum=legCount;legNum--;) {
			refList[legNum].leg.getPoints(conf,refList[legNum].dir,out);
		}
	}

//	if(this.dir!=dir) out.reverse();

	return(out);
};
goog.provide('reach.route.result.Route');
goog.require('reach.route.result.Leg');
goog.require('reach.route.result.OutWalkLeg');

/** @constructor */
reach.route.result.Route=function() {
	/** @type {number} */
	this.cost=0;
	/** @type {number} */
	this.duration=0;
	/** @type {number} */
	this.dist=0;
	/** @type {number} */
	this.tripCount=0;

	/** @type {number} */
	this.totalTime=0;
	/** @type {number} */
	this.sampleCount=1;

	/** @type {number} */
	this.queryTime=0;
	/** @type {number} */
	this.startTime=0;
	/** @type {number} */
	this.endTime=0;
	/** @type {reach.loc.Location} */
	this.srcLoc=null;
	/** @type {reach.loc.Location} */
	this.dstLoc=null;

	/** @type {Array.<reach.route.result.LegRef>} */
	this.refList=[];
	/** @type {Array.<reach.route.result.LegRef>} */
	this.outRefList=[];
};

/** @param {reach.route.result.LegRef} ref */
reach.route.result.Route.prototype.insert=function(ref) {
	this.refList.push(ref);
	this.dist+=ref.leg.dist;
};

reach.route.result.Route.prototype.reverse=function() {
	var refNum;
	var ref;

	this.refList.reverse();
/*
	for(refNum=this.refList.length;refNum--;) {
		ref=this.refList[refNum];
		this.refList[refNum]=new reach.route.LegRef(ref.leg,!ref.dir);
	}
*/
};

/** @param {reach.route.Conf} conf */
reach.route.result.Route.prototype.prepareOutput=function(conf) {
	var refList;
	var refNum,refCount,walkCount;
	var ref,outRef;
	var outLeg;

	outLeg=new reach.route.result.OutWalkLeg();
	outRef=new reach.route.result.LegRef(outLeg,conf.forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD);
	walkCount=0;

	refList=this.refList;
	refCount=refList.length;

	for(refNum=0;refNum<refCount;refNum++) {
		ref=refList[refNum];
		if(ref.leg.type==reach.route.result.Leg.Type.WALK) {
			outLeg.insert(ref);
			if(walkCount==0) outRef.startTime=ref.startTime;
			walkCount++;
		} else {
			if(walkCount>0) {
				this.outRefList.push(outRef);
				outLeg=new reach.route.result.OutWalkLeg();
				outRef=new reach.route.result.LegRef(outLeg,conf.forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD);
				walkCount=0;
			}

			this.outRefList.push(ref);
		}
	}

	if(walkCount>0) this.outRefList.push(outRef);
};

/** @param {reach.route.Conf} conf */
reach.route.result.Route.prototype.print=function(conf) {
	var msg;
	var refList;
	var refNum,refCount;
	var ref;
	var tripLeg;
	var trip;
	var startTime,duration;
	var cost;
	var dist;
	var type;
	var stop;

	msg='';

	refList=this.refList;
	startTime=refList[0].startTime;
	dist=0;
	duration=0;
	cost=0;

	type=reach.route.result.Leg.Type.NONE;

	refCount=refList.length;
	for(refNum=0;refNum<refCount;refNum++) {
		ref=refList[refNum];
		if(ref.leg.type==reach.route.result.Leg.Type.WALK) {
			if(type!=ref.leg.type) startTime=ref.startTime;
			dist+=ref.leg.dist;
			duration+=ref.leg.duration;
			cost+=ref.leg.cost;
//			msg+='\t'+'Cost: '+ref.leg.cost;
//			msg+='\n';
//			if(ref.leg.nodeList) {
//				if(conf.forward) {
//					msg+='\t'+'Check: '+(-(ref.leg.nodeList[ref.leg.nodeList.length-1].cost-ref.leg.nodeList[0].cost));
//				} else {
//					msg+='\t'+'Check: '+(-(ref.leg.nodeList[ref.leg.nodeList.length-1].cost-ref.leg.nodeList[0].cost));
//				}
//				msg+='\n';
//			}
		}

		if(ref.leg.type==reach.route.result.Leg.Type.TRANS || refNum==refCount-1) {
			if(type==reach.route.result.Leg.Type.WALK) {
				msg+=reach.util.formatMins(startTime/60/conf.timeDiv)+'-'+reach.util.formatMins((startTime+duration)/60/conf.timeDiv);
				msg+='\tWALK '+~~(dist+0.5)+'m'+'\t'+cost;
				msg+='\n';
//				if(ref.leg.nodeList) {
//					msg+='\t'+'Check: '+(ref.leg.nodeList[ref.leg.nodeList.length-1].cost-ref.leg.nodeList[0].cost);
//					msg+='\n';
//				}
			}

			if(ref.leg.type==reach.route.result.Leg.Type.TRANS) {
				msg+=reach.util.formatMins(ref.startTime/60/conf.timeDiv)+'-'+reach.util.formatMins((ref.startTime+ref.leg.duration)/60/conf.timeDiv);
				tripLeg=/** @type {reach.route.result.TripLeg} */ ref.leg;
				trip=tripLeg.trip;
				cost=tripLeg.waitCost+ref.leg.cost;
				msg+='\t'+trip.key.longCode+'\t'+~~(ref.leg.dist+0.5)+'m'+'\t'+cost;
				msg+='\n';
//+'\t'+((trip.key.line.stopList[tripLeg.leavePos].cost-trip.key.line.stopList[tripLeg.enterPos].cost)*(conf.forward?1:-1))+'\t'+cost;
//				msg+='\t'+'Costs:'+'\t'+'Wait: '+ref.leg.waitCost+'\t'+'Transit:'+ref.leg.cost;
//				msg+='\n';
//				if(conf.forward) {
//					msg+='\t'+'Check:'+'\t'+'Wait: '+ref.leg.waitCost+'\t'+'Transit:'+(trip.key.line.stopList[tripLeg.leavePos].cost-trip.key.line.costList[tripLeg.enterPos]);
//				} else {
//					msg+='\t'+'Check:'+'\t'+'Wait: '+ref.leg.waitCost+'\t'+'Transit:'+(trip.key.line.stopList[tripLeg.enterPos].cost-trip.key.line.costList[tripLeg.leavePos]-conf.minWait*conf.waitCostMul);
//					msg+='\n'+trip.key.line.stopList[tripLeg.enterPos].cost;
//					msg+='\n'+trip.key.line.costList[tripLeg.leavePos];
//				}
//				msg+='\n';

				stop=trip.key.line.stopList[tripLeg.enterPos];
				msg+=stop.origId+'\t'+stop.name+'\n';
				stop=trip.key.line.stopList[tripLeg.leavePos];
				msg+=stop.origId+'\t'+stop.name+'\n';
			}

			dist=0;
			duration=0;
			cost=0;
		}

		type=ref.leg.type;
	}

	console.log(msg);
};
goog.provide('reach.route.result.ExtraLeg');
goog.require('reach.route.result.Leg');
goog.require('reach.trans.Trip');

/** @constructor
  * @extends {reach.route.result.Leg} */
reach.route.result.ExtraLeg=function(desc) {
	reach.route.result.Leg.call(this);

	/** @type {number} */
	this.startTime=0;
	/** @type {number} */
	this.waitCost=0;
	/** @type {reach.trans.Line} */
	this.extraLine=desc[0];
	/** @type {number} */
	this.enterPos=desc[1];
	/** @type {number} */
	this.leavePos=desc[2];

	this.startTime=desc[3];
	this.duration=desc[4]-desc[3];

	this.type=reach.route.result.Leg.Type.EXTRA;
};

reach.inherit(reach.route.result.ExtraLeg,reach.route.result.Leg);

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @return {Array.<reach.MU>} */
reach.route.result.ExtraLeg.prototype.getPoints=function(conf,dir) {
	var ptList;
	var delta;
	var pos,leavePos;
	var deg;
	var out;

	out=[];
	ptList=this.extraLine.ptList;
	pos=this.enterPos;
	leavePos=this.leavePos;

	if(leavePos>pos) delta=1;
	else delta=-1;

	while(1) {
		out.push(ptList[pos].ll);
		if(pos==leavePos) break;
		pos+=delta;
	}

//	if(this.dir!=dir) out.reverse();

	return(out);
};
goog.provide('reach.route.result.GraphLeg');
goog.require('reach.route.result.Leg');

/** @constructor
  * @extends {reach.route.result.Leg} */
reach.route.result.GraphLeg=function() {
	reach.route.result.Leg.call(this);

	/** @type {Array.<reach.road.Node>} */
	this.nodeList=[];
	/** @type {Array.<number>} */
//	this.timeList=[];
	/** @type {Array.<number>} */
//	this.costList=[];
	/** @type {Array.<number>} */
	this.distList=[];
	/** @type {number} */
	this.nodeCount=0;
	/** @type {boolean} */
//	this.invert=true;

	/** @type {number} */
//	this.time=time;
	/** @type {number} */
//	this.cost=cost;
	/** @type {number} */
//	this.dist=dist;

	this.type=reach.route.result.Leg.Type.WALK;
};

reach.inherit(reach.route.result.GraphLeg,reach.route.result.Leg);

/** @param {reach.road.Node} node
  * @param {number} dist */
reach.route.result.GraphLeg.prototype.insert=function(node,dist) {
	this.distList[this.nodeCount]=dist;
	this.nodeList[this.nodeCount++]=node;
	this.dist+=dist;
};

/** @param {reach.road.Node} node
  * @param {reach.route.Conf} conf */
/*
reach.route.result.GraphLeg.prototype.insert=function(node,conf) {
	var nodeCount;
	var prev;
	var duration;
	var dist;

	nodeCount=this.nodeCount;

	if(nodeCount) {
		prev=this.nodeList[nodeCount-1];
		dist=node.distList[node.followerTbl[prev.id]-1];
		duration=dist*conf.walkTimePerM;

		this.time+=duration;
		this.cost+=duration*conf.walkCostMul;
		this.dist+=dist;
	}

	this.nodeList[nodeCount]=node;
	this.timeList[nodeCount]=this.time;
	this.costList[nodeCount]=this.cost;
	this.distList[nodeCount]=this.dist;

	this.nodeCount++;
};
*/

/*
reach.route.result.GraphLeg.prototype.print=function(conf) {
	var nodeNum,nodeCount;
	var time,cost;
	var dist,totalDist;

	console.log('Walk from '+this.fromStop.name+' ('+this.fromStop.origId+') to '+this.toStop.name+' ('+this.toStop.origId+'):');

	totalDist=dist;
	nodeCount=this.nodeCount;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		time=this.timeList[nodeNum];
		cost=this.costList[nodeNum];
		dist=this.distList[nodeNum];
		if(nodeNum && !dist) continue;
		console.log(reach.util.formatSecs(time/conf.timeDiv)+'\t'+~~(cost+0.5)+'\t'+~~(dist+0.5)+'m');
	}
};

reach.route.result.GraphLeg.prototype.debug=function(conf) {
	var nodeNum,nodeCount;
	var node;
	var deg;
	var out;

	out=[];
	nodeCount=this.nodeList.length;
	if(this.invert) {
		for(nodeNum=nodeCount;nodeNum--;) {
			node=this.nodeList[nodeNum];
			deg=node.ll.toDeg();
			out.push(deg.llon+','+deg.llat+',2');
		}
	} else {
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=this.nodeList[nodeNum];
			deg=node.ll.toDeg();
			out.push(deg.llon+','+deg.llat+',2');
		}
	}

    return(out);
};
*/

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @param {Array.<reach.MU>} prev
  * @return {Array.<reach.MU>} */
reach.route.result.GraphLeg.prototype.getPoints=function(conf,dir,prev) {
	var nodeNum,nodeCount;
	var node;
	var deg;
	var out;

	out=prev;
	if(!out) out=[];

	nodeCount=this.nodeList.length;
	if(dir==reach.route.result.Leg.Dir.FORWARD) {
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			out.push(this.nodeList[nodeNum].ll);
		}
	} else {
		for(nodeNum=nodeCount;nodeNum--;) {
			out.push(this.nodeList[nodeNum].ll);
		}
	}

//	if(this.dir!=dir) out.reverse();

    return(out);
};
goog.provide('reach.route.result.TripLeg');
goog.require('reach.route.result.Leg');
goog.require('reach.trans.Trip');

/** @constructor
  * @param {reach.trans.Trip} trip
  * @extends {reach.route.result.Leg} */
reach.route.result.TripLeg=function(trip) {
	reach.route.result.Leg.call(this);

	/** @type {number} */
	this.startTime=0;
	/** @type {number} */
	this.waitCost=0;
	/** @type {reach.trans.Trip} */
	this.trip=trip;
	/** @type {reach.trans.Line} */
	this.line=trip.key.line;
	/** @type {number} */
	this.enterPos=0;
	/** @type {number} */
	this.leavePos=0;

	this.type=reach.route.result.Leg.Type.TRANS;
};

reach.inherit(reach.route.result.TripLeg,reach.route.result.Leg);

/*
reach.route.result.TripLeg.prototype.print=function(conf) {
	var stopNum,stopCount;
	var stop;
	var time,cost;

	console.log('Enter '+this.trip.key.longCode);

	stopCount=this.stopCount;
	for(stopNum=0;stopNum<this.stopCount;stopNum++) {
		stop=this.stopList[stopNum];
		time=this.timeList[stopNum];
		cost=this.costList[stopNum];

		console.log(reach.util.formatSecs(time/conf.timeDiv)+'\t'+~~cost+'\t'+stop.name+' ('+stop.origId+')');
	}

	console.log('Leave '+this.trip.key.longCode);
};

reach.route.result.TripLeg.prototype.debug=function(conf) {
	var stopList;
	var delta;
	var pos,leavePos;
	var deg;
	var out;

	out=[];
	stopList=this.trip.key.line.stopList;
	pos=this.enterPos;
	leavePos=this.leavePos;

****
	console.log('TRIP '+this.trip.key.longCode);
	stop=stopList[pos];
	console.log(reach.util.formatMins(stop.timeList[0]/60/conf.timeDiv)+'\t'+stop.costList[0]+'\t'+stop.origId+'\t'+stop.name);
	console.log(reach.util.formatMins(this.trip.key.line.timeList[pos]/60/conf.timeDiv)+'\t'+this.trip.key.line.costList[pos]);
	stop=stopList[leavePos];
	console.log(reach.util.formatMins(this.trip.key.line.timeList[leavePos]/60/conf.timeDiv)+'\t'+this.trip.key.line.costList[leavePos]+'\t'+stop.origId+'\t'+stop.name);
	console.log(reach.util.formatMins(stop.timeList[0]/60/conf.timeDiv)+'\t'+stop.costList[0]);

//	console.log(this.trip.key.longCode+'\t'+reach.util.formatMins(this.trip.key.line.timeList[pos]/60/conf.timeDiv)+'\t'+stopList[pos].origId+'\t'+stopList[pos].name+'\t'+reach.util.formatMins(this.trip.key.line.timeList[leavePos]/60/conf.timeDiv)+'\t'+stopList[leavePos].origId+'\t'+stopList[leavePos].name);
//	console.log(reach.util.formatMins(stopList[pos].timeList[0]/60/conf.timeDiv)+'\t'+reach.util.formatMins(this.trip.guessArrival(pos)));
//	console.log(reach.util.formatMins(stopList[pos].timeList[0]/60/conf.timeDiv)+'\t'+reach.util.formatMins(this.trip.key.line.timeList[pos]/60/conf.timeDiv));
var stop;
var i;
for(i=0;i<stopList[leavePos].costList.length;i++) {
stop=stopList[leavePos];
//if(stop.srcTripList[i]) console.log(reach.util.formatMins(stop.timeList[i]/60/conf.timeDiv)+'\t'+stop.costList[i]+'\t'+stop.srcTripList[i].key.longCode);
}
****

	if(leavePos>pos) delta=1;
	else delta=-1;

	while(1) {
		deg=stopList[pos].ll.toDeg();
		out.push(deg.llon+','+deg.llat+',2');
		if(pos==leavePos) break;
		pos+=delta;
	}

	return(out);
};
*/

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @return {Array.<reach.MU>} */
reach.route.result.TripLeg.prototype.getPoints=function(conf,dir) {
	var stopList;
	var delta;
	var pos,leavePos;
	var deg;
	var out;

	out=[];
	stopList=this.trip.key.line.stopList;
	pos=this.enterPos;
	leavePos=this.leavePos;

	if(leavePos>pos) delta=1;
	else delta=-1;

	while(1) {
		out.push(stopList[pos].ll);
		if(pos==leavePos) break;
		pos+=delta;
	}

//	if(this.dir!=dir) out.reverse();

	return(out);
};
goog.provide('reach.route.Batch');
goog.require('reach.route.result.Route');
goog.require('reach.route.result.GraphLeg');
goog.require('reach.route.result.TripLeg');
goog.require('reach.route.result.ExtraLeg');

/** @constructor
  * @param {reach.road.Net} net
  * @param {reach.trans.City} city */
reach.route.Batch=function(net,city) {
	/** @type {reach.road.Net} */
	this.net=net;
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {boolean} */
	this.routing=false;
	/** @type {Object.<string,reach.route.result.Route>} */
	this.result=null;
};

/** @param {reach.task.Task} task
  * @param {reach.loc.EventSet} eventSet
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Conf} conf
  * @return {function():number} */
reach.route.Batch.prototype.bindPoints=function(task,eventSet,dijkstra,conf,discardRoutes) {
	/** @type {reach.route.Batch} */
	var self=this;
//	var eventNum;
	var retryCount;
	var bindRunId;
	/** @type {number} */
	var step;
	/** @type {{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}} */
	var event;
	var wayFinder;
	/** @type {number} */
	var graphNodeCount;
	/** @type {number} */
	var stopCount;

	/** @enum {number} */
	var steps={
		init:0,
		nextEvent:1,
		findTile:2,
		findWay:3,
		bindNode:4,
		initRouting:5,
		route:6
	};

	/** @param {reach.road.Tile} tile */
	var loadTile=function(tile) {
		tile.load(task,null,
			/** @param {reach.road.Tile} tile */
			function(tile) {
				task.unblock();
			}
		);
	};

	/** @return {number} */
	var advance=function() {
		var ll;
		var tile;
		var dist;
		var node;
		var ret;
		var nearest;
		var way;
		var e;
		var areaList;
		var areaNum;
		var area;
		var llSW,llNE;
		var edgeS,edgeW,edgeN,edgeE;
		var lat,lon;
		var grain,mask;

		// TODO: when binding is retried, all found direct walking connections must be invalidated, unless retry
		// is disabled also when walks are found (which perhaps makes more sense).

		switch(step) {
			// Initialize.
			case steps.init:
				step++;

//				eventNum=0;

				step=steps.nextEvent;
//				return(eventSet.count-eventNum);

			case steps.nextEvent:
				e=eventSet.getNext();
				if(!e) return(0);
				event=e;
//console.log(event.pt.id);
//console.log(event.pt);
//console.log(event.type);
//console.log(event);

				// Clear counter for how many times input point was connected to a new road, when the initial
				// location wasn't reachable from any stops.
				retryCount=0;

//console.log(event.type+' '+eventNum+' '+eventSet.count);
				// Check if an input point is walking distance away in the future, so it should be bound to the
				// road network in case a direct walk is the fastest route.
				if(event.type==reach.loc.EventSet.Type.BIND) step=steps.findTile;

				// Most important event type that everything else is scheduled for: find walking routes from input
				// point to stops and other input points, connecting input point to the routing graph.
				if(event.type==reach.loc.EventSet.Type.WALK) {
					bindRunId=dijkstra.runId;
					step=steps.initRouting;
					console.log('Finding roads from '+event.pt.id);
					break;
				}

				// All road data in a tile can be freed after it's more than walking distance away behind current
				// input point to walk from.
				if(event.type==reach.loc.EventSet.Type.FREE) {
					event.tile.freeGeometry();
					break;
				}

			case steps.findTile:
//console.log('LOAD');
				ll=event.pt.ll;
				tile=self.net.tree.findTile(ll,0);
				if(!tile.isLeaf) {
					step=steps.nextEvent;
					break;
				}
				if(!tile.loaded) {
//console.log(tile.path+'\t'+ll.toDeg());
					loadTile(tile);
					return(task.block());
				}
//console.log('LOADED');

				areaList=tile.areaList;
				if(areaList.length>0) {
console.log('AREA '+event.pt.id);
					node=null;
					lat=ll.llat;
					lon=ll.llon;
					grain=self.net.areaGrain;
					mask=grain-1;

					for(areaNum=areaList.length;areaNum--;) {
						area=areaList[areaNum];
						llSW=area.boundSW;
						llNE=area.boundNE;
						if(lat>llSW.llat && lon>llSW.llon && lat<llNE.llat && lon<llNE.llon) {
							edgeS=(~~llSW.llat+mask)&~mask;
							edgeW=(~~llSW.llon+mask)&~mask;
							edgeN=~~llNE.llat&~mask;
							edgeE=~~llNE.llon&~mask;

							if(lat<edgeS) lat=edgeS;
							if(lat>edgeN) lat=edgeN;
							if(lon<edgeW) lon=edgeW;
							if(lon>edgeE) lon=edgeE;

							lat=(lat+grain/2)&~mask;
							lon=(lon+grain/2)&~mask;
							key=lat+'\t'+lon;
							node=self.net.areaNodeTbl[key];
							if(node) break;

							lat=ll.llat;
							lon=ll.llon;
						}
					}

					if(node) {
						if(!discardRoutes) {
							leg=new reach.route.result.WalkLeg();
							leg.startNode=node;
							leg.endLoc=event.pt;

							event.pt.addWalk(leg,reach.loc.Outdoor.Type.GRAPH,conf.forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD);
							node.addWalk(leg,conf.forward?reach.route.result.Leg.Dir.FORWARD:reach.route.result.Leg.Dir.BACKWARD);
						}

						step=steps.nextEvent;
						break;
					}
				}

				node=tile.insertNode(ll,reach.road.Tile.Persist.QUERY);
				// If the node is not yet connected to anything, it has been added now for routing purposes only.
				// Set flag so it won't be used to route across otherwise unconnected parts of the road network.
				if(node.wayList.length==0) node.routing=true;
				// Store found node so it can be used to start walking to find nearby points.
				event.pt.node=node;

				// Make sure the node remains for the duration of this routing query, when tile geometry is freed
				// (in case it's needed for showing result). TODO: check if this is needed.
				self.net.tree.setNodePersist(node,reach.road.Tile.Persist.QUERY);

				// Check if node is already connected to the road network.
				if(node.wayList.length!=0) {
					step=steps.bindNode;
					break;
				}

				// TODO: findWay shouldn't cross water or other ways with runId>bindRunId.
				wayFinder=self.net.tree.findWay(ll,loadTile,0,conf.snapDist);
				step=steps.findWay;

			case steps.findWay:
				nearest=wayFinder();
				if(!nearest) {
					// Will be unblocked by loadTile when loading finishes.
					return(task.block());
				}
				if(!nearest.way) {
					// Clear debug stuff.
//					if(reach.env.platform==reach.env.Type.BROWSER) globalMap.routeLayer.removeAllFeatures();

					// A way was not found within snap distance.
//					eventNum++;
					step=steps.nextEvent;
					break;
				}

				// Debug stuff, draw boxes around nodes and other coordinates.
/*
				if(reach.env.platform==reach.env.Type.BROWSER && nearest.nodePrev && nearest.nodeNext) {
					var walkStyle,geomStyle,nodeStyle;
					var map=globalMap;
					var ptList;
					var llMap;

					document.getElementById('debug').innerHTML=nearest.distPrev+' '+nearest.distNext;
					walkStyle={'strokeColor':'#ff0000','strokeOpacity':1,'strokeWidth':4};
					geomStyle={'strokeColor':'#ff0000','strokeOpacity':1,'strokeWidth':2,'fillColor':'#000000'};
					nodeStyle={'strokeColor':'#ff0000','strokeOpacity':1,'strokeWidth':2,'fillColor':'#0000ff'};

					map.routeLayer.removeAllFeatures();

					ptList=[];
//					ll=nearest.nodePrev.ll.toDeg().toGoog();
					llMap=event.pt.ll.toDeg().toGoog();
					ptList.push(new OpenLayers.Geometry.Point(llMap.llon,llMap.llat));
					llMap=nearest.ll.toDeg().toGoog();
					ptList.push(new OpenLayers.Geometry.Point(llMap.llon,llMap.llat));
//					ll=nearest.nodeNext.ll.toDeg().toGoog();
//					ptList.push(new OpenLayers.Geometry.Point(ll.llon,ll.llat));
					map.routeLayer.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(ptList),null,walkStyle)]);

					var iterator=nearest.way.iterateNodes();
					while(ll=iterator.next()) {
						ll=ll.toDeg().toGoog();
						map.routeLayer.addFeatures([
							new OpenLayers.Feature.Vector(
								OpenLayers.Geometry.Polygon.createRegularPolygon(
									new OpenLayers.Geometry.Point(ll.llon,ll.llat),5,4
								),
								null,iterator.mark()?nodeStyle:geomStyle
							)
						]);
					}
				}
*/
				ll=event.pt.ll;

				// Get distance in meters as the crow flies to the nearest road. Cannot use nearest.dist directly because it's in nonsense units.
				dist=ll.distTo(nearest.ll);

				// Connect to road network.
				way=self.net.tree.insertWay([ll,nearest.nodePrev.ll],'routing','',reach.road.Way.Access.WALK,reach.road.Tile.Persist.QUERY);
				// A straight line was generated but a more accurate walking distance can be attached to it.
				if(way) way.nodeDistList[1]=nearest.distPrev+dist;
				way=self.net.tree.insertWay([ll,nearest.nodeNext.ll],'routing','',reach.road.Way.Access.WALK,reach.road.Tile.Persist.QUERY);
				if(way) way.nodeDistList[1]=nearest.distNext+dist;

				step=steps.bindNode;

			case steps.bindNode:
				if(!retryCount) {
					// Binding the point to the road network was successful so move to the next point.
//					eventNum++;
					step=steps.nextEvent;
					break;
				}

				// Coming here after not finding any nearby stops, it's time to retry routing after connecting to a different road.
				// TODO: the alternative road should be selected so that the direct line to it doesn't cross other reasonable roads.
				step=steps.initRouting;

			case steps.initRouting:
				node=event.pt.node;

				if(!node) {
					// A nearby way was never found for this input point.
//					eventNum++;
					step=steps.nextEvent;
					break;
				}

				graphNodeCount=0;
				stopCount=0;

				if(!discardRoutes) {
					/** @param {reach.route.Dijkstra} dijkstra
					  * @param {reach.route.WayVisitor} visitor
					  * @param {reach.road.Node} node */
					dijkstra.onVisitGraphNode=function(dijkstra,visitor,node) {
//						var setType;
//						var locType;
						var leg;

						graphNodeCount++;
						if(graphNodeCount<conf.nodeNearMax) {
//							setType=event.pt.inputSet.mode;
//							if(setType==reach.loc.InputSet.Type.SRC) loctype=reach.loc.Outdoor.Type.SRC;
//							if(setType==reach.loc.InputSet.Type.DST) loctype=reach.loc.Outdoor.Type.DST;

							leg=visitor.getLeg(conf);
							leg.startNode=node;
							leg.endLoc=event.pt;

							event.pt.addWalk(leg,reach.loc.Outdoor.Type.GRAPH,conf.forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD);
							node.addWalk(leg,conf.forward?reach.route.result.Leg.Dir.FORWARD:reach.route.result.Leg.Dir.BACKWARD);
						} else if(stopCount>=conf.stopNearMax) {
							dijkstra.stop();
						}
					}
				}

				/** @param {reach.route.Dijkstra} dijkstra
				  * @param {reach.route.WayVisitor} visitor
				  * @param {reach.trans.Stop} stop
				  * @param {reach.road.Node} node */
				dijkstra.onVisitStopNode=function(dijkstra,visitor,node,stop) {
//					var setType;
//					var locType;
					var leg;

					stopCount++;
					if(stopCount<conf.stopNearMax) {
						if(!discardRoutes) {
//							setType=event.pt.inputSet.mode;
//							if(setType==reach.loc.InputSet.Type.SRC) loctype=reach.loc.Outdoor.Type.SRC;
//							if(setType==reach.loc.InputSet.Type.DST) loctype=reach.loc.Outdoor.Type.DST;

							leg=visitor.getLeg(conf);
							leg.startNode=node;
							leg.endLoc=event.pt;

							event.pt.addWalk(leg,reach.loc.Outdoor.Type.GRAPH,conf.forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD);
							node.addWalk(leg,conf.forward?reach.route.result.Leg.Dir.FORWARD:reach.route.result.Leg.Dir.BACKWARD);
						}
					} else if(graphNodeCount>=conf.nodeNearMax) {
						dijkstra.stop();
					}
				};

				dijkstra.startWayNode(node,conf,loadTile);

				step=steps.route;

			case steps.route:
				do ret=dijkstra.step(); while(!ret);
				if(ret==-1) return(-eventSet.count-1);

				dijkstra.onVisitGraphNode=null;
				dijkstra.onVisitStopNode=null;

console.log(event.pt.id+'\t'+stopCount);
//				console.log(stopCount+' stops found.');
				if(stopCount<conf.stopNearMin) {
					// TODO: Check niceDepartures to see if found stops should count.
					if(dijkstra.finalCost<dijkstra.maxCost) {
						// Retry if too few stops were found and it wasn't even possible to walk the maximum allowed distance.
						if(retryCount++<conf.bindRetryMax) {
							wayFinder=self.net.tree.findWay(event.pt.ll,loadTile,bindRunId,conf.snapDist);
							step=steps.findWay;
							break;
						}
					} else {
						// TODO: Since few stops were found but it was possible to walk quite far, it would be good to bind straight
						// into the abstract road graph if those nodes were found.
					}
				}

//				eventNum++;
				step=steps.nextEvent;
				break;
		}

		return(eventSet.count+1);
	};

	this.routing=true;
	step=steps.init;
	return(advance);
};

/** @param {reach.task.Task} task
  * @param {reach.loc.InputSet} srcPtSet
  * @param {reach.loc.InputSet} dstPtSet
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Conf} conf
  * @return {function():number} */
reach.route.Batch.prototype.findRoutes=function(task,srcPtSet,dstPtSet,dijkstra,updateResults,conf) {
	/** @type {reach.route.Batch} */
	var self=this;
	var step;
	var srcCount,dstCount;
	var timeList;
	var timeNum,timeCount;
	var startTime;
	var startList;
	var startNum,startCount;
	var endList;
	var endNum,endCount,foundCount;
	/** @type {Object.<string,reach.route.result.Route>} */
	var bestRouteTbl;

	/** @enum {number} */
	var steps={
		init:0,
		setTime:1,
		nextSrc:2,
		forward:3
	};

	var advance=function() {
		var i;
		var ret;
		var remain;
		var route,bestRoute;
		var loc;
		var memUsed;

		switch(step) {
			// Initialize.
			case steps.init:
				timeList=conf.timeList;
				timeList.sort();
				timeCount=timeList.length;
				timeNum=0;

var nodeList;
var nodeCum,nodeCount;
var node;
nodeList=self.net.graph.nodeList;
nodeCount=nodeList.length;
for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
	node=nodeList[nodeNum];
	if(!node) continue;
// TODO: following line should be run from oikotie3-main.sh, otherwise not!!!
//	node.timeSum=0;
}

				srcCount=srcPtSet.list.length;
				dstCount=dstPtSet.list.length;

				if(conf.forward) {
					startList=srcPtSet.list;
					startCount=srcCount;
					endList=dstPtSet.list;
					endCount=dstCount;
				} else {
					startList=dstPtSet.list;
					startCount=dstCount;
					endList=srcPtSet.list;
					endCount=srcCount;
				}

				startCount=startList.length;
				endCount=endList.length;

				bestRouteTbl=/** @type {Object.<string,reach.route.result.Route>} */ {};

				// TODO: remove line below!!!
//				self.city.lineSet.calcNiceness(8*60);
				step=steps.setTime;

			case steps.setTime:
				startTime=timeList[timeNum];
				console.log('Start time '+reach.util.formatMins(startTime/60/conf.timeDiv));
				// TODO: uncomment line below!!!
				self.city.lineSet.calcNiceness(startTime/60/conf.timeDiv,conf.niceDepartureSpan);
//				self.city.lineSet.calcNiceness(8*60);
				startNum=0;

				step=steps.nextSrc;

			case steps.nextSrc:
				memUsed=0;

				if(typeof(window)!='undefined' && window.performance && window.performance.memory) memUsed=window.performance.memory.usedJSHeapSize;
				if(typeof(process)!='undefined' && process.memoryUsage) memUsed=process.memoryUsage()['heapUsed'];

				// TODO: check direct walk routes. Only needed if start and end point are connected to the same way or at least one is connected to a way
				// with no graph points around it both directions in next intersections.
				console.log('Routes for '+startList[startNum].id+', heap now '+~~(memUsed/1024/1024+0.5)+' megs.');
				/** @param {reach.route.Dijkstra} dijkstra
				  * @param {reach.route.LocVisitor} visitor
				  * @param {reach.loc.Location} loc */
				dijkstra.onVisitLoc=function(dijkstra,visitor,loc) {
					if(	(conf.forward && loc.inputSet.mode==reach.loc.InputSet.Type.DST) ||
						(!conf.forward && loc.inputSet.mode==reach.loc.InputSet.Type.SRC)) {
						foundCount++;
//						if(foundCount==endCount) dijkstra.stop();
					}

//					if(loc.inputSet.mode==reach.loc.InputSet.Type.EXTRA) {
//						console.log('KUKKUU');
//						console.log(loc);
//					}
				};

				foundCount=0;
				// TODO: check that type point is of type outdoor!
				loc=/** @type {reach.loc.Outdoor} */ (startList[startNum]);
				dijkstra.startOutdoor(loc,startTime,conf.forward?reach.route.Dijkstra.Dir.FORWARD:reach.route.Dijkstra.Dir.BACKWARD,conf);

				step=steps.forward;

			case steps.forward:
				// Do 20 routing steps.
				i=20;
				do ret=dijkstra.step(); while(!ret && i--);
				// Dijkstra can never block this task since all needed data is already loaded.
				if(!ret) break;

				dijkstra.onVisitLoc=null;


var nodeList;
var nodeCum,nodeCount;
var node;
nodeList=self.net.graph.nodeList;
nodeCount=nodeList.length;
for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
	node=nodeList[nodeNum];
	if(!node) continue;
// TODO: following lines should be run from oikotie3-main.sh, otherwise not!!!
//	if(node.runId==dijkstra.runId && node.time) node.timeSum+=node.time-startTime;
//	else node.timeSum=parseInt('');
}

if(timeNum+1>=timeCount) {
for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
	node=nodeList[nodeNum];
	if(!node || isNaN(node.timeSum)) continue;
// TODO: following line should be run from oikotie3-main.sh, otherwise not!!!
//	console.log('avg\t'+node.ll.llat+'\t'+node.ll.llon+'\t'+~~(node.timeSum/timeCount/conf.timeDiv/60+0.5));
}
}

				for(endNum=0;endNum<endCount;endNum++) {
					if(conf.forward) bestRoute=bestRouteTbl[startNum+'\t'+endNum];
					else bestRoute=bestRouteTbl[endNum+'\t'+startNum];

//					console.log('Route to '+endList[endNum].id+'...');
					route=self.getRoute(endList[endNum],startTime,dijkstra,conf,startNum,endNum,startList[startNum]);
					if(!route) continue;
					// Add an extra second or so of cost for each minute of later departure/arrival,
					// so it won't choose a later route for no reason.
					if(conf.forward) route.cost+=~~((timeList[timeNum]-timeList[0])*conf.bracketWaitCostMul);
					else route.cost+=~~((timeList[timeList.length-1]-timeList[timeNum])*conf.bracketWaitCostMul);
//console.log(route.srcLoc.id+' '+route.dstLoc.id+' '+route.cost);

					if(bestRoute) {
						bestRoute.totalTime+=route.totalTime;
						bestRoute.sampleCount+=route.sampleCount;
						route.totalTime=bestRoute.totalTime;
						route.sampleCount=bestRoute.sampleCount;
					}

					if(!bestRoute || route.cost<bestRoute.cost) {
						if(conf.forward) bestRouteTbl[startNum+'\t'+endNum]=route;
						else bestRouteTbl[endNum+'\t'+startNum]=route;
					}

//					console.log('Cost '+(route.cost));
//					route.print(conf);
				}

				if(updateResults) updateResults(timeNum,startNum,timeList[timeNum],conf);

				startNum++;
				if(startNum<startCount) step=steps.nextSrc;
				else {
					timeNum++;
					// Careful here, forgetting startNum=0 means remain below goes to 0 too early and last time step is dropped.
					startNum=0;
					step=steps.setTime;
				}

				break;
		}

		remain=(timeCount-timeNum-1)*startCount+startCount-startNum;
		if(!remain) {
			self.routing=false;

			for(startNum=0;startNum<srcCount;startNum++) {
				for(endNum=0;endNum<dstCount;endNum++) {
					route=bestRouteTbl[startNum+'\t'+endNum];
					if(route) route.prepareOutput(conf);
				}
			}

			self.result=bestRouteTbl;
//console.log(globalVisitorStats);
			return(0);
		}

		return(remain);
	}

	step=steps.init;
	return(advance);
};

/** @param {reach.loc.Location} endPt
  * @param {number} startTime
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Conf} conf
  * @param {number} startNum
  * @param {number} endNum
  * @param {reach.loc.Location} startPt
  * @return {reach.route.result.Route} */
reach.route.Batch.prototype.getRoute=function(endPt,startTime,dijkstra,conf,startNum,endNum,startPt) {
	var route;
	var forward;
	var walkList;
	var walkNum,walkCount;
	var walkLeg;
	var walkRef,bestWalkRef,ref;
	var cost,bestCost,costDiff;
	var node;
	var stop;
	var graphLeg;
	var tripLeg;
	var tripLegCount;
	var startLoc,endLoc;
	var extraLeg;

	route=new reach.route.result.Route();
	route.queryTime=startTime;

	// TODO: check that points are of type outdoor!
	startLoc=/** @type {reach.loc.Outdoor} */ startPt;
	endLoc=/** @type {reach.loc.Outdoor} */ endPt;

	forward=conf.forward;
	if(forward) {
		route.srcLoc=startLoc;
		route.dstLoc=endLoc;
	} else {
		route.srcLoc=endLoc;
		route.dstLoc=startLoc;
	}

	walkList=endLoc.walkList[reach.loc.Outdoor.Type.GRAPH];
	if(!walkList) {
//		console.log('Cannot walk from target '+endLoc.id+'.');
		return(null);
	}

	bestWalkRef=null;
	bestCost=0;

	walkCount=walkList.length;
	for(walkNum=0;walkNum<walkCount;walkNum++) {
		walkRef=walkList[walkNum];
		walkLeg=/** @type {reach.route.result.WalkLeg} */ (walkRef.leg);

		if(walkLeg.startNode.runId!=dijkstra.runId) continue;
		if(!walkLeg.cost || !walkLeg.startNode.cost) continue;

		cost=walkLeg.cost+walkLeg.startNode.cost;

		if(!bestWalkRef || cost<bestCost) {
			bestWalkRef=walkRef;
			bestCost=cost;
		}
	}

	if(!bestWalkRef) {
//		console.log('Cannot walk from target.');
		return(null);
	}
	route.cost=bestCost;

	walkRef=bestWalkRef.copy();
	walkRef.dir=forward?reach.route.result.Leg.Dir.FORWARD:reach.route.result.Leg.Dir.BACKWARD;
	route.insert(walkRef);
	// TODO: leave the following out from here?
//	if(forward) walkLeg.startTime=walkLeg.startNode.time;
	// If !forward then we can't know the time yet, it depends on the last transit arrival.

	walkLeg=/** @type {reach.route.result.WalkLeg} */ (walkRef.leg);
	tripLegCount=0;
	node=walkLeg.startNode;
	while(node) {
		if(node.srcExtra) {
			extraLeg=new reach.route.result.ExtraLeg(node.srcExtra);
			ref=new reach.route.result.LegRef(extraLeg,forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD);
			ref.startTime=extraLeg.startTime;
			ref.duration=extraLeg.duration;
			route.insert(ref);
			node=node.srcNode;
		} else if(node.srcNode) {
			graphLeg=this.getGraphLeg(node,conf);
			route.insert(new reach.route.result.LegRef(graphLeg,forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD));
			if(!graphLeg) break;
			node=graphLeg.nodeList[graphLeg.nodeCount-1];
		} else if(node.srcStop) {
			stop=node.srcStop;
			while(stop) {
				if(stop.srcNodeList && stop.srcNodeList[0]) {
					if(stop.srcNodeList[0]!=node) node=stop.srcNodeList[0];
					else {
						// There's a loop in the route...
						console.log('Loop detected in '+stop.origId+' '+stop.name);
						node=null;
					}
					break;
				}
				tripLeg=this.getTripLeg(stop,forward,conf);
				if(!tripLeg) {
					console.log('Error in trip.');
					node=null;
					break;
				}
				stop=tripLeg.trip.key.line.stopList[forward?tripLeg.enterPos:tripLeg.leavePos];

				route.insert(new reach.route.result.LegRef(tripLeg,forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD));
				tripLegCount++;
			}
			if(!node) break;
		} else break;
	}

	if(!node) {
		console.log('Cannot walk from source.');
		return(null);
	}
	if(!node.firstWalk || (/** @type {reach.route.result.WalkLeg} */ (node.firstWalk.leg)).endLoc!=startLoc) {
//console.log(route);
		console.log('Cannot walk from source.');
		return(null);
	}

	route.insert(node.firstWalk.copy());
	if(forward) route.reverse();

	route.tripCount=tripLegCount;
	cost=this.calcTimes(route,startTime,tripLegCount,forward,conf);
	if(conf.forward) {
		ref=route.refList[0];
		// Subtract time spent waiting at source location.
		route.cost-=(ref.startTime-startTime)*conf.waitCostMul;
	} else {
		ref=route.refList[route.refList.length-1];
		// Subtract time spent waiting at target location.
		route.cost-=(startTime-(ref.startTime+ref.leg.duration))*conf.waitCostMul;
		if(tripLegCount) route.cost-=(conf.minWait-conf.firstWait)*conf.waitCostMul;
//		console.log(reach.util.formatMins(startTime/60/conf.timeDiv)+' '+reach.util.formatMins((ref.startTime+ref.leg.duration)/60/conf.timeDiv));
	}
	costDiff=cost-route.cost;
	if(costDiff<0) costDiff=-costDiff;
//	reach.util.assert(costDiff<10,'Batch.getRoute','Route cost mismatch '+~~(cost+0.5)+' != '+~~(route.cost+0.5));
//	if(costDiff>=10) route.print(conf);

//	console.log(costDiff);

	return(route);
};

/** @param {reach.road.Node} node
  * @param {reach.route.Conf} conf
  * @return {?reach.route.result.GraphLeg} */
reach.route.Batch.prototype.getGraphLeg=function(node,conf) {
	var leg;
	var dist;
	var prev;
	var stop;

	leg=new reach.route.result.GraphLeg();
	dist=0;
	prev=null;

	// Keep searching unless a loop is found.
	while(node && node!=prev) {
//console.log(node);
		leg.insert(node,dist);

		if(node.srcExtra) {console.log('foo');break;}
		prev=node;
		dist=node.srcDist;
		stop=node.srcStop;
		node=node.srcNode;

		// Handle the impossible weirdness that a node was reached from a stop, reached from another node.
		if(!node && stop && stop.srcNodeList) node=stop.srcNodeList[0];
	}

//console.log(node);
	leg.duration=leg.dist*conf.walkTimePerM;
	leg.cost=leg.duration*conf.walkCostMul;

	/*
		To reverse:
		leg.nodeList.reverse();
		leg.distList.push(0);
		leg.distList.reverse();
		leg.distList.pop();
	*/

	return(leg);
};

/** @param {reach.trans.Stop} stop
  * @param {boolean} forward
  * @param {reach.route.Conf} conf
  * @return {?reach.route.result.TripLeg} */
reach.route.Batch.prototype.getTripLeg=function(stop,forward,conf) {
	var leg;
	var trip;
	var line;
	var pos,delta;
	var stopCount;
	var enterTime,leaveTime;
	var prevStop;
	var dist;

	if(!stop.srcTripList) return(null);
	trip=stop.srcTripList[0];
	pos=stop.srcPosList[0];
	if(!trip) return(null);
	line=trip.key.line;

	// Check if there's a loop in the route.
	if(line.srcStopList[pos]) return(null);

	leg=new reach.route.result.TripLeg(trip);
	if(forward) leg.leavePos=pos;
	else leg.enterPos=pos;

	stopCount=line.stopList.length;
	delta=forward?-1:1;
	dist=0;

	while(!line.srcStopList[pos]) {
		pos+=delta;
		if(pos<0 || pos>=stopCount) return(null);
		prevStop=line.stopList[pos];
		dist+=stop.ll.distTo(prevStop.ll);
		stop=prevStop;
	}

	if(forward) leg.enterPos=pos;
	else leg.leavePos=pos;

	enterTime=trip.guessArrival(leg.enterPos)*60*conf.timeDiv;
	leaveTime=trip.guessArrival(leg.leavePos)*60*conf.timeDiv;

	leg.startTime=enterTime;
	if(forward) {
		leg.cost=(leaveTime-enterTime)*trip.getTransitCost(conf)+trip.getTransferCost(leg.leavePos,false,conf);
		leg.waitCost=trip.getTransferCost(leg.enterPos,true,conf);
	} else {
//		leg.cost=(leaveTime-enterTime)*trip.getTransitCost(conf)+trip.getTransferCost(leg.enterPos,true,conf)+conf.minWait*conf.waitCostMul;
		leg.cost=(leaveTime-enterTime)*trip.getTransitCost(conf)+trip.getTransferCost(leg.enterPos,true,conf);
		leg.waitCost=trip.getTransferCost(leg.leavePos,false,conf);
	}
	leg.cost+=(leg.leavePos-leg.enterPos)*conf.transitCostAdd;
	leg.duration=leaveTime-enterTime;
	leg.dist=dist;

	return(leg);
};

/** @param {reach.route.result.Route} route
  * @param {number} startTime
  * @param {number} tripLegCount
  * @param {boolean} forward
  * @param {reach.route.Conf} conf
  * @return {number} Total route cost to compare against route.cost for debugging. Minor differences are acceptable. */
reach.route.Batch.prototype.calcTimes=function(route,startTime,tripLegCount,forward,conf) {
	var refList;
	var refNum,refCount;
	var refFirst;
	var refTime,time;
	var ref;
	var leg;
	var trip;
	var tripLeg;
	var realCost;
	var cost;

	refList=route.refList;
	refCount=refList.length;
	refTime=0;

	if(tripLegCount) {
		for(refNum=0;refNum<refCount;refNum++) {
			leg=refList[refNum].leg;
			if(leg.type==reach.route.result.Leg.Type.TRANS) {
				tripLeg=/** @type {reach.route.result.TripLeg} */ leg;
				tripLeg.waitCost+=conf.firstWait*conf.waitCostMul;
				trip=tripLeg.trip;
				refTime=tripLeg.startTime;
				refFirst=refNum;
				break;
			} else if(leg.type==reach.route.result.Leg.Type.EXTRA) {
				trip={getTransferTime:function() {return(0);}};
				refTime=leg.startTime;
				refFirst=refNum;
				break;
			}
		}

		time=refTime-trip.getTransferTime(true,conf)-conf.firstWait;
	} else {
		if(forward) {
			refFirst=0;
		} else refFirst=refCount;

		refTime=startTime;
		time=refTime;
	}

	cost=0;

	// Fill start times for walk legs before first transit trip.
	for(refNum=refFirst;refNum--;) {
		ref=refList[refNum];
		leg=ref.leg;

		time-=leg.duration;
		ref.startTime=time;

		cost+=leg.cost;
	}

	time=refTime;

	// Fill start times for following legs.
	for(refNum=refFirst;refNum<refCount;refNum++) {
		ref=refList[refNum];
		leg=ref.leg;
		if(leg.type==reach.route.result.Leg.Type.TRANS) {
			tripLeg=/** @type {reach.route.result.TripLeg} */ leg;
			// +2 comes from the cost=1 transitions between stops and nodes at both ends of the trip.
			tripLeg.waitCost+=(tripLeg.startTime-time)*conf.waitCostMul+2;
			cost+=tripLeg.waitCost;
//			cost+=(tripLeg.leavePos-tripLeg.enterPos)*conf.transitCostAdd;

			trip=tripLeg.trip;
			time=tripLeg.startTime;
			ref.startTime=time;
			time+=trip.getTransferTime(false,conf);

			if(conf.forward) {
				realCost=trip.key.line.stopList[tripLeg.leavePos].cost-trip.key.line.costList[tripLeg.enterPos];
			} else {
				realCost=trip.key.line.stopList[tripLeg.enterPos].cost-trip.key.line.costList[tripLeg.leavePos]-conf.minWait*conf.waitCostMul;
			}

//			reach.util.assert(~~(ref.leg.cost+0.5)==~~(realCost+0.5),'Batch.calcTimes','Leg cost mismatch '+~~(ref.leg.cost+0.5)+' != '+~~(realCost+0.5));
		} else if(leg.type==reach.route.result.Leg.Type.WALK || leg.type==reach.route.result.Leg.Type.EXTRA) {
			ref.startTime=time;
		}

		cost+=leg.cost;
		time+=leg.duration;
	}

	route.startTime=route.refList[0].startTime;
	route.duration=time-route.startTime;

	if(forward) route.totalTime=route.startTime+route.duration-route.queryTime;
	else route.totalTime=route.queryTime-route.startTime;

	return(cost);
};
goog.provide('main');
goog.require('reach.Obj');
goog.require('reach.util');
goog.require('reach.MU');
goog.require('reach.srid');
goog.require('reach.core.Opt');
goog.require('reach.task.Task');
goog.require('reach.control.Dispatch');
goog.require('reach.control.ModelTasks');
goog.require('reach.loc.InputSet');
goog.require('reach.loc.EventSet');
goog.require('reach.route.Dijkstra');
goog.require('reach.route.Batch');
goog.require('reach.out.KML');
goog.require('reach.out.AVG');
goog.require('gis.io.NodeStream');
goog.require('gis.format.Shp');

var globalBestCost={};
var globalBestRoute={};

var srid;

if(reach.env.platform==reach.env.Type.NODE) {
	// Node.js modules.
	path=require('path');
	fs=require('fs');
	try {
		Iconv=require('iconv')['Iconv'];
	} catch(e) {
	}
	//proc=require('child_process');
	//Buffer=require('buffer').Buffer;
	eval(fs.readFileSync(path.resolve(path.dirname(require.main.filename),'proj4js-compressed.js'),'ascii'));

	srid=new reach.srid();
	for(var sridName in srid) {
		if(!srid.hasOwnProperty(sridName)) continue;
		Proj4js.defs[sridName]=srid[sridName];
	}
}

// Global variables for debugging only.
/** @type {reach.map.OpenLayers} */
var globalMap=null;
/** @type {reach.route.Dijkstra} */
var globalDijkstra=null;

//if(typeof(window)=='undefined') window={};
//if(!window.performance) window.performance={memory:{usedJSHeapSize:0}};

var init=function() {
	/** @type {reach.control.Dispatch} */
	var dispatch;
	var map;
	var marker;
	var startPt,endPt;
	/** @type {reach.loc.InputSet} */
	var srcPtSet;
	/** @type {reach.loc.InputSet} */
	var dstPtSet;
	/** @type {reach.loc.InputSet} */
	var extraPtSet;
	/** @type {reach.loc.EventSet} */
	var eventSet;
	var dijkstra;
	/** @type {reach.route.Batch} */
	var batch;
	var city;
	/** @type {reach.road.Net} */
	var net;
	var conf;
	var routeTask;
	var startLoc,endLoc;
	var opt;
	var args;
	var outList;

	if(reach.env.platform==reach.env.Type.NODE) {
		args=process.argv;
	} else {
		args=[null,null,'start.txt','end.txt','--base-path','.'];
	}

	opt=new reach.core.Opt(args,{
		base:['base-path','PATH','..','Directory containing routes, schedules and map tiles'],
		conf:['c|conf','FILE','conf.json','Path to configuration file in JSON format'],
		date:['d|date','DATE',null,'Date for routing calculations in yyyy-mm-dd format'],
		extra:['e|extra','FILE',null,'ESRI Shapefile containing additional transit lines'],
		freq:['f|frequency','MINS',10,'Frequency in minutes of additional transit lines'],
		outAVG:['out-avg','FILE',null,'Output long format CSV file'],
		outKML:['out-kml','FILE',null,'Output KML file'],
//		shpout:['s|shpout','FILE',null,'Output SHP file'],
//		verbose:['v|verbose',null,null,'Print more details'],
//		stops:['stops','LIST',null,'Print cost of a predefined route'],
//		nostops:['nostops','LIST',null,'Disable some stops'],
		src:['src','SOURCE','start.txt','List of route source points'],
		dst:['dst','DESTINATION','end.txt','List of route destination points']
	},['src','dst'],'Reititin','0.9.6.5');

	startPt=new reach.Deg(60.17129,24.94167);
	endPt=new reach.Deg(60.17129,24.95);
	city=new reach.trans.City();
	net=new reach.road.Net(city);
	batch=new reach.route.Batch(net,city);
	conf=new reach.route.Conf(city);
	dispatch=new reach.control.Dispatch();
globalCity=city;
globalNet=net;
globalBatch=batch;
globalConf=conf;
globalFrequency=opt.def.freq;

//	searchConf=/** @type {Object.<string,*>} */ {};
	searchConf=null;
	var confData=null;
	try {
		confData=fs.readFileSync(opt.def.conf,'utf8');
		if(confData) {
    	    eval('searchConf='+confData+';');
			if(searchConf) conf.read(searchConf);
		}
	} catch(e) {}

	if(opt.def.date) conf.dateText=opt.def.date;

	srcPtSet=new reach.loc.InputSet(net,reach.loc.InputSet.Type.SRC);
	dstPtSet=new reach.loc.InputSet(net,reach.loc.InputSet.Type.DST);
	extraPtSet=new reach.loc.InputSet(net,reach.loc.InputSet.Type.EXTRA);
	eventSet=new reach.loc.EventSet(conf.maxWalk);
	dijkstra=new reach.route.Dijkstra();
	globalDijkstra=dijkstra;
	outList=[];

var extraLineList;

extraLineList=[];

	/** @param {reach.task.Task} parseSrc
	  * @param {reach.task.Task} parseDst
	  * @return {reach.task.Task} */
	function test2(parseSrc,parseDst) {
		var bindTask,routeTask,showTask;
		var updateResults;

		updateResults=null;

var extraPtList;
var extraLine;
var loc;

extraPtList=[];

/*
loc=new reach.loc.Outdoor(new reach.Deg(60.1717,24.9420).toMU());
loc.name='foo';
extraPtList.push(loc);
loc=new reach.loc.Outdoor(new reach.Deg(60.2919,25.0439).toMU());
loc.name='quux';
extraPtList.push(loc);
*/

var data;
if(opt.def.extra) {
	data=fs.readFileSync(opt.def.extra.replace(/\.shp$/,".prj"),{'encoding':'utf8'});
	var extraProj=new Proj4js.Proj(data);
	var dstProj=new Proj4js.Proj('EPSG:4326');
	//var dstProj=new Proj4js.Proj('EPSG:2392');
}

var path;
var stat;
var shapeList;
var shapeNum,shapeCount;
var shpLen,dbfLen;
var shpBuf,dbfBuf;
var row;
var raw;
var linePtList;

if(opt.def.extra) {
	path=opt.def.extra;
	stat=fs.statSync(path);
	shpLen=stat.size;

	raw=fs.readFileSync(path);
	shpBuf=new gis.io.NodeStream(gis.io.Stream.Endian.LITTLE,raw);

	path=opt.def.extra.replace(/\.shp$/,".dbf");
	stat=fs.statSync(path);
	dbfLen=stat.size;

	raw=fs.readFileSync(path);
	dbfBuf=new gis.io.NodeStream(gis.io.Stream.Endian.LITTLE,raw);

	var shp;

	shp=new gis.format.Shp();

	var ptNum,ptCount;

	shapeList=[];
	shp.importStream(shpBuf,shpLen,dbfBuf,dbfLen,extraProj,dstProj);
	while(1) {
		row=shp.readShape();
		if(!row) break;
		shapeList.push(row);
	}

	shapeList.sort(function(a,b) {return(a[1].routeid-b[1].routeid||a[1].sequence-b[1].sequence);});

	loc=new reach.loc.Outdoor(shapeList[0][0][0]);
	loc.row=shapeList[0][1];
	loc.name=shapeList[0][1].firststop;
	extraPtList[0]=loc;

	shapeCount=shapeList.length;
	for(shapeNum=0;shapeNum<shapeCount;shapeNum++) {
		ptList=shapeList[shapeNum][0];
		loc=new reach.loc.Outdoor(ptList[ptList.length-1]);
		loc.row=shapeList[shapeNum][1];
		loc.name=shapeList[shapeNum][1].laststop;
		if(shapeList[shapeNum][1].firststop) extraPtList[shapeNum].name=shapeList[shapeNum][1].firststop;
		extraPtList[shapeNum+1]=loc;
	}

	prevRouteId=null;

var durationList;

	ptCount=extraPtList.length;
	for(ptNum=0;ptNum<ptCount;ptNum++) {
		loc=extraPtList[ptNum];
		if(loc.row['routeid']!=prevRouteId) {
			linePtList=[];
			durationList=[];
			extraLine=new reach.trans.ExtraLine(linePtList);
			extraLine.routeId=loc.row['routeid'];
			extraLine.durationList=durationList;
			extraLineList.push(extraLine);
			prevRouteId=loc.row['routeid'];
		} else durationList.push(loc.row['duration']);
		linePtList.push(loc);
	}
}



		bindTask=new reach.task.Custom('Bind points',
			/** @param {reach.task.Task} task */
			function(task) {
var extraNum,extraCount;
var extra;

extraCount=extraPtList.length;
for(extraNum=0;extraNum<extraCount;extraNum++) {
	extra=extraPtList[extraNum];
	extraPtSet.insertLocation(extra);
}
				eventSet.clear();
				eventSet.importSet(srcPtSet);
				eventSet.importSet(dstPtSet);
				eventSet.importSet(extraPtSet);
				return(batch.bindPoints(task,eventSet,dijkstra,conf));
			}
		);

		routeTask=new reach.task.Custom('Find routes',
			/** @param {reach.task.Task} task */
			function(task) {
var extraNum,extraCount;
var extra;
var walkList;
var walkNum,walkCount;
var walkLeg;
var extraNode,node;

//extraLine=extraLineList[0];

extraCount=extraLineList.length;
for(extraNum=0;extraNum<extraCount;extraNum++) {
	extraLine=extraLineList[extraNum];
	ptList=extraLine.ptList;
	ptCount=ptList.length;
	for(ptNum=0;ptNum<ptCount;ptNum++) {
		extra=ptList[ptNum];
		extraNode=new reach.road.Node(extra.ll);
		extra.node=extraNode;

		extraNode.followerCount=0;
		extraNode.followerList=[];
		extraNode.distList=[];
		extraNode.stopList=[];
		extraNode.extraLine=extraLine;
		extraNode.extraPos=ptNum;

		walkList=extra.walkList[reach.loc.Outdoor.Type.GRAPH];
		if(walkList) {
			walkCount=walkList.length;
			for(walkNum=0;walkNum<walkCount;walkNum++) {
				walkLeg=walkList[walkNum].leg;
				node=walkLeg.startNode;
				if(!node.followerList) continue;

//console.log(walkLeg);
//console.log(walkLeg.startNode);
				extraNode.connectTo(node,walkLeg.dist);
				node.connectTo(extraNode,walkLeg.dist);
//		console.log(extra.walkList[reach.loc.Outdoor.Type.GRAPH]);
			}
		}
	}
}
//console.log(extraLineList[0].ptList.length);
//				batch.routing=false;return(null);
				return(batch.findRoutes(task,srcPtSet,dstPtSet,dijkstra,updateResults,conf));
			}
		);

		showTask=new reach.task.Custom('Output routes',
			/** @param {reach.task.Task} task */
			function(task) {
				var outNum,outCount;

				outCount=outList.length;
				for(outNum=0;outNum<outCount;outNum++) {
					outList[outNum].writeRoutes(srcPtSet,dstPtSet,batch.result);
				}
				return(null);
			}
		);

		if(parseSrc) bindTask.addDep(parseSrc);
		if(parseDst) bindTask.addDep(parseDst);

		bindTask.addDep(reach.control.ModelTasks.preload.task);
		routeTask.addDep(bindTask);
		showTask.addDep(routeTask);

		return(showTask);
	}

	/** @param {reach.map.OpenLayers} map */
	function test(map) {
		var routeTask,showTask;

		// Old routing task needs to be killed before calling the following!
		net.tree.clearData(reach.road.Tile.Persist.QUERY);

		var showTask=new reach.task.Custom('Show routes',
			/** @param {reach.task.Task} task */
			function(task) {
//				net.routing=false;
				map.roadLayer.refresh();
				return(null);
			}
		);

//		net.routing=true;

		routeTask=test2(null,null);
		showTask.addDep(routeTask);

		dispatch.runTask(showTask);
	}

//	dispatch.run(reach.control.ModelTasks.preload);

	if(reach.env.platform==reach.env.Type.BROWSER) {
	} else {
		var srcProj=new Proj4js.Proj(conf.srid);
		var dstProj=new Proj4js.Proj('EPSG:4326');

		/** @type {reach.task.Fetch} */
		var fetchSrc=new reach.task.Fetch('Load source points',opt.def.src,'ISO-8859-1//IGNORE');
		var parseSrc=new reach.task.Custom('Parse source points',
			/** @param {reach.task.Task} task */
			function(task) {
				if(!fetchSrc.result.data) return(null);
				return(srcPtSet.importList(fetchSrc.result.data,srcProj,dstProj,opt.def.src));
			}
		);

		/** @type {reach.task.Fetch} */
		var fetchDst=new reach.task.Fetch('Load target points',opt.def.dst,'ISO-8859-1//IGNORE');
		var parseDst=new reach.task.Custom('Parse target points',
			/** @param {reach.task.Task} task */
			function(task) {
				if(!fetchDst.result.data) return(null);
				return(dstPtSet.importList(fetchDst.result.data,srcProj,dstProj,opt.def.dst));
			}
		);

		if(opt.def.outKML) outList.push(new reach.out.KML(opt.def.outKML,conf));
		if(opt.def.outAVG) outList.push(new reach.out.AVG(opt.def.outAVG,conf));
//		if(opt.def.outCSV) outList.push(new reach.out.CSV(opt.def.outCSV,conf));

		reach.control.initTasks(opt,null,city,net,conf);

		parseSrc.addDep(fetchSrc);
		parseSrc.addDep(reach.control.ModelTasks.road.tree.parse.task);
		parseDst.addDep(fetchDst);
		parseDst.addDep(reach.control.ModelTasks.road.tree.parse.task);

		routeTask=test2(parseSrc,parseDst);
		dispatch.runTask(routeTask);
	}
};

if(reach.env.platform==reach.env.Type.NODE) {
	init();
}
