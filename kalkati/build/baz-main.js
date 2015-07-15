goog.provide('main');
goog.require('reach.core.Opt');
goog.require('reach.core.Date');
goog.require('reach.trans.City');
goog.require('reach.road.Net');
goog.require('reach.route.Conf');
goog.require('reach.route.Dijkstra');
goog.require('reach.route.InputPoint');
goog.require('reach.route.WalkSource2');

function compute() {
	var opt=new reach.core.Opt(process.argv,{
		base:['base-path','PATH','.','Directory containing routes, schedules and map tiles'],
		conf:['c|conf','FILE','conf.json','Path to configuration file in JSON format'],
		date:['d|date','DATE',null,'Date for routing calculations in yyyy-mm-dd format'],
		extra:['e|extra','FILE',null,'ESRI Shapefile containing additional transit lines'],
		src:['src','SOURCE','start-wgs84.txt','List of route source points'],
		dst:['dst','DESTINATION','end-wgs84.txt','List of route destination points'],
	},['src','dst'],'Reititin','0.9.3');

	var searchConf;
	var dateParts;
	var searchDate;
	var dayNum;
	var data;
	var city;
	var net;

	var dijkstra;
	var conf,walkConf;

	var startList,endList;
	var startNum,startCount,endNum,endCount;
	var fieldList;
	var deg;
	var ll;
	var pt;
	var src;

	searchConf=/** @type {Object.<string,*>} */ {};
	eval('searchConf='+fs.readFileSync(opt.def.conf,'utf8')+';');
    
	city=new reach.trans.City();
	city.loadStops(opt.def.base+'/tmp/stops.txt');

	if(opt.def.date) searchConf['date']=opt.def.date;
	if(typeof(searchConf['date'])!='string') searchConf['date']='';

	dateParts=(/** @type {string} */ searchConf['date']).split('-');
	searchDate=reach.core.Date.fromYMD(+dateParts[0],+dateParts[1],+dateParts[2]);
	if(!searchDate || searchDate.jd<city.firstDate.jd || searchDate.jd>city.firstDate.jd+city.dayCount-1) {
		console.log('Query date "'+searchConf['date']+'" is invalid.');
		console.log('Valid range is '+city.firstDate.toString()+' to '+new reach.core.Date(city.firstDate.jd+city.dayCount-1).toString()+'.');
		return;
	}

	console.log(opt);

	dayNum=searchDate.jd-city.firstDate.jd;

	city.loadLines(opt.def.base+'/tmp/lines.txt');
	city.loadTrips(opt.def.base+'/tmp/trips.txt',dayNum);
	city.loadDeltas(opt.def.base+'/tmp/deltas.txt',dayNum);

	data=fs.readFileSync(opt.def.base+'/tmp/trans.txt','ascii');
	city.lineSet.importDistPack(data,city.stopSet,city.distDiv);

	city.lineSet.initTrips();

	data=fs.readFileSync(opt.def.base+'/splits.txt','ascii');
	net=new reach.road.Net(city,data);
	net.loadGraph(opt.def.base+'/tmp/dist.txt');
	net.loadRefs(opt.def.base+'/tmp/refs.txt');

	/** @param {reach.road.Tile} tile
	  * @param {reach.MU} ll
	  * @return {boolean} */
	net.tree.loadTile=function(tile,ll) {
		var data;
		var deg;

		if(!tile.isLeaf) {
			deg=ll.toDeg();
			reach.util.warn('Map tile not found. Probably input coordinates lat='+reach.util.round(deg.llat,1000)+', lon='+reach.util.round(deg.llon,1000)+' are out of range.');
			return(false);
		}

		data=fs.readFileSync(opt.def.base+'/tiles/'+tile.path+'.txt','ascii');
		this.importTilePack(data,tile);
		return(true);
	};

	dijkstra=new reach.route.Dijkstra();

	conf=new reach.route.Conf(city);
	conf.read(searchConf);

	walkConf=new reach.route.Conf(city);
	walkConf.read(searchConf);
	walkConf.transCostMul=0;
	walkConf.transModeCostMul=null;

	startList=fs.readFileSync(opt.def.src,'ascii').split(/[\n\r]+/);
	endList=fs.readFileSync(opt.def.dst,'ascii').split(/[\n\r]+/);

	if(conf.forward) {
		walkConf.walkTimePerM=walkConf.endWalkTimePerM;
		walkConf.bikeTimePerM=walkConf.endBikeTimePerM;
	} else {
		walkConf.walkTimePerM=walkConf.startWalkTimePerM;
		walkConf.bikeTimePerM=walkConf.startBikeTimePerM;
	}
	walkConf.maxCost=walkConf.maxWalk*walkConf.walkTimePerM*walkConf.walkCostMul;
	walkConf.forward=!conf.forward;

	endCount=endList.length;
	for(endNum=0;endNum<endCount;endNum++) {
		fieldList=endList[endNum].split(';');
		if(fieldList.length<2) continue;

		if(endNum%100==0) console.log('Processing target location '+fieldList[3]);
		deg=new reach.Deg(+fieldList[1],+fieldList[0]);
		ll=deg.toMU();
		pt=new reach.route.InputPoint(ll,fieldList);

		src=new reach.route.WalkSource(net,dijkstra,walkConf,[ll],0,true);
	}
}

Fiber(compute).run();
