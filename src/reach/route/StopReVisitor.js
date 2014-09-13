goog.provide('reach.route.StopReVisitor');
goog.require('reach.route.TripReVisitor');
goog.require('reach.route.Terminator');
goog.require('reach.route.Visitor');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor}
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.trans.Stop} stop
  * @param {number} cost
  * @param {number} time
  * @param {reach.trans.Stop} srcTransStop
  * @param {number} srcDataNum
  * @param {Array.<reach.trans.Stop>} srcWalkStopList
  * @param {Array.<number>} srcWalkNumList */
reach.route.StopReVisitor=function(dijkstra,stop,cost,time,srcTransStop,srcDataNum,srcWalkStopList,srcWalkNumList) {
	reach.route.Visitor.call(this);
	/** @type {reach.trans.Stop} */
	this.stop=stop;
	/** @type {number} */
	this.cost=cost;
	/** @type {number} */
	this.time=time;
	/** @type {reach.trans.Stop} */
	this.srcTransStop=srcTransStop;
	/** @type {number} */
	this.srcDataNum=srcDataNum;
	/** @type {reach.trans.Stop} */
	this.srcWalkStopList=srcWalkStopList;
	/** @type {number} */
	this.srcWalkNumList=srcWalkNumList;

	if(stop.runId>=dijkstra.origRunId && stop.runId<dijkstra.runId && stop.cost) {
        // If this node hasn't been seen before in this Dijkstra run,
        // it may still contain old routing data from a previous run. Remove the data.
		stop.runId=dijkstra.runId;
		stop.reverseDataList=[];
		stop.reverseData=null;
		stop.lastVisitTime=0;
		stop.lastTimeList=[];
		stop.lastTripList=null;
	}
};

