goog.provide('reach.Api');
goog.require('reach.core.Opt');
goog.require('reach.trans.City');
goog.require('reach.road.Net');
goog.require('reach.route.Batch');
goog.require('reach.route.Conf');
goog.require('reach.route.Dijkstra');
goog.require('reach.control.ModelTasks');
goog.require('reach.control.Dispatch');
goog.require('reach.loc.InputSet');
goog.require('reach.loc.EventSet');

/** @constructor */
reach.Api=function() {
	var args;
	var city;
	var net;

	console.log('REACH INIT...');

	args=[null,null,'start.txt','end.txt','--base-path','.'];
	this.opt=new reach.core.Opt(args,{
		base:['base-path','PATH','..','Directory containing routes, schedules and map tiles'],
		conf:['c|conf','FILE','conf.json','Path to configuration file in JSON format'],
		date:['d|date','DATE',null,'Date for routing calculations in yyyy-mm-dd format'],
		outAVG:['out-avg','FILE',null,'Output long format CSV file'],
		outKML:['out-kml','FILE',null,'Output KML file'],
		src:['src','SOURCE','start.txt','List of route source points'],
		dst:['dst','DESTINATION','end.txt','List of route destination points']
	},['src','dst'],'Reititin','0.9.6.5');

	city=new reach.trans.City();
	net=new reach.road.Net(city);

	this.city=city;
	this.net=net;
	this.batch=new reach.route.Batch(net,city);
	this.conf=new reach.route.Conf(city);
	this.dispatch=new reach.control.Dispatch();

	reach.control.initTasks(this.opt,this.map,city,net,this.conf);
	this.dispatch.run(reach.control.ModelTasks.preload);

	this.srcPtSet=new reach.loc.InputSet(net,reach.loc.InputSet.Type.SRC);
	this.dstPtSet=new reach.loc.InputSet(net,reach.loc.InputSet.Type.DST);
	this.eventSet=new reach.loc.EventSet(this.conf.maxWalk);
	this.dijkstra=new reach.route.Dijkstra();

	console.log('REACH INIT DONE');
};

reach.Api.init=function() {
	return(new reach.Api());
};

reach.Api.prototype.find=function(src,dst,callback) {
	var self=this;
	var bindTask,findTask;

	console.log('ROUTING');
//	console.log(src);
//	console.log(dst);

	bindTask=new reach.task.Custom('Bind points',
		/** @param {reach.task.Task} task */
		function(task) {
			var srcPtSet,dstPtSet;
			var eventSet;

			startPt=new reach.Deg(src.lat,src.lng);
			endPt=new reach.Deg(dst.lat,dst.lng);

			startLoc=new reach.loc.Outdoor(startPt.toMU());
			endLoc=new reach.loc.Outdoor(endPt.toMU());
			startLoc.id='Start';
			endLoc.id='End';

			srcPtSet=self.srcPtSet;
			srcPtSet.clear();
			srcPtSet.insertLocation(startLoc);

			dstPtSet=self.dstPtSet;
			dstPtSet.clear();
			dstPtSet.insertLocation(endLoc);

			eventSet=self.eventSet;
			eventSet.clear();
			eventSet.importSet(srcPtSet);
			eventSet.importSet(dstPtSet);

			return(self.batch.bindPoints(task,eventSet,self.dijkstra,self.conf));
		}
	);

	routeTask=new reach.task.Custom('Find routes',
		/** @param {reach.task.Task} task */
		function(task) {
			var d;

			d=new Date();
			self.conf.timeList[0]=(d.getHours()*60+d.getMinutes())*60*self.conf.timeDiv;

			return(self.batch.findRoutes(task,self.srcPtSet,self.dstPtSet,self.dijkstra,null,self.conf));
		}
	);

	showTask=new reach.task.Custom('Show route',
		/** @param {reach.task.Task} task */
		function(task) {
			var conf;
			var route;
			var refList;
			var refNum,refCount;
			var ref;
			var leg;
			var tripLeg;
			var trip;
			var stop;
			var ptList;
			var ptNum,ptCount;
			var ll;
			var json;
			var jsonLeg;
			var d;
			var stamp;

			conf=self.conf;
			route=self.batch.result['0\t0'];
			if(!route) return;
			console.log(route);
			console.log(conf);

			d=new Date();
			d.setHours(0);
			d.setMinutes(0);
			d.setSeconds(0);
//			stamp=(new reach.core.Date.fromYMD(d.getFullYear(),d.getMonth()+1,d.getDate()).jd-719163)*24*60*60*1000;
			stamp=d.getTime();

			json={};
			json.duration=route.duration/conf.timeDiv*1000;
			json.startTime=stamp+route.startTime/conf.timeDiv*1000;
			json.legs=[];

			console.log(json);

			refList=route.outRefList;
			legCount=refList.length;
			for(legNum=0;legNum<legCount;legNum++) {
				ref=refList[legNum];
				leg=ref.leg;
				jsonLeg={};

				if(leg.type==reach.route.result.Leg.Type.TRANS) {
					tripLeg=/** @type {reach.route.result.TripLeg} */ leg;
					trip=tripLeg.trip;
//console.log(trip.key.longCode);
					stop=tripLeg.line.stopList[tripLeg.enterPos];
//console.log(reach.util.formatMins(ref.startTime/60/conf.timeDiv)+' '+stop.name);
					stop=tripLeg.line.stopList[tripLeg.leavePos];
//console.log(reach.util.formatMins((ref.startTime+leg.duration)/60/conf.timeDiv)+' '+stop.name);

					jsonLeg.mode='BUS';
					jsonLeg.routeType=3;
					jsonLeg.route=trip.key.shortCode;
					jsonLeg.routeId=trip.key.longCode.replace(/ .*/,'');

					stop=tripLeg.line.stopList[tripLeg.enterPos];
					ll=stop.ll.toDeg();
					jsonLeg.from={
						lat:ll.llat,
						lon:ll.llon,
						name:stop.name
					};

					stop=tripLeg.line.stopList[tripLeg.leavePos];
					ll=stop.ll.toDeg();
					jsonLeg.to={
						lat:ll.llat,
						lon:ll.llon,
						name:stop.name
					};
				} else {
					jsonLeg.mode='WALK';
					jsonLeg.routeType=null;
					jsonLeg.route='';
				}

				jsonLeg.startTime=stamp+ref.startTime/conf.timeDiv*1000;
				jsonLeg.duration=leg.duration/conf.timeDiv*1000;

				ptList=leg.getPoints(conf,leg.dir,null);
				ptCount=ptList.length;

				for(ptNum=0;ptNum<ptCount;ptNum++) {
//					ll=ptList[ptNum].toDeg().toGoog();
					ll=ptList[ptNum].toDeg();
					ptList[ptNum]=[ll.llat*100000,ll.llon*100000];
				}

				jsonLeg.legGeometry={
					points:ptList
				};

				json.legs.push(jsonLeg);
			}

			callback(json);

			return(null);
		}
	);

	routeTask.addDep(bindTask);
	showTask.addDep(routeTask);

	this.dispatch.runTask(showTask);
};
