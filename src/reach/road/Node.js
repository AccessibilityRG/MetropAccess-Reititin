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
