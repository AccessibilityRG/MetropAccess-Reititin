goog.provide('main');
goog.require('reach.util');
goog.require('reach.trans.City');
goog.require('reach.road.TileTree');
goog.require('reach.route.Conf');
goog.require('reach.route.WayVisitor');
goog.require('reach.route.NodeVisitor');
goog.require('reach.route.Dijkstra');
goog.require('reach.road.NodeGraph');
//goog.require('reach.Debugger');

var city;
var routeDebug=false;

function compute() {
	var dbg,ctx;
	var data;
	var advance;
	var tree;
	var tile;
	var base;
	var fd;

	base='..';
	city=new reach.trans.City();

/*
	dbg=new reach.Debugger();
	ctx=repl.start().context;
	ctx.reach=reach;
	ctx.city=city;
	ctx.dbg=dbg;
*/

	console.log('Reading stops...');
	data=fs.readFileSync(base+'/data/stops.txt','utf8');
	advance=city.parseStops(data).advance;
	while(advance()) {}

//	console.log('Reading lines...');
//	data=fs.readFileSync('tmp/lines.txt','ascii');
//	advance=city.lineSet.importPack(data,city.stopSet);
//	while(advance()) {}

	data=fs.readFileSync(base+'/data/splits.txt','ascii');
	tree=new reach.road.TileTree(data,null,null);

	console.log('Reading road names...');
	data=fs.readFileSync(base+'/data/maptext.txt','utf8');
	tree.importText(data);

	console.log('Reading road tiles...');
	data=fs.readFileSync(base+'/data/map.txt','utf8');
	tree.importTempPack(data);

	var tile,way,node,stopNode;
	var stopNum,stopCount;
	var stop;
	var nearest;
	var ll;
	var id;

//	id=1;
//	write('<?xml version="1.0" encoding="UTF-8"?>\n');
//	write('<osm version="0.6" generator="BusFaster Reach">\n');
	stopCount=city.stopSet.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=city.stopSet.list[stopNum];
		nearest=tree.findWay(stop.ll);

/*
		if(nearest.pos==0) node=nearest.way.nodeList[nearest.nodeNum];
		else if(nearest.pos==1) node=nearest.way.nodeList[nearest.nodeNum+1];
		else {
			node=tree.insertNode(nearest.ll);
			nearest.way.split(nearest.nodeNum,node);
		}
*/

//		nearest.ll.llat=~~(nearest.ll.llat+0.5);
//		nearest.ll.llon=~~(nearest.ll.llon+0.5);

		tile=tree.findTile(nearest.ll);
		if(nearest.ll.llat==stop.ll.llat && nearest.ll.llon==stop.ll.llon) {
			node=tile.insertNode(nearest.ll);
			stopNode=node;
		} else {
			way=tile.insertWay([stop.ll,nearest.ll],'routing','',true,false,false);
			node=way.nodeList[1];
			stopNode=way.nodeList[0];
		}

		stop.refNodeA=nearest.way.nodeList[nearest.nodeNum];

// TODO: Actually splitting a way can affect 3 tiles: those containing the new node and both nodes around it along the way.
// Those represents the 2 previously existing entry points to that part of the way, and the newly added one.
// This affects refs.txt.
		if(nearest.pos>0) {
			stop.refNodeB=nearest.way.nodeList[nearest.nodeNum+1];
			nearest.way.split(nearest.nodeNum,node);
		} else {
			stop.refNodeB=stop.refNodeA;
		}
		stopNode.important=true;
		if(!stopNode.stopList) stopNode.stopList=[];
		stopNode.stopList.push(stop);
		stop.node=stopNode;
/*
		ll=stop.ll.toDeg();
		write('<node id="'+(-(id++))+'" visible="true" lat="'+ll.llat+'" lon="'+ll.llon+'"></node>\n');
		ll=nearest.ll.toDeg();
		write('<node id="'+(-(id++))+'" visible="true" lat="'+ll.llat+'" lon="'+ll.llon+'"></node>\n');
		write('<way id="'+(-(id++))+'">\n');
		write('\t<nd ref="'+(-(id-3))+'" />\n');
		write('\t<nd ref="'+(-(id-2))+'" />\n');
		write('\t<tag k="name" v="'+stop.name+'" />\n');
		write('</way>\n');
*/
	}
