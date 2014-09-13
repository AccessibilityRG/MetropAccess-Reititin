goog.provide('reach.trans.DeltaSet');
goog.require('reach.trans.LineSet');
goog.require('reach.trans.TripSet');
goog.require('reach.data.Codec');
goog.require('reach.io.SQL');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.DeltaSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<Array.<Array.<number>>>} */
	this.deltaList=[];
};

/** @param {reach.io.SQL} db
  * @param {reach.trans.LineSet} lineSet
  * @param {reach.trans.TripSet} tripSet */
reach.trans.DeltaSet.prototype.importKalkati=function(db,lineSet,tripSet) {
	var codec=new reach.data.Codec();
	var lineNum,lineCount;
	var stopNum,stopCount;
	var tripNum,tripCount;
	var tripList;
	var line,stop,trip;
	var lineTbl;
	var stopIdList;
	var key;
	var validNum;
	var valid;
	var result,row;
	var i,dataLen;
	var data;
	var first,arrival,err;
	var mins,prevMins,duration;
	var deltaList;
	var histogram,sum;

	// Build hashes to find trips by validity bit sets, trip codes, departure times etc.
	lineTbl=/** @type {Array.<string,reach.trans.Line>} */ {};

	i=0;
	for(i in lineSet.validBitsTbl) i++;
	if(i==0) {
		for(i=0;i<lineSet.validList.length;i++) {
			lineSet.validBitsTbl[codec.validListToBits(lineSet.validList[i])]=i;
		}
	}

	lineCount=lineSet.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineSet.list[lineNum];
		line.tripFirstTbl={};

		stopIdList=[];
		stopCount=line.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=line.stopList[stopNum];
			stopIdList.push(stop.origId);
		}
		key=stopIdList.join(' ');
		lineTbl[key]=line;

		for(var valid in line.tripListTbl) {
			if(!line.tripListTbl.hasOwnProperty(valid)) continue;

			validNum=+valid;
			line.tripFirstTbl[validNum]={};
			tripList=line.tripListTbl[validNum];
			tripCount=tripList.length;
			for(tripNum=0;tripNum<tripCount;tripNum++) {
				trip=tripList[tripNum];
				key=trip.startTime+'\t'+trip.key.longCode;
				line.tripFirstTbl[validNum][key]=tripNum;
			}
		}
	}

	histogram=[];
	deltaList=/** @type {Array.<Array.<Array.<number>>>} */ [];

	result=db.query('SELECT servid,mode,long,short,name,valid,data FROM servicedata ORDER BY long,valid DESC,first;');
	while(row=result.getRow()) {
		data=(/** @type {Object.<string,string>} */ row)['data'].split(' ');
		dataLen=data.length;

		stopIdList=[];
		for(i=0;i<dataLen;i+=2) stopIdList.push(+data[i]);
		key=stopIdList.join(' ');
		line=lineTbl[key];

		first=+data[1];
		first=~~(first/100)*60+(first%100);

		valid=lineSet.validBitsTbl[row['valid']];

		key=first+'\t'+row['long'];
		tripNum=line.tripFirstTbl[valid][key];
		trip=line.tripListTbl[valid][tripNum];
		reach.util.assert(trip.startTime==first && trip.key.longCode==row['long'],'DeltaSet.importKalkati','Incorrect tripNum '+tripNum+'.');

		stopNum=0;
		arrival=first;
		prevMins=first;
		for(i=1;i<dataLen;i+=2) {
			mins=+data[i];
			mins=~~(mins/100)*60+(mins%100);
			duration=mins-prevMins;

			if(duration<0) {
				// If arrival time at previous stop is before current stop, it's probably the next day so check if the difference is over 12 hours.
				if(duration<-12*60) duration+=24*60;
				// If the difference is smaller, there must be an error and not much we can do.
				else duration=0;
			}
			if(duration>12*60) duration=0;

			arrival+=duration;
			err=arrival-trip.guessArrival(stopNum);

			if(err<-1 || err>1) {
				if(!deltaList[valid]) deltaList[valid]=/** @type {Array.<Array.<number>>} */ [];
				deltaList[valid].push(/** @type {Array.<number>} */([line.id,tripNum,stopNum,err]));
			}

//console.log(err+'\t'+arrival+'\t'+trip.guessArrival(stopNum));
			err=reach.util.fromSigned(err);
			if(!histogram[err]) histogram[err]=0;
			histogram[err]++;

			prevMins=mins;
			stopNum++;
		}
	}

	this.deltaList=deltaList;
	return(histogram);
};

