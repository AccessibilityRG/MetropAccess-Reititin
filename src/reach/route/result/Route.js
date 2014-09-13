goog.provide('reach.route.result.Route');
goog.require('reach.route.result.Leg');
goog.require('reach.route.result.OutWalkLeg');

/** @constructor */
reach.route.result.Route=function() {
	/** @type {number} */
	this.cost=0;
	/** @type {number} */
	this.duration=0;
	/** @type {number} */
	this.dist=0;
	/** @type {number} */
	this.tripCount=0;

	/** @type {number} */
	this.totalTime=0;
	/** @type {number} */
	this.sampleCount=1;

	/** @type {number} */
	this.queryTime=0;
	/** @type {number} */
	this.startTime=0;
	/** @type {number} */
	this.endTime=0;
	/** @type {reach.loc.Location} */
	this.srcLoc=null;
	/** @type {reach.loc.Location} */
	this.dstLoc=null;

	/** @type {Array.<reach.route.result.LegRef>} */
	this.refList=[];
	/** @type {Array.<reach.route.result.LegRef>} */
	this.outRefList=[];
};

/** @param {reach.route.result.LegRef} ref */
reach.route.result.Route.prototype.insert=function(ref) {
	this.refList.push(ref);
	this.dist+=ref.leg.dist;
};

reach.route.result.Route.prototype.reverse=function() {
	var refNum;
	var ref;

	this.refList.reverse();
/*
	for(refNum=this.refList.length;refNum--;) {
		ref=this.refList[refNum];
		this.refList[refNum]=new reach.route.LegRef(ref.leg,!ref.dir);
	}
*/
};

/** @param {reach.route.Conf} conf */
reach.route.result.Route.prototype.prepareOutput=function(conf) {
	var refList;
	var refNum,refCount,walkCount;
	var ref,outRef;
	var outLeg;

	outLeg=new reach.route.result.OutWalkLeg();
	outRef=new reach.route.result.LegRef(outLeg,conf.forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD);
	walkCount=0;

	refList=this.refList;
	refCount=refList.length;

	for(refNum=0;refNum<refCount;refNum++) {
		ref=refList[refNum];
		if(ref.leg.type==reach.route.result.Leg.Type.WALK) {
			outLeg.insert(ref);
			if(walkCount==0) outRef.startTime=ref.startTime;
			walkCount++;
		} else {
			if(walkCount>0) {
				this.outRefList.push(outRef);
				outLeg=new reach.route.result.OutWalkLeg();
				outRef=new reach.route.result.LegRef(outLeg,conf.forward?reach.route.result.Leg.Dir.BACKWARD:reach.route.result.Leg.Dir.FORWARD);
				walkCount=0;
			}

			this.outRefList.push(ref);
		}
	}

	if(walkCount>0) this.outRefList.push(outRef);
};

/** @param {reach.route.Conf} conf */
reach.route.result.Route.prototype.print=function(conf) {
	var msg;
	var refList;
	var refNum,refCount;
	var ref;
	var tripLeg;
	var trip;
	var startTime,duration;
	var cost;
	var dist;
	var type;
	var stop;

	msg='';

	refList=this.refList;
	startTime=refList[0].startTime;
	dist=0;
	duration=0;
	cost=0;

	type=reach.route.result.Leg.Type.NONE;

	refCount=refList.length;
	for(refNum=0;refNum<refCount;refNum++) {
		ref=refList[refNum];
		if(ref.leg.type==reach.route.result.Leg.Type.WALK) {
			if(type!=ref.leg.type) startTime=ref.startTime;
			dist+=ref.leg.dist;
			duration+=ref.leg.duration;
			cost+=ref.leg.cost;
//			msg+='\t'+'Cost: '+ref.leg.cost;
//			msg+='\n';
//			if(ref.leg.nodeList) {
//				if(conf.forward) {
//					msg+='\t'+'Check: '+(-(ref.leg.nodeList[ref.leg.nodeList.length-1].cost-ref.leg.nodeList[0].cost));
//				} else {
//					msg+='\t'+'Check: '+(-(ref.leg.nodeList[ref.leg.nodeList.length-1].cost-ref.leg.nodeList[0].cost));
//				}
//				msg+='\n';
//			}
		}

		if(ref.leg.type==reach.route.result.Leg.Type.TRANS || refNum==refCount-1) {
			if(type==reach.route.result.Leg.Type.WALK) {
				msg+=reach.util.formatMins(startTime/60/conf.timeDiv)+'-'+reach.util.formatMins((startTime+duration)/60/conf.timeDiv);
				msg+='\tWALK '+~~(dist+0.5)+'m'+'\t'+cost;
				msg+='\n';
//				if(ref.leg.nodeList) {
//					msg+='\t'+'Check: '+(ref.leg.nodeList[ref.leg.nodeList.length-1].cost-ref.leg.nodeList[0].cost);
//					msg+='\n';
//				}
			}

			if(ref.leg.type==reach.route.result.Leg.Type.TRANS) {
				msg+=reach.util.formatMins(ref.startTime/60/conf.timeDiv)+'-'+reach.util.formatMins((ref.startTime+ref.leg.duration)/60/conf.timeDiv);
				tripLeg=/** @type {reach.route.result.TripLeg} */ ref.leg;
				trip=tripLeg.trip;
				cost=tripLeg.waitCost+ref.leg.cost;
				msg+='\t'+trip.key.longCode+'\t'+~~(ref.leg.dist+0.5)+'m'+'\t'+cost;
				msg+='\n';
//+'\t'+((trip.key.line.stopList[tripLeg.leavePos].cost-trip.key.line.stopList[tripLeg.enterPos].cost)*(conf.forward?1:-1))+'\t'+cost;
//				msg+='\t'+'Costs:'+'\t'+'Wait: '+ref.leg.waitCost+'\t'+'Transit:'+ref.leg.cost;
//				msg+='\n';
//				if(conf.forward) {
//					msg+='\t'+'Check:'+'\t'+'Wait: '+ref.leg.waitCost+'\t'+'Transit:'+(trip.key.line.stopList[tripLeg.leavePos].cost-trip.key.line.costList[tripLeg.enterPos]);
//				} else {
//					msg+='\t'+'Check:'+'\t'+'Wait: '+ref.leg.waitCost+'\t'+'Transit:'+(trip.key.line.stopList[tripLeg.enterPos].cost-trip.key.line.costList[tripLeg.leavePos]-conf.minWait*conf.waitCostMul);
//					msg+='\n'+trip.key.line.stopList[tripLeg.enterPos].cost;
//					msg+='\n'+trip.key.line.costList[tripLeg.leavePos];
//				}
//				msg+='\n';

				stop=trip.key.line.stopList[tripLeg.enterPos];
				msg+=stop.origId+'\t'+stop.name+'\n';
				stop=trip.key.line.stopList[tripLeg.leavePos];
				msg+=stop.origId+'\t'+stop.name+'\n';
			}

			dist=0;
			duration=0;
			cost=0;
		}

		type=ref.leg.type;
	}

	console.log(msg);
};
