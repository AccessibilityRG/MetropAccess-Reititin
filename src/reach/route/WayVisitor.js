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
