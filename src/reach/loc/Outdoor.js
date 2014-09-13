goog.provide('reach.loc.Outdoor');
goog.require('reach.Obj');
goog.require('reach.loc.Location');
goog.require('reach.route.result.WalkLeg');
goog.require('reach.route.result.LegRef');

/** @constructor
  * @extends {reach.loc.Location}
  * @param {reach.MU} ll */
reach.loc.Outdoor=function(ll) {
	reach.loc.Location.call(this);
	this.ll=ll;

	/** @type {number} */
	this.lineNum;
	/** @type {Array.<Array.<reach.route.result.LegRef>>} Walking routes to nearby stops or input points. */
	this.walkList=[];
	/** @type {reach.road.Node} */
	this.node=null;
	/** @type {number} How many nearby stops have been found. */
	this.stopCount=0;
	/** @type {reach.route.result.WalkLeg} */
	this.srcLeg=null;
	/** @type {reach.route.result.LegRef} */
//	this.directWalk;
	/** @type {boolean} */
//	this.ready=false;
};

reach.inherit(reach.loc.Outdoor,reach.loc.Location);

/** @enum {number} */
reach.loc.Outdoor.Type={
    GRAPH:0,
    SRC:1,
    DST:2,
    EXTRA:3
};

/** @param {reach.route.result.WalkLeg} leg
  * @param {reach.loc.Outdoor.Type} mode
  * @param {reach.route.result.Leg.Dir} dir */
reach.loc.Outdoor.prototype.addWalk=function(leg,mode,dir) {
	var lst;

	lst=this.walkList[mode];
	if(!lst) {
		lst=/** @type {Array.<reach.route.result.LegRef>} */[];
		this.walkList[mode]=lst;
	}

	lst.push(new reach.route.result.LegRef(leg,dir));
};
