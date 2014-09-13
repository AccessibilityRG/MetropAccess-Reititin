goog.provide('reach.trans.SimpleLine');
goog.require('reach.trans.SimpleTrip');
goog.require('reach.trans.Line');

/**
  * @constructor
  * @extends {reach.trans.Line}
  * @param {reach.trans.LineSet} lineSet */
reach.trans.SimpleLine=function(lineSet) {
	/** @type {reach.trans.LineSet} */
	this.lineSet=lineSet;
	/** @type {number} */
	this.id=0;
	/** @type {Array.<reach.trans.Stop>} */
	this.stopList=[];
	/** @type {Object.<number,reach.trans.Trip>} */
	this.tripList={};
	/** @type {Array.<number>} Average time in minutes from first stop to reach each stop along the line. */
	this.meanDuration=[0];
	/** @type {Array.<number>} */
	this.variance=[0];

	/** @type {string} */
	this.name='';

	/** @type {number} */
	this.runId=0;
	/** @type {Array.<number>} */
	this.costList=[];
	/** @type {Array.<number>} */
	this.timeList=[];
	/** @type {Array.<reach.trans.Stop>} */
	this.srcStopList=[];

	/** @type {Array.<number>} */
	this.distList=[];

	/** @type {number} Number of departures around search start time, to evaluate line niceness. */
	this.departureCount=0;
	this.freq=3;
};

reach.trans.SimpleLine.prototype=new reach.trans.Line(null);

/** @param {number} stopNum
  * @param {number} time
  * @param {reach.route.Conf} conf
  * @return {?{trip:reach.trans.Trip,time:number}} */
reach.trans.SimpleLine.prototype.guessArrival=function(stopNum,time,conf) {
	var departTime;
	var duration;
	var freq;
	var trip;

	// TODODONE: read frequency from extra line shapefile's attribute table!!! Could read from any of the polylines of a single route.
	freq=this.freq;

	duration=this.meanDuration[stopNum]/this.lineSet.city.statMul;
	departTime=~~(time/60/conf.timeDiv-duration);
	if(conf.forward) departTime=departTime+freq-departTime%freq;
	else departTime=departTime-(departTime+freq-1)%freq-1;

	trip=this.tripList[departTime];
	if(!trip) {
		trip=new reach.trans.SimpleTrip(this);
		this.tripList[departTime]=trip;
		trip.startTime=departTime;
		trip.key.longCode=this.name;
	}

	return({trip:trip,time:(departTime+duration)*60*conf.timeDiv});
};

/** @param {reach.MU} ll
  * @param {string} name
  * @param {string} id
  * @return {reach.trans.Stop} */
reach.trans.SimpleLine.prototype.addStop=function(ll,name,id) {
	var stop;

	stop=new reach.trans.Stop(this.lineSet.city.stopSet.list.length,id,name,ll);
	stop.lineList=[this];
	stop.posList=[this.stopList.length];
	this.stopList.push(stop);
	this.lineSet.city.stopSet.list.push(stop);

	return(stop);
};

/** @param {string} data
  * @param {reach.route.InputSet} inputSet
  * @param {reach.trans.City} city
  * @param {reach.road.Net} net */