/** @param {function(string)} write */
reach.trans.DeltaSet.prototype.exportPack=function(write) {
	var codec=new reach.data.Codec();
	var validNum,validCount;
	var data;
	var deltaList;
	var deltaNum,deltaCount;
	var prevLine,prevTrip,prevStop,prevErr,err;
	var out;
	var data2;
	var txt;

	/** @param {Array.<number>} a
	  * @param {Array.<number>} b */
	function compareDeltas(a,b) {
		var d;
		d=a[0]-b[0];if(d) return(d);
		d=a[1]-b[1];if(d) return(d);
		d=a[2]-b[2];if(d) return(d);
		d=a[3]-b[3];
		return(d);
	}

	validCount=this.deltaList.length;
	write(codec.encodeShort([validCount]));

	for(validNum=0;validNum<validCount;validNum++) {
		deltaList=this.deltaList[validNum];
		if(!deltaList) {
			write(codec.encodeShort([0]));
			continue;
		}

		deltaList.sort(compareDeltas);

		prevLine=0;
		prevTrip=0;
		prevStop=0;

		deltaCount=deltaList.length;
		data2=[];

		for(deltaNum=0;deltaNum<deltaCount;deltaNum++) {
			data=deltaList[deltaNum];
//console.log(data);
//console.log(this.city.lineSet.list[data[0]].tripListTbl[validNum][data[1]].name+'\t'+this.city.lineSet.list[data[0]].tripListTbl[validNum][data[1]].startTime);
			err=reach.util.fromSigned(data[3]);

			if(data[0]==prevLine && data[1]==prevTrip && data[2]==prevStop+1) {
				if(err==prevErr) out=[9];
				else out=[10,err];
			} else {
				if(data[0]!=prevLine) {
					prevTrip=0;
					prevStop=0;
				}
				else if(data[1]!=prevTrip) prevStop=0;

				if(data[0]-prevLine<3 && data[1]-prevTrip<3) {
//					console.log(((data[0]-prevLine)*3+data[1]-prevTrip)+'\t'+(data[2]-prevStop)+'\t'+err);
					out=[((data[0]-prevLine)*3+data[1]-prevTrip),(data[2]-prevStop),err];
				} else {
//					console.log((data[0]-prevLine+11)+'\t'+(data[1]-prevTrip)+'\t'+(data[2]-prevStop)+'\t'+err);
					out=[(data[0]-prevLine+11),(data[1]-prevTrip),(data[2]-prevStop),err];
				}
			}

			data2.push(codec.encodeShort(out));

			prevLine=data[0];
			prevTrip=data[1];
			prevStop=data[2];
			prevErr=err;
		}

		txt=codec.compressBytes(data2.join(''),256,10000);
		write(codec.encodeShort([deltaCount,txt.length]));
		write(txt);
	}
};

/** @param {reach.data.Stream} stream
  * @param {reach.trans.LineSet} lineSet
  * @return {function():number} */
reach.trans.DeltaSet.prototype.importPack=function(stream,lineSet) {
	var deltaNum,deltaCount;
	/** @type {number} */
	var tripCount;
	var validNum,validCount;
	/** @type {Array.<boolean>} */
	var validAccept;
	var lineNum,tripNum,stopNum;
	var line;
	var trip;
	var err;
	var dec;
	var pos,pos2,len;
	var decomp;
	var data,data2;
	var step;

	var advance=function() {
		var data;
		var deltaStream;
		var lineDelta;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				validCount=stream.readShort(1)[0];
				validAccept=lineSet.validAccept;
				validNum=0;

			case 1:
				deltaCount=stream.readShort(1)[0];
				tripCount+=deltaCount;

				if(deltaCount==0) {
					validNum++;
					break;
				}

				len=stream.readShort(1)[0];

				if(validAccept && !validAccept[validNum]) {
					stream.pos+=len;
					validNum++;
					break;
				}

				data=stream.readPack(len,10000);
				deltaStream=new reach.data.Stream(data);

				lineNum=0;
				tripNum=0;
				stopNum=0;
				err=0;
//!!!
				for(deltaNum=0;deltaNum<deltaCount;deltaNum++) {
					lineDelta=deltaStream.readShort(1)[0];

					if(lineDelta==9) {
						stopNum++;
					} else if(lineDelta==10) {
						err=reach.util.toSigned(deltaStream.readShort(1)[0]);
						stopNum++;
					} else if(lineDelta<9) {
						dec=deltaStream.readShort(2);
						lineNum+=~~(lineDelta/3);
						if(lineDelta>2) tripNum=0;
						if(lineDelta!=0) stopNum=0;
						tripNum+=lineDelta%3;
						stopNum+=dec[0];
						err=reach.util.toSigned(dec[1]);
					} else {
						dec=deltaStream.readShort(3);
						lineNum+=lineDelta-11;
						if(lineDelta>11) {tripNum=0;stopNum=0;}
						if(dec[1]>0) stopNum=0;
						tripNum+=dec[0];
						stopNum+=dec[1];
						err=reach.util.toSigned(dec[2]);
					}

					line=lineSet.list[lineNum];
					trip=line.tripListTbl[validNum][tripNum];
					if(!trip.deltaList) {
						trip.deltaList=typeof(Uint32Array)!='undefined'?new Uint32Array(line.stopList.length):[];
					}
					if(!trip.deltaList[stopNum>>2]) trip.deltaList[stopNum>>2]=0x80808080;
					trip.deltaList[stopNum>>2]^=(((err+128)&255)^0x80)<<((stopNum&3)*8);
//console.log(((trip.deltaList[stopNum>>2]>>>((stopNum&3)*8))&255)-128);
//					console.log(validNum+'\t'+lineNum+'\t'+tripNum+'\t'+stopNum+'\t'+err);
//for(var x in line.tripListTbl) console.log(x);
//					console.log(line.tripListTbl.length+'\t'+line.tripListTbl[validNum]);
//console.log(line.tripListTbl[validNum][tripNum].deltaList);
				}

				validNum++;
				break;
		}

		return(validCount-validNum);
	};

	tripCount=0;
	step=0;
	return(advance);
};
