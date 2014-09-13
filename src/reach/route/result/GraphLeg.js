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
