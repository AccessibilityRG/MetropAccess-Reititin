goog.provide('reach.road.WayIterator');

/** @constructor
  * @param {reach.road.Way} way */
reach.road.WayIterator=function(way) {
	/** @type {Array.<reach.road.Node>} */
	var pointList;
	/** @type {number} */
	var nodeNum;
	var nodeCount;
	/** @type {number} */
	var bestNodeNum;
	/** @type {number} */
	var pointNum;
	var pointCount;
	/** @type {number} */
	var bestPointNum;
	/** @type {Array.<number>} */
	var pointNumList;
	/** @type {Array.<number>} */
	var distList;
	/** @type {Array.<number>} */
	var nodeDistList;

	/** @type {Array.<reach.road.Node>} */
	pointList=way.pointList;
	pointCount=way.pointCount;
	pointNumList=way.pointNumList;
	distList=way.distList;
	nodeDistList=way.nodeDistList;
	nodeCount=way.nodeCount;
	if(!pointNumList) nodeCount=0;
	nodeNum=-1;
	pointNum=-1;
	bestNodeNum=0;
	bestPointNum=0;

	/** @type {reach.road.Way} */
	this.way=way;
	/** @type {reach.road.Node} */
	this.nodePrev=null;
	/** @type {number} */
	this.distPrev=0;
	/** @type {reach.road.Node} */
	this.nodeNext=null;
	/** @type {number} */
	this.distNext=0;

	/** @return {boolean} */
	this.mark=function() {
		bestNodeNum=nodeNum;
		bestPointNum=pointNum-1;

		if(pointNumList[bestNodeNum]==bestPointNum+1) {
			bestNodeNum--;
			return(true);
		}

		return(false);
	};

	/** @return {reach.MU} */
	this.next=function() {
		if(pointNum+1>=pointCount) return(null);
		pointNum++;
		if((nodeNum+1<nodeCount && pointNumList[nodeNum+1]==pointNum) || !pointNumList) {
			nodeNum++;
			return((/** @type {reach.road.Node} */ pointList[pointNum]).ll);
		} else {
			return(/** @type {reach.MU} */ pointList[pointNum]);
		}
	};

	/** @param {number} pos */
	this.getDist=function(pos) {
		this.nodePrev=pointList[pointNumList[bestNodeNum]];
		this.distPrev=distList[bestPointNum]-nodeDistList[bestNodeNum];
		this.distPrev+=(distList[bestPointNum+1]-distList[bestPointNum])*pos;

		if(bestNodeNum+1<nodeCount) {
			this.nodeNext=pointList[pointNumList[bestNodeNum+1]];
			this.distNext=nodeDistList[bestNodeNum+1]-distList[bestPointNum+1];
			this.distNext+=(distList[bestPointNum+1]-distList[bestPointNum])*(1-pos);
		} else {
			this.nodeNext=this.nodePrev;
			this.distNext=this.distPrev;
		}
	};
};
