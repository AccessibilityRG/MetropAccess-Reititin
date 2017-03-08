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
			case steps.init:  // 1

				step++;

//				eventNum=0;

				step=steps.nextEvent;
//				return(eventSet.count-eventNum);

			case steps.nextEvent: // 2
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

			case steps.findTile: // 3
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

			case steps.findWay: // 4
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

			case steps.bindNode: // 5
				if(!retryCount) {
					// Binding the point to the road network was successful so move to the next point.
//					eventNum++;
					step=steps.nextEvent;
					break;
				}

				// Coming here after not finding any nearby stops, it's time to retry routing after connecting to a different road.
				// TODO: the alternative road should be selected so that the direct line to it doesn't cross other reasonable roads.
				step=steps.initRouting;

			case steps.initRouting: // 6
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

			case steps.route: // 7
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
