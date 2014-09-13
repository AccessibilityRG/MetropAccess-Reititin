goog.provide('reach.trans.LineSet');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.TripSet');
goog.require('reach.trans.Line');
goog.require('reach.data.Codec');
goog.require('reach.io.SQL');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.LineSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<reach.trans.Line>} */
	this.list=[];
	/** @type {number} */
	this.maxRep=16;

	/** @type {Object.<string,number>} */
	this.validBitsTbl={};
	/** @type {Array.<Array.<number>>} */
	this.validList=[];
	/** @type {Array.<boolean>} */
	this.validAccept;
};

/** @param {reach.io.SQL} db
  * @param {reach.trans.StopSet} stopSet */
reach.trans.LineSet.prototype.importKalkati=function(db,stopSet) {
	var codec=new reach.data.Codec();
	var result,row;
	var lineTbl,lineId;
	var data;
	var dataLen;
	var stopIdList;
	var line;
	var lineKey;
	var trip;
	var i,l;
	var validBits;
	var valid;

	this.list=[];
	lineTbl=/** @type {Object.<string,reach.trans.Line>} */ {};

	result=db.query('SELECT servid,mode,long,short,name,valid,data FROM servicedata ORDER BY long,valid DESC,first;');
	lineId=0;

	while(row=result.getRow()) {
		data=(/** @type {Object.<string,string>} */ row)['data'].split(' ');

		dataLen=data.length;

		stopIdList=[];
		for(i=0;i<dataLen;i+=2) stopIdList.push(+data[i]);
		lineKey=stopIdList.join(' ');
		line=lineTbl[lineKey];

		if(!line) {
			line=new reach.trans.Line(this);
			line.id=lineId++;
			lineTbl[lineKey]=line;
			this.list.push(line);

			l=stopIdList.length;
			for(i=0;i<l;i++) {
				line.stopList.push(stopSet.tbl[stopIdList[i]]);
			}
		}

		validBits=row['valid'];
		valid=this.validBitsTbl[validBits];
		if(!valid && valid!==0) {
			valid=this.validList.length;
			this.validBitsTbl[validBits]=valid;
			this.validList[valid]=codec.validBitsToList(validBits);
		}

		trip=new reach.trans.Trip(line);
		trip.importKalkati(row,data,valid);

		if(!line.tripListTbl[valid]) line.tripListTbl[valid]=[];
		line.tripListTbl[valid].push(trip);
	}
};

/** @param {function(string)} write */
reach.trans.LineSet.prototype.exportPack=function(write) {
	var codec=new reach.data.Codec();
	var lineNum,lineCount;
	var i,stopCount;
	var line;
	var stop,prevStop;
	var packNum;
	var repLen;
	var stats;
	var data;
	var maxRep;

	maxRep=this.maxRep;

	lineCount=this.list.length;
	data=[];

	data.push(codec.encodeShort([lineCount]));

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];
		stopCount=line.stopList.length;

		stop=line.stopList[0];
		data.push(codec.encodeShort([stopCount,stop.id]));
		repLen=0;

		for(i=1;i<stopCount;i++) {
			prevStop=stop;

			if(!prevStop.packTbl) {
				prevStop.packTbl={};
				prevStop.packFollowers=0;
			}

			stop=line.stopList[i];
			packNum=prevStop.packTbl[stop.id];
			if(packNum===0) {
				if(repLen==maxRep) {
					data.push(codec.encodeShort([repLen-1]));
					repLen=0;
				}
				repLen++;
			} else {
				if(repLen) data.push(codec.encodeShort([repLen-1]));
				repLen=0;

				if(packNum) {
					data.push(codec.encodeShort([packNum+maxRep-1]));
				} else {
					stats=prevStop.statsTo[prevStop.followerTbl[stop.id]];
					data.push(codec.encodeShort([prevStop.packFollowers+stop.id+maxRep,stats.mean,stats.variance]));
					prevStop.packTbl[stop.id]=prevStop.packFollowers++;
				}
			}
		}
		if(repLen) data.push(codec.encodeShort([repLen-1]));
	}

	write(data.join('')+'\n');
};

/** @param {reach.data.Stream} stream
  * @param {reach.trans.StopSet} stopSet
  * @return {function():number} */