//reach.route.StopReVisitor.prototype=new reach.route.Visitor();
reach.inherit(reach.route.StopReVisitor,reach.route.Visitor);

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.StopReVisitor.prototype.visit=function(dijkstra) {
	var stop;
	var nodeNum;
	var node;
	var tripNum;
	var trip;
	var line;
	var pos;
	var dist;
	var duration;
	var cost,prevCost;
	var enterCostTbl,leaveCostTbl;
	var modeCost;
	var visitTime,firstTime,waitTime;
	var prevStop;
	var lastTripList;
	var lastTimeList;
	var reverseDataList;
	var dataNum;
	var data;
	var first,mid,last;

	stop=this.stop;
	// Exit if this stop wasn't found in first Dijkstra run or it was reached before current time, so the original starting time will be unreachable.
	if(stop.runId!=dijkstra.runId || this.time<stop.node.time) return(reach.route.Visitor.State.OK);

	//console.log('\n'+reach.util.formatSecs(this.time/dijkstra.conf.timeDiv)+'\t'+this.cost+'\t'+stop.origId+' '+stop.name+'\t(Stop time '+reach.util.formatSecs(stop.time/dijkstra.conf.timeDiv)+')');
//console.log(stop.lastVisitTime+'\t'+this.time);

	if(!stop.lastVisitTime) {
		stop.reverseData={
			cost:this.cost,
			revTransStop:this.srcTransStop,
			revDataNum:this.srcDataNum,
			revWalkStopList:this.srcWalkStopList,
			revWalkNumList:this.srcWalkNumList,
			revTime:this.time
		};
	}

	dataNum=-1;
	if(stop.lastVisitTime<this.time) {
		// Find all arrivals to this stop, using lines found in first Dijkstra run, between lastVisitTime and time.
		stop.lastVisitTime=this.time;

		lastTripList=stop.lastTripList;
		lastTimeList=stop.lastTimeList;

		// Make list of all initial arrival times if this stop hasn't been processed before.
		if(!lastTripList) {
			lastTripList=[];
			lastTimeList=[];
			stop.lastTimeList=lastTimeList;
			stop.lastTripList=lastTripList;
//console.log(stop.srcTripList.length);
//console.log(stop.srcNodeList.length);

			for(tripNum=stop.srcTripList.length;tripNum--;) {
				trip=stop.srcTripList[tripNum];
				pos=stop.srcPosList[tripNum];

				lastTripList[tripNum]=trip;
				lastTimeList[tripNum]=trip.guessArrival(pos)*60*dijkstra.conf.timeDiv;
//console.log(reach.util.formatSecs(lastTimeList[tripNum]/dijkstra.conf.timeDiv)+'\t'+lastTripList[tripNum].key.longCode);
			}
		}

		reverseDataList=[];

		// Find all arrival times up to current time and store first out of range time
		// of each line in case a later arrival to this stop is found later.
		for(tripNum=lastTripList.length;tripNum--;) {
			trip=lastTripList[tripNum];
			if(!trip) continue;

			line=trip.key.line;
			visitTime=lastTimeList[tripNum];
			pos=stop.srcPosList[tripNum];

			while(visitTime<=this.time) {
//if(trip.key.line!=stop.srcTripList[tripNum].key.line) console.log('HUH '+trip.key.longCode+' '+stop.srcTripList[tripNum].key.longCode);
//if(pos>trip.key.line.stopList.length) console.log('WTF '+pos+' '+trip.key.line.stopList.length+' '+stop.srcTripList[tripNum].key.line.stopList.length+' '+stop.srcPosList[tripNum]);
				reverseDataList.push({time:visitTime,cost:0,trip:trip,pos:pos,revTransStop:null,revDataNum:0,revWalkStop:null,revWalkNum:0,revTime:0});

				trip=line.tripList[trip.num+1];
				if(!trip) {
					// Store info that later arrivals on this line don't exist.
					lastTripList[tripNum]=null;
					lastTimeList[tripNum]=0;
					break;
				}

				visitTime=trip.guessArrival(pos)*60*dijkstra.conf.timeDiv;
				// Store next arrival (which may be after current time, in which case loop then ends).
				lastTripList[tripNum]=trip;
				lastTimeList[tripNum]=visitTime;
			}
		}

		// Sort newly found arrivals and append them to previous ones.
		reverseDataList.sort(function(a,b) {return(a.time-b.time)});
		// Append reverseDataList to stop's reverseDataList, modifying it.
		stop.reverseDataList.push.apply(stop.reverseDataList,reverseDataList);
		reverseDataList=stop.reverseDataList;

		// All arrivals are reachable since they were before current time.
		dataNum=reverseDataList.length-1;
	} else if(stop.reverseDataList.length>0) {
		//console.log('REVISIT\t'+reach.util.formatSecs(this.time/dijkstra.conf.timeDiv)+'\t'+stop.name);
		reverseDataList=stop.reverseDataList;

		// Use binary search to find arrivals before current time.
		mid=0;
		first=0;
		last=reverseDataList.length-1;

		while(first<=last) {
			mid=(first+last)>>1;
			visitTime=reverseDataList[mid].time;
			if(visitTime<this.time) first=mid+1;
			else if(visitTime>this.time) last=mid-1;
			else break;
		}

		// Include more arrival times before current time if the binary search left some out.
		last=reverseDataList.length-1;
		while(visitTime<=this.time && mid<last) {
			mid++;
			visitTime=reverseDataList[mid].time;
		}
		if(visitTime>this.time) {
			mid--;
			// If even a later arrival already has a lower cost, no point in exploring this stop visit.
			prevCost=reverseDataList[mid+1].cost;
			cost=this.cost+(this.time-reverseDataList[mid+1].time)*dijkstra.conf.waitCostMul;
			if(prevCost && cost>=prevCost) return(reach.route.Visitor.State.OK);
		}

		// Arrivals found to be before current time are reachable.
		dataNum=mid;
	}

	enterCostTbl=dijkstra.conf.enterModeCost;
	leaveCostTbl=dijkstra.conf.leaveModeCost;
	if(!enterCostTbl) enterCostTbl={};
	if(!leaveCostTbl) leaveCostTbl={};

	// Calculate costs for all reachable arrivals.
	if(dataNum>=0) {
		dataNum++;
		while (dataNum--) {
			data=reverseDataList[dataNum];
			prevCost=data.cost;
			cost=this.cost+(this.time-data.time)*dijkstra.conf.waitCostMul;

			// Add transfer cost.
			modeCost=leaveCostTbl[data.trip.key.mode];
			if(!modeCost) modeCost=dijkstra.conf.leaveCost;
			modeCost*=60*dijkstra.conf.timeDiv*(1/2+1/(2+2*stop.departureCount/dijkstra.conf.niceDepartures));
			cost+=modeCost;

			// If arrival was already reached with lower cost, the earlier ones will also be better than can be reached here so stop calculating costs.
			if(prevCost && cost>=prevCost) break;

			data.cost=cost;
			data.revTransStop=this.srcTransStop;
			data.revDataNum=this.srcDataNum;
			data.revWalkStopList=this.srcWalkStopList;
			data.revWalkNumList=this.srcWalkNumList;
			data.revTime=this.time;

			//console.log(reach.util.formatSecs(data.time/dijkstra.conf.timeDiv)+'\t'+data.trip.key.longCode+'\t'+this.cost+'\t'+cost);
			dijkstra.found(new reach.route.TripReVisitor(dijkstra,stop,cost,dataNum));
		}
	}

	// If the starting point can be reached from this stop at some cost, there's no need to find more points with higher cost.
	if(stop.endWalk) dijkstra.found(new reach.route.Terminator(dijkstra,this.cost+stop.endWalk.cost));

	// All walkable stops need to be reprocessed.
	for(nodeNum=stop.srcNodeList.length;nodeNum--;) {
		node=stop.srcNodeList[nodeNum];
		dist=0;

		while(node.srcNode) {
			dist+=node.distList[node.followerTbl[node.srcNode.id]-1];
			node=node.srcNode;
//			console.log(reach.util.formatSecs(node.time/dijkstra.conf.timeDiv));
		}

		duration=dist*dijkstra.conf.walkTimePerM;
		cost=this.cost+duration*dijkstra.conf.walkCostMul;

		if(node.srcStop) {
			dijkstra.found(new reach.route.StopReVisitor(dijkstra,node.srcStop,cost,this.time-duration,this.srcTransStop,this.srcDataNum,this.srcWalkStopList?this.srcWalkStopList.concat([stop]):[stop],this.srcWalkNumList?this.srcWalkNumList.concat([nodeNum]):[nodeNum]));
			//console.log('Could have walked from '+node.srcStop.name+' '+reach.util.formatSecs((time+node.time)/dijkstra.conf.timeDiv)+' - '+reach.util.formatSecs(this.time/dijkstra.conf.timeDiv)+' (original arrival time '+reach.util.formatSecs(node.srcStop.time/dijkstra.conf.timeDiv)+' / '+reach.util.formatSecs(node.time/dijkstra.conf.timeDiv)+')\t'+stop.origId+'\t'+stop.name+'\t'+this.cost+'\t'+(cost-node.cost));
		}
	}

	return(reach.route.Visitor.State.OK);
};
