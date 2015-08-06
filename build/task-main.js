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
		iconv=require('iconv-lite');
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

    city=new reach.trans.City();
	net=new reach.road.Net(city);
	batch=new reach.route.Batch(net,city);
	conf=new reach.route.Conf(city);
	dispatch=new reach.control.Dispatch();
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
		var data;

		if(opt.def.extra) {
			data=fs.readFileSync(opt.def.extra.replace(/\.shp$/,".prj"),{'encoding':'utf8'});
			var extraProj=new Proj4js.Proj(data);
			var dstProj=new Proj4js.Proj('EPSG:4326');
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

			shapeCount=shapeList.length;
			for(shapeNum=shapeCount;shapeNum--;) {
				ptList=shapeList[shapeNum][0];
				if(!ptList[0] || !ptList[ptList.length-1]) {
					console.log('Warning: no coordinates for row:');
					console.log(shapeList[shapeNum]);
					shapeList.splice(shapeNum,1);
					continue;
				}
			}

			shapeList.sort(function(a,b) {
				if(a[1].routeid>b[1].routeid) return(1);
				if(a[1].routeid<b[1].routeid) return(-1);
				return(a[1].sequence-b[1].sequence);
			});

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
								extraNode.connectTo(node,walkLeg.dist);
								node.connectTo(extraNode,walkLeg.dist);
							}
						}
					}
				}

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
				map.roadLayer.refresh();
				return(null);
			}
		);
		routeTask=test2(null,null);
		showTask.addDep(routeTask);
		dispatch.runTask(showTask);
	}

	if(reach.env.platform==reach.env.Type.BROWSER) {
	} else {
		var srcProj=new Proj4js.Proj(conf.srid);
		var dstProj=new Proj4js.Proj('EPSG:4326');

		/** @type {reach.task.Fetch} */
		var fetchSrc=new reach.task.Fetch('Load source points',opt.def.src,'ISO-8859-1');

		var parseSrc=new reach.task.Custom('Parse source points',
			/** @param {reach.task.Task} task */
			function(task) {
				if(!fetchSrc.result.data) return(null);
				return(srcPtSet.importList(fetchSrc.result.data,srcProj,dstProj,opt.def.src));
			}
		);

		/** @type {reach.task.Fetch} */
		var fetchDst=new reach.task.Fetch('Load target points',opt.def.dst,'ISO-8859-1');

		var parseDst=new reach.task.Custom('Parse target points',
			/** @param {reach.task.Task} task */
			function(task) {
				if(!fetchDst.result.data) return(null);
				return(dstPtSet.importList(fetchDst.result.data,srcProj,dstProj,opt.def.dst));
			}
		);

		if(opt.def.outKML) outList.push(new reach.out.KML(opt.def.outKML,conf));
		if(opt.def.outAVG) outList.push(new reach.out.AVG(opt.def.outAVG,conf));
		//if(opt.def.outCSV) outList.push(new reach.out.CSV(opt.def.outCSV,conf));

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
