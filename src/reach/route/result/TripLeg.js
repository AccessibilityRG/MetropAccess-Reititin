goog.provide('reach.route.result.TripLeg');
goog.require('reach.route.result.Leg');
goog.require('reach.trans.Trip');

/** @constructor
  * @param {reach.trans.Trip} trip
  * @extends {reach.route.result.Leg} */
reach.route.result.TripLeg=function(trip) {
	reach.route.result.Leg.call(this);

	/** @type {number} */
	this.startTime=0;
	/** @type {number} */
	this.waitCost=0;
	/** @type {reach.trans.Trip} */
	this.trip=trip;
	/** @type {reach.trans.Line} */
	this.line=trip.key.line;
	/** @type {number} */
	this.enterPos=0;
	/** @type {number} */
	this.leavePos=0;

	this.type=reach.route.result.Leg.Type.TRANS;
};

reach.inherit(reach.route.result.TripLeg,reach.route.result.Leg);

/*
reach.route.result.TripLeg.prototype.print=function(conf) {
	var stopNum,stopCount;
	var stop;
	var time,cost;

	console.log('Enter '+this.trip.key.longCode);

	stopCount=this.stopCount;
	for(stopNum=0;stopNum<this.stopCount;stopNum++) {
		stop=this.stopList[stopNum];
		time=this.timeList[stopNum];
		cost=this.costList[stopNum];

		console.log(reach.util.formatSecs(time/conf.timeDiv)+'\t'+~~cost+'\t'+stop.name+' ('+stop.origId+')');
	}

	console.log('Leave '+this.trip.key.longCode);
};

reach.route.result.TripLeg.prototype.debug=function(conf) {
	var stopList;
	var delta;
	var pos,leavePos;
	var deg;
	var out;

	out=[];
	stopList=this.trip.key.line.stopList;
	pos=this.enterPos;
	leavePos=this.leavePos;

****
	console.log('TRIP '+this.trip.key.longCode);
	stop=stopList[pos];
	console.log(reach.util.formatMins(stop.timeList[0]/60/conf.timeDiv)+'\t'+stop.costList[0]+'\t'+stop.origId+'\t'+stop.name);
	console.log(reach.util.formatMins(this.trip.key.line.timeList[pos]/60/conf.timeDiv)+'\t'+this.trip.key.line.costList[pos]);
	stop=stopList[leavePos];
	console.log(reach.util.formatMins(this.trip.key.line.timeList[leavePos]/60/conf.timeDiv)+'\t'+this.trip.key.line.costList[leavePos]+'\t'+stop.origId+'\t'+stop.name);
	console.log(reach.util.formatMins(stop.timeList[0]/60/conf.timeDiv)+'\t'+stop.costList[0]);

//	console.log(this.trip.key.longCode+'\t'+reach.util.formatMins(this.trip.key.line.timeList[pos]/60/conf.timeDiv)+'\t'+stopList[pos].origId+'\t'+stopList[pos].name+'\t'+reach.util.formatMins(this.trip.key.line.timeList[leavePos]/60/conf.timeDiv)+'\t'+stopList[leavePos].origId+'\t'+stopList[leavePos].name);
//	console.log(reach.util.formatMins(stopList[pos].timeList[0]/60/conf.timeDiv)+'\t'+reach.util.formatMins(this.trip.guessArrival(pos)));
//	console.log(reach.util.formatMins(stopList[pos].timeList[0]/60/conf.timeDiv)+'\t'+reach.util.formatMins(this.trip.key.line.timeList[pos]/60/conf.timeDiv));
var stop;
var i;
for(i=0;i<stopList[leavePos].costList.length;i++) {
stop=stopList[leavePos];
//if(stop.srcTripList[i]) console.log(reach.util.formatMins(stop.timeList[i]/60/conf.timeDiv)+'\t'+stop.costList[i]+'\t'+stop.srcTripList[i].key.longCode);
}
****

	if(leavePos>pos) delta=1;
	else delta=-1;

	while(1) {
		deg=stopList[pos].ll.toDeg();
		out.push(deg.llon+','+deg.llat+',2');
		if(pos==leavePos) break;
		pos+=delta;
	}

	return(out);
};
*/

/** @param {reach.route.Conf} conf
  * @param {reach.route.result.Leg.Dir} dir
  * @return {Array.<reach.MU>} */
reach.route.result.TripLeg.prototype.getPoints=function(conf,dir) {
	var stopList;
	var delta;
	var pos,leavePos;
	var deg;
	var out;

	out=[];
	stopList=this.trip.key.line.stopList;
	pos=this.enterPos;
	leavePos=this.leavePos;

	if(leavePos>pos) delta=1;
	else delta=-1;

	while(1) {
		out.push(stopList[pos].ll);
		if(pos==leavePos) break;
		pos+=delta;
	}

//	if(this.dir!=dir) out.reverse();

	return(out);
};
