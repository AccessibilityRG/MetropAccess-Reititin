goog.provide('reach.trans.TripSet');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.Line');
goog.require('reach.trans.Trip');
goog.require('reach.data.Codec');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.TripSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<{keyIdList:Array.<number>,tripDataTbl:Object.<number,{len:number,list:Array.<reach.trans.Trip>}>}>} */
	this.tripValidList;
	/** @type {Array.<string>} */
	this.keyList;
	/** @type {number} */
	this.keyMaxLen=0;
};

/** @param {reach.trans.LineSet} lineSet */
reach.trans.TripSet.prototype.populate=function(lineSet) {
	var lineNum,lineCount;
	var tripNum,tripCount;
	var line,trip;
	var tripData;
	var tripList;
	var tripKeyStruct;
	/** @type {Array.<{keyIdList:Array.<number>,tripDataTbl:Object.<number,{len:number,list:Array.<reach.trans.Trip>}>}>} */
	var tripValidList=[];
	/** @type {Object.<string,number>} */
	var keyTbl={};
	/** @type {Array.<string>} */
	var keyList=[];
	var keyId,keyCount,keyMaxLen;
	var keyData;

	lineCount=lineSet.list.length;

	keyCount=0;
	keyMaxLen=0;

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineSet.list[lineNum];

		for(var validId in line.tripListTbl) {
			if(!line.tripListTbl.hasOwnProperty(validId)) continue;

			// TODO: rename tripList and/or tripList2
			var tripList2=line.tripListTbl[+validId];
			tripCount=tripList2.length;
			for(tripNum=0;tripNum<tripCount;tripNum++) {
				trip=tripList2[tripNum];
				reach.util.assert(trip.key.line.id==lineNum,'exportTripPack','Incorrect line ID.');
				keyData=lineNum+'\t'+trip.key.mode+'\t'+trip.key.longCode+'\t'+trip.key.shortCode+'\t'+trip.key.name;

				keyId=keyTbl[keyData];
				if(!keyId && keyId!==0) {
					if(keyData.length>keyMaxLen) keyMaxLen=keyData.length;

					keyId=keyCount++;
					keyTbl[keyData]=keyId;
					keyList[keyId]=keyData;
				}

				tripKeyStruct=tripValidList[+validId];
				if(!tripKeyStruct) {
					tripKeyStruct={keyIdList:/** @type {Array.<number>} */ [],tripDataTbl:/** @type {Object.<number,{len:number,list:Array.<reach.trans.Trip>}>} */ {}};
					tripValidList[+validId]=tripKeyStruct;
				}

				tripData=tripKeyStruct.tripDataTbl[keyId];
				if(tripData) {
					tripList=tripData.list;
				} else {
					tripList=[];
					tripData={len:0,list:tripList};

					tripKeyStruct.tripDataTbl[keyId]=tripData;
					tripKeyStruct.keyIdList.push(keyId);
				}

				tripList[tripData.len++]=trip;
			}
		}
	}

	this.tripValidList=tripValidList;
	this.keyMaxLen=keyMaxLen;
	this.keyList=keyList;
};

/** @param {function(string)} write
  * @param {reach.trans.LineSet} lineSet */
reach.trans.TripSet.prototype.exportPack=function(write,lineSet) {
	var codec=new reach.data.Codec();
	var validNum,validCount;
	var keyNum,keyCount;
	var tripNum,tripCount;
	var tripList;
	var trip;
	var keyId,prevKeyId;
	var wait,prevWait;
	var prevId,prevStart,prevDuration;
	var tripKeyStruct;
	var data,row;
	var txt;
	var a,b;

	txt=codec.compressBytes(this.keyList.join('\n'),this.keyMaxLen,10000);
	write(codec.encodeLong([txt.length]));
	write(txt);

	validCount=this.tripValidList.length;
	write(codec.encodeLong([validCount]));

	for(validNum=0;validNum<validCount;validNum++) {
		write(codec.encodeShort(lineSet.validList[validNum]));
	}

	for(validNum=0;validNum<validCount;validNum++) {
		tripKeyStruct=this.tripValidList[validNum];
		if(!tripKeyStruct) {
			write(codec.encodeLong([0,0]));
			continue;
		}

		data=[];

//		prevId=0;
		keyId=0;
		keyCount=tripKeyStruct.keyIdList.length;

		for(keyNum=0;keyNum<keyCount;keyNum++) {
			prevKeyId=keyId;
			keyId=tripKeyStruct.keyIdList[keyNum];
			row=[];

			tripList=tripKeyStruct.tripDataTbl[keyId].list;
			tripCount=tripList.length;

			prevStart=0;
			prevWait=0;
			prevDuration=0;

			for(tripNum=0;tripNum<tripCount;tripNum++) {
				trip=tripList[tripNum];

				wait=trip.startTime-prevStart;
				a=reach.util.fromSigned(wait-prevWait);
				b=reach.util.fromSigned(trip.duration-prevDuration);
//				c=reach.util.fromSigned(trip.id-prevId);

//				prevId=trip.id;
				prevStart=trip.startTime;
				if(tripNum>0) prevWait=wait;
				prevDuration=trip.duration;

//				if(a<3 && b<3 && c==2) row.push(a*3+b);
//				else row.push(a+9,b,c);
				if(a<3 && b<3) row.push(a*3+b);
				else row.push(a+9,b);
			}

			txt=codec.encodeShort(row);
			data.push(codec.encodeShort([reach.util.fromSigned(keyId-prevKeyId),row.length]),txt);
		}

		txt=data.join('');

		txt=codec.compressBytes(txt,txt.length,10000);
		write(codec.encodeShort([keyCount,txt.length]));
		write(txt);
	}

	write('\n');
};

