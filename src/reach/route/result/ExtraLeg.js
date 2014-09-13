goog.provide('reach.route.result.ExtraLeg');
goog.require('reach.route.result.Leg');
goog.require('reach.trans.Trip');

/** @constructor
  * @extends {reach.route.result.Leg} */
reach.route.result.ExtraLeg=function(desc) {
	reach.route.result.Leg.call(this);

	/** @type {number} */
	this.startTime=0;
	/** @type {number} */
	this.waitCost=0;
	/** @type {reach.trans.Line} */
	this.extraLine=desc[0];
	/** @type {number} */
	this.enterPos=desc[1];
	/** @type {number} */
	this.leavePos=desc[2];

	this.startTime=desc[3];
	this.duration=desc[4]-desc[3];

	this.type=reach.route.result.Leg.Type.EXTRA;
};

reach.inherit(reach.route.result.ExtraLeg,reach.route.result.Leg);

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @return {Array.<reach.MU>} */
reach.route.result.ExtraLeg.prototype.getPoints=function(conf,dir) {
	var ptList;
	var delta;
	var pos,leavePos;
	var deg;
	var out;

	out=[];
	ptList=this.extraLine.ptList;
	pos=this.enterPos;
	leavePos=this.leavePos;

	if(leavePos>pos) delta=1;
	else delta=-1;

	while(1) {
		out.push(ptList[pos].ll);
		if(pos==leavePos) break;
		pos+=delta;
	}

//	if(this.dir!=dir) out.reverse();

	return(out);
};