reach.trans.SimpleLine.addExtra=function(data,inputSet,city,net) {
	var extraNum;
	var lineDataTbl;
	var lineData;
	var segNum,segCount;
	var segData,llData;
	var fieldTbl;
	var lineName;
	var pos,len;
	var posData;
	var dataList;
	var line;
	var stopName;
	var stop;

	extra=/** @type {Object.<string,Array.<Object.<string,Object.<string,string>>>>} */ {};
	eval('extra='+data+';');

	lineDataTbl={};
	extraNum=0;

	segCount=extra['features'].length;
	for(segNum=0;segNum<segCount;segNum++) {
		segData=extra['features'][segNum];
		fieldTbl=segData['properties'];
		lineName=fieldTbl['RouteID'];
		pos=fieldTbl['Order'];

		llData=segData['geometry']['coordinates'];
		fieldTbl.llFrom=new reach.Deg(llData[0][1],llData[0][0]).toMU();
		fieldTbl.llTo=new reach.Deg(llData[llData.length-1][1],llData[llData.length-1][0]).toMU();

		lineData=lineDataTbl[lineName];
		if(!lineData) {
			lineData=[];
			lineDataTbl[lineName]=lineData;
		}

		posData=lineData[pos];
		if(!posData) {
			posData=[];
			lineData[pos]=posData;
		}

		posData.push(fieldTbl);
	}

	for(lineName in lineDataTbl) {
		if(!lineDataTbl.hasOwnProperty(lineName)) continue;

		lineData=lineDataTbl[lineName];
		len=lineData.length;
		dataList=[];

		for(pos=0;pos<len;pos++) {
			posData=lineData[pos];
			dataList.push.apply(dataList,posData);
		}

		line=new reach.trans.SimpleLine(city.lineSet);
//		extraLines[lineName]=line;
		line.name=lineName;

		len=dataList.length;
		for(pos=0;pos<len;pos++) {
			fieldTbl=dataList[pos];
			stopName=fieldTbl['firstStop'];
			if(!stopName && pos>0) stopName=dataList[pos-1]['lastStop'];

			stop=line.addStop(fieldTbl.llFrom,stopName,''+extraNum);
			stop.inputPoint=new reach.route.InputPoint(stop.ll,inputSet,fieldTbl,extraNum);
			inputSet.insertPoint(stop.inputPoint);
			extraNum++;
		}

		stop=line.addStop(fieldTbl.llTo,dataList[pos-1]['lastStop'],''+extraNum);
		stop.inputPoint=new reach.route.InputPoint(stop.ll,inputSet,fieldTbl,extraNum);
		inputSet.insertPoint(stop.inputPoint);
		extraNum++;

//		console.log(dataList);
	}

//	line=null;
//	stop=null;
//	extraLines=/** @type {Object.<string,reach.trans.SimpleLine>} */ {};
//	extraNum=0;

/*
	extra['features'].sort(function(a,b) {return(a['properties']['Order']-b['properties']['Order']);});

	duration=0;
	segCount=extra['features'].length;
	for(segNum=0;segNum<segCount;segNum++) {
		segData=extra['features'][segNum];
		name=segData['properties']['RouteID'];
		firstName=segData['properties']['FirstStop'];
		lastName=segData['properties']['LastStop'];
		if(!firstName) {
			if(segNum>0) lastName=extra['features'][segNum-1]['properties']['lastStop'];
		}
		if(!lastName) {
			if(segNum<segCount-1) lastName=extra['features'][segNum+1]['properties']['FirstStop'];
		}
		duration+=segData['properties']['Duration'];
		dist=+segData['properties']['Length'];
		freq=+segData['properties']['Frequency'];
		llData=segData['geometry']['coordinates'];
		ll1=new reach.Deg(llData[0][1],llData[0][0]).toMU();
		// TODODONE: change llData[1] to llData[llData.length] so the lines between stops can have more than two points!!!
		ll2=new reach.Deg(llData[llData.length-1][1],llData[llData.length-1][0]).toMU();

		if(!extraLines[name]) {
			line=new reach.trans.SimpleLine(city.lineSet);
			extraLines[name]=line;
			line.name=name;

			stop=line.addStop(ll1,firstName,''+(extraNum++));
			tree.addCustomStop(city,stop,graph,walkConf,dijkstra);
			stop.node.entryType='extra';
		} else line=extraLines[name];

		stop=line.addStop(ll2,lastName,''+(extraNum++));
		if(freq) line.freq=freq;

		line.meanDuration.push(duration*city.statMul);
		line.variance.push(0);
		line.distList.push(dist);

		tree.addCustomStop(city,stop,graph,walkConf,dijkstra);
		stop.node.entryType='extra';
	}
*/
}