reach.trans.LineSet.prototype.importPack=function(stream,stopSet) {
	/** @type {reach.trans.LineSet} */
	var self=this;
	var lineNum,lineCount;
	var line;
	var stopNum,stopCount;
	var stop,prevStop;
	var id;
	var j,maxRep;
	var followerCount;
	var mean,variance;
	var step;

	var advance=function() {
		var dec;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				maxRep=self.maxRep;
				lineCount=stream.readShort(1)[0];
				lineNum=0;

				return(lineCount-lineNum);

			// Iterate to load info for each line such as list of stops.
			case 1:
				line=new reach.trans.Line(self);
				line.id=lineNum;

				dec=stream.readShort(2);
				stopCount=dec[0];
				stopNum=0;
				stop=stopSet.list[dec[1]];

				stop.lineList.push(line);
				stop.posList.push(stopNum);
				line.stopList[stopNum++]=stop;

				while(stopNum<stopCount) {
					id=stream.readShort(1)[0];
					followerCount=stop.followerList.length;

					if(id<maxRep) {
						// The next <id> stops are in the same order as when those stops were first seen in the data.
						id++;
						while(id--) {
							prevStop=stop;
							stop=prevStop.followerList[0];
							stop.lineList.push(line);
							stop.posList.push(stopNum);
							line.stopList[stopNum++]=stop;
						}
					} else if(id<maxRep+followerCount) {
						// Next stop has already been seen after this stop on other lines so its full ID and reach time aren't needed.
						prevStop=stop;
						stop=prevStop.followerList[id-maxRep+1];
						stop.lineList.push(line);
						stop.posList.push(stopNum);
						line.stopList[stopNum++]=stop;
					} else {
						// Next stop hasn't been seen following this stop so also store reach time mean and variance between the stops.
						dec=stream.readShort(2);
						mean=dec[0];
						variance=dec[1];

						prevStop=stop;
						stop=stopSet.list[id-followerCount-maxRep];
						stop.lineList.push(line);
						stop.posList.push(stopNum);
						line.stopList[stopNum++]=stop;

						prevStop.followerList[followerCount]=stop;
						prevStop.followerTbl[stop.id]=followerCount;
						prevStop.statsTo[followerCount]={mean:mean,variance:variance};
//console.log(followerCount+' '+stop.origId+' '+mean+' '+variance);
					}
				}

				line.calcStats();
				self.list.push(line);

				lineNum++;
				return(lineCount-lineNum);
		}
	};

	step=0;
	return(advance);
};

reach.trans.LineSet.prototype.cleanUp=function() {
	var lineNum,lineCount;
	var line;

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

//		delete(line.tripFirstTbl);
		if(line.tripFirstTbl) line.tripFirstTbl=null;
	}
};

// This used to be called initTrips.
reach.trans.LineSet.prototype.sortTrips=function() {
    var lineNum;
    var line;
    var tripListList;
	var tripNum;

	/** @param {reach.trans.Trip} a
	  * @param {reach.trans.Trip} b
	  * @return {number} */
	function compareTrips(a,b) {
		return(a.startTime-b.startTime);
	}

	for(lineNum=this.list.length;lineNum--;) {
		line=this.city.lineSet.list[lineNum];
		tripListList=[];
		for(var validNum in line.tripListTbl) {
			if(this.validAccept[validNum] && line.tripListTbl.hasOwnProperty(validNum)) {
				tripListList.push(line.tripListTbl[+validNum]);
			}
		}

		// Concatenate together all trip lists from different valid day groups.
		line.tripList=line.tripList.concat.apply(line.tripList,tripListList);

		line.tripList.sort(compareTrips);

		for(tripNum=line.tripList.length;tripNum--;) {
			line.tripList[tripNum].num=tripNum;
		}
	}
};

/** @param {number} startTime Unit: minutes. */
reach.trans.LineSet.prototype.calcNiceness=function(startTime,niceDepartureSpan) {
	var lineNum,lineCount;
	var line;
	var trip;
	var stopList;
	var stopNum,stopCount;
	var stop;
	var lastTime;
	var i,l;

	stopList=this.city.stopSet.list;
	stopCount=stopList.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopList[stopNum];
		stop.departureCount=0;
	}

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

		// Find departures within an hour after search start time.
		lastTime=startTime+niceDepartureSpan;
		l=line.tripList.length;

		line.departureCount=0;
		for(i=line.findDeparture(startTime);i<l;i++) {
			trip=line.tripList[i];
			if(trip.startTime>lastTime) break;
			line.departureCount++;
		}

		stopCount=line.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=line.stopList[stopNum];
			stop.departureCount+=line.departureCount;
		}
	}
};

/** @param {string} data
  * @param {reach.trans.StopSet} stopSet
  * @param {number} distDiv */
reach.trans.LineSet.prototype.importDistPack=function(data,stopSet,distDiv) {
	var codec=new reach.data.Codec();
	var stopNum,stopCount;
	var stop,prevStop;
	var followerNum,followerCount;
	var lineNum,lineCount;
	var line;
	var dist;
	var dec;
	var pos;

	pos=0;

	stopCount=stopSet.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopSet.list[stopNum];
		dec=codec.decodeShort(data,pos,1);
		pos=dec[0];
		followerCount=dec[1];

		for(followerNum=0;followerNum<followerCount;followerNum++) {
			dec=codec.decodeLong(data,pos,2);
			pos=dec[0];

			stop.followerTbl[dec[1]]=dec[2]/distDiv;
		}
	}

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

		stop=line.stopList[0];
		stopCount=line.stopList.length;
		for(stopNum=1;stopNum<stopCount;stopNum++) {
			prevStop=stop;
			stop=line.stopList[stopNum];

			if(prevStop.followerTbl[stop.id]) dist=prevStop.followerTbl[stop.id];
			if(!dist) dist=reach.util.vincenty(prevStop.ll.toDeg(),stop.ll.toDeg());
			if(!dist) dist=0;

			line.distList[stopNum-1]=dist;
		}
	}
};