/** @param {reach.data.Stream} stream
  * @param {reach.trans.LineSet} lineSet
  * @param {Array.<number>} validMask
  * @return {function():number} */
reach.trans.TripSet.prototype.importPack=function(stream,lineSet,validMask) {
	var validAccept;
	var validNum,validCount;
	/** @type {number} */
	var tripCount;
	/** @type {Array.<string>} */
	var keyList;
	var keyId;
	var step;

	var advance=function() {
		var validStream;
		var data;
		var dec;
		var len,i;
		var rowLen;
		var keyNum,keyCount;
		var keyData;
		/** @type {{mode:number,longCode:?string,shortCode:?string,name:?string,line:reach.trans.Line}} */
		var key;
		var a,b;
		var startTime,wait,duration;
		var line,trip;
		var first;

		switch(step) {
			// Initialize. 
			case 0:
				step++;

			// Read list of trip codes and names.
			case 1:
				step++;

				data=stream.readPack(stream.readLong(1)[0],10000);
				keyList=data.split('\n');
				return(1);

			// Initialize loop to read trip data.
			case 2:
				step++;

				// Number of timetable valid day masks.
				validCount=stream.readLong(1)[0];
				validAccept=[];

				// Load all masks.
				for(validNum=0;validNum<validCount;validNum++) {
					// Number of calendar days the mask covers.
					len=stream.readShort(1)[0];
					// number of data bytes each with 6 bits of mask.
					i=~~((len+5)/6);

					// Read mask data.
					dec=stream.readShort(i);

					// Initially mark the mask as not matching.
					validAccept[validNum]=false;

					// Compare timetable validity mask with bit field of days for which to load schedule data.
					while(i--) {
						if(dec[i]&validMask[i+1]) {
							// If the timetable validity mask contains days for which we want to load data, mark it as matching.
							validAccept[validNum]=true;
							break;
						}
					}
				}

				// Store IDs of interesting timetable validity masks.
				lineSet.validAccept=validAccept;
//console.log(validMask);
//console.log(validAccept);

				validNum=0;
				break;

			// Iterate to read trip data for different sets of valid days.
			case 3:
				dec=stream.readShort(2);
				keyCount=dec[0];
				len=dec[1];

				tripCount+=keyCount;

				if(!validAccept[validNum]) {
					stream.pos+=len;
					validNum++;
					break;
				}

				data=stream.readPack(len,-1);
				validStream=new reach.data.Stream(data);
				keyId=0;

				for(keyNum=0;keyNum<keyCount;keyNum++) {
					dec=validStream.readShort(2);
					keyId+=reach.util.toSigned(dec[0]);
					rowLen=dec[1];

					keyData=keyList[keyId].split('\t');
					line=lineSet.list[+keyData[0]];
					key={line:line,mode:+keyData[1],longCode:keyData[2],shortCode:keyData[3],name:keyData[4]};

					dec=validStream.readShort(rowLen);

					wait=0;
					startTime=0;
					duration=0;
					first=true;

					for(i=0;i<rowLen;) {
						a=dec[i++];
						if(a<9) {
							b=a%3;
							a=(a-b)/3;
						} else {
							a-=9;
							b=dec[i++];
						}

						wait+=reach.util.toSigned(a);
						duration+=reach.util.toSigned(b);
						startTime+=wait;

						if(first) wait=0;

						trip=new reach.trans.Trip(line,key);
						trip.startTime=startTime;
						trip.duration=duration;
//console.log(trip.key.longCode+' '+startTime+' '+duration);

						if(!line.tripListTbl[validNum]) line.tripListTbl[validNum]=[];
						line.tripListTbl[validNum].push(trip);

						if(!line.transModeTbl[trip.key.mode]) line.transModeTbl[trip.key.mode]=0;
						line.transModeTbl[trip.key.mode]++;

						first=false;
					}
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
