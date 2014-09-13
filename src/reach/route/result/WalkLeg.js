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
