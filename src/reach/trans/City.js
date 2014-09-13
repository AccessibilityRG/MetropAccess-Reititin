goog.provide('reach.trans.City');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.LineSet');
goog.require('reach.trans.TripSet');
goog.require('reach.trans.DeltaSet');
goog.require('reach.data.Stream');
goog.require('reach.core.Date');

/** @constructor */
reach.trans.City=function() {
	/** @type {reach.trans.StopSet} */
	this.stopSet=null;
	/** @type {reach.trans.LineSet} */
	this.lineSet=null;
	/** @type {reach.trans.TripSet} */
	this.tripSet=null;
	/** @type {reach.trans.DeltaSet} */
	this.deltaSet=null;
//new reach.trans.DeltaSet(this);
	/** @type {number} */
	this.distDiv=8;
	/** @type {number} */
	this.statMul=60;
	/** @type {number} */
	this.nearStopCount=25;
	/** @type {reach.core.Date} */
	this.firstDate=null;
	/** @type {number} */
	this.dayCount=0;
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.trans.City.prototype.parseStops=function(stream) {
	this.stopSet=new reach.trans.StopSet(this);
	return(this.stopSet.importPack(stream));
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.trans.City.prototype.parseLines=function(stream) {
	this.lineSet=new reach.trans.LineSet(this);
	return(this.lineSet.importPack(stream,this.stopSet));
};

/** @param {reach.data.Stream} stream
  * @param {number} dayNum
  * @return {function():number} */
reach.trans.City.prototype.parseTrips=function(stream,dayNum) {
	var mask;

	this.tripSet=new reach.trans.TripSet(this);
	if(dayNum<0) mask=[60,63,63,63,63,63,63,63,63,63,63];
	else mask=this.makeValidMask([dayNum]);
	return(this.tripSet.importPack(stream,this.lineSet,mask));
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.trans.City.prototype.parseDeltas=function(stream) {
	this.deltaSet=new reach.trans.DeltaSet(this);
	return(this.deltaSet.importPack(stream,this.lineSet));
};

/** @param {Array.<number>} dayList
  * @return {Array.<number>} */
reach.trans.City.prototype.makeValidMask=function(dayList) {
	var mask;
	var dayNum;
	var i,l;

	mask=[this.dayCount];
	l=~~((this.dayCount+5)/6);

	for(i=1;i<=l;i++) {
		mask[i]=0;
	}

	l=dayList.length;
	for(i=0;i<l;i++) {
		dayNum=dayList[i];
		mask[1+~~(dayNum/6)]|=(1<<(5-dayNum%6));
	}

	return(mask);
};
