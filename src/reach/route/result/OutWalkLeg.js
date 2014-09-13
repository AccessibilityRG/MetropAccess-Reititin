goog.provide('reach.route.result.OutWalkLeg');
goog.require('reach.route.result.Leg');

/** @constructor
  * @extends {reach.route.result.Leg} */
reach.route.result.OutWalkLeg=function() {
	reach.route.result.Leg.call(this);

	/** @type {Array.<reach.route.result.LegRef>} */
	this.refList=[];

	this.type=reach.route.result.Leg.Type.WALK;
};

reach.inherit(reach.route.result.OutWalkLeg,reach.route.result.Leg);

/** @param {reach.route.result.LegRef} ref */
reach.route.result.OutWalkLeg.prototype.insert=function(ref) {
	var leg;

	leg=/** @type {reach.route.result.WalkLeg} */ (ref.leg);

	this.refList.push(ref);

	this.cost+=leg.cost;
	this.duration+=leg.duration;
	this.dist+=leg.dist;
};

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @param {Array.<reach.MU>} prev
  * @return {Array.<reach.MU>} */
reach.route.result.OutWalkLeg.prototype.getPoints=function(conf,dir,prev) {
	var refList;
	var legNum,legCount;
	var out;

	out=prev;
	if(!out) out=[];

	refList=this.refList;
	legCount=refList.length;
	if(dir==reach.route.result.Leg.Dir.FORWARD) {
		for(legNum=0;legNum<legCount;legNum++) {
			refList[legNum].leg.getPoints(conf,refList[legNum].dir,out);
		}
	} else {
		for(legNum=legCount;legNum--;) {
			refList[legNum].leg.getPoints(conf,refList[legNum].dir,out);
		}
	}

//	if(this.dir!=dir) out.reverse();

	return(out);
};
