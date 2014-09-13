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