//	write('</osm>\n');

	var codec=new reach.data.Codec();
	var lat,lon;
	fd=fs.openSync(base+'/data/refs.txt','w');
	/** @param {string} txt */
	function write(txt) {fs.writeSync(fd,txt,null,'utf8');}
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=city.stopSet.list[stopNum];
		lat=stop.ll.llat;
		lon=stop.ll.llon;
		write(codec.encodeShort([
			reach.util.fromSigned(stop.refNodeA.ll.llat-lat),reach.util.fromSigned(stop.refNodeA.ll.llon-lon),
			reach.util.fromSigned(stop.refNodeB.ll.llat-lat),reach.util.fromSigned(stop.refNodeB.ll.llon-lon)
		]));
	}
	fs.closeSync(fd);

//	console.log('Writing OSM...');
//	fd=fs.openSync('tile4.osm','w');
//	tree.dumpOSM(write);
//	fs.closeSync(fd);

//	tree.toNodeGraph();

	var txtList;
	var txtNum,txtCount;
	var fieldList,srcList,dstList;
	var srcNum,srcCount;
	var dstNum,dstCount;
	var srcStop,dstStop;
	var dist;
	var txt;
	var tile2;

	data=fs.readFileSync('connections-predef.txt','utf8');
	txtList=data.split('\n');
	txtCount=txtList.length;
	for(txtNum=0;txtNum<txtCount;txtNum++) {
		fieldList=txtList[txtNum].split('\t');
		if(fieldList.length<5) continue;
		srcList=fieldList[0].split(',');
		dstList=fieldList[2].split(',');
		dist=+fieldList[4];

		srcCount=srcList.length;
		dstCount=dstList.length;

		for(srcNum=0;srcNum<srcCount;srcNum++) {
			srcStop=city.stopSet.tbl[srcList[srcNum]];
			if(srcStop.name!=fieldList[1]) {
				console.log('Stop name mismatch in connections, found '+srcStop.name+' and wanted '+fieldList[1]);
				continue;
			}
			for(dstNum=0;dstNum<dstCount;dstNum++) {
				dstStop=city.stopSet.tbl[dstList[dstNum]];
				if(dstStop.name!=fieldList[3]) {
					console.log('Stop name mismatch in connections, found '+dstStop.name+' and wanted '+fieldList[3]);
					continue;
				}

				tile=tree.findTile(srcStop.node.ll);
				way=tile.insertWay([srcStop.node.ll,dstStop.node.ll],'routing','',true,false,false);
				way.distList[0]=dist;

				tile2=tree.findTile(srcStop.node.ll);
				if(tile2!=tile) {
					way=tile2.insertWay([srcStop.node.ll,dstStop.node.ll],'routing','',true,false,false);
					way.distList[0]=dist;
				}
			}
		}
	}

	var graph=new reach.road.NodeGraph();
	graph.importTileTree(tree);
	graph.countErrors();
	graph.optimize();
	graph.countErrors();

/*
	var dijkstra;
	var conf;

	dijkstra=new reach.route.Dijkstra();

	conf=new reach.route.Conf();
	conf.maxTime=0;

	conf.startGraphNodeList=[{node:city.stopSet.list[0].node,cost:1,time:0}];

	dijkstra.start(conf);
	while(dijkstra.step()) {}
*/

	fd=fs.openSync(base+'/data/map2.txt','w');
	graph.exportPack(write,city.stopSet.list);
	fs.closeSync(fd);

	console.log('Writing OSM...');
	fd=fs.openSync('graph.osm','w');
	graph.dumpOSM(write);
	fs.closeSync(fd);
}

Fiber(compute).run();
