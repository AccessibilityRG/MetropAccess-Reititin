goog.provide('reach.road.TileTree');
goog.require('reach.road.Tile');
//goog.require('reach.route.InputPoint');
goog.require('reach.data.Codec');
goog.require('reach.util');
goog.require('reach.MU');

/** @constructor
  * @param {function(reach.road.Tile,reach.task.Task):reach.task.Task} loadTile */
reach.road.TileTree=function(loadTile) {
	/** @type {number} */
	this.tileCount=0;
	/** @type {reach.road.Tile} */
	this.root=new reach.road.Tile(this,'0',this.tileCount++,0,0,reach.MU.range,reach.MU.range);
	/** @type {Array.<reach.road.Tile>} */
	this.tileList=[];
	/** @type {function(reach.road.Tile,reach.task.Task):reach.task.Task} */
	this.loadTile=loadTile;
	/** @type {Object.<reach.road.Tile.Persist,Array.<reach.road.Node>>} */
	this.persistNodeTbl={};
	/** @type {Object.<reach.road.Tile.Persist,Array.<reach.road.Way>>} */
	this.persistWayTbl={};
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.road.TileTree.prototype.importPack=function(stream) {
	/** @type {reach.road.TileTree} */
	var self=this;
	var step;
	var splitCount;
	/** @type {Array.<number>} */
	var data;
	var dataPos;
	var tileList;
	/** @type {Array.<reach.road.Tile>} */
	var tileStack;
	var tileCount;

	var advance=function() {
		var sEdge,wEdge,nEdge,eEdge;
		var latSplit,lonSplit;
		var tile;
		var path;
		var i;
		var n;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				splitCount=stream.readShort(1)[0];
				data=stream.readShort(~~(splitCount/3)+1);
				dataPos=0;

				tileList=self.tileList;
				tileStack=/** @type {Array.<reach.road.Tile>} */ [self.root];
				tileCount=self.tileCount;
				return(splitCount);

			case 1:
				n=data[dataPos++];
				for(i=0;i<3 && splitCount;i++) {
					tile=/** @type {reach.road.Tile} */ tileStack.pop();
					tileList[tile.id]=tile;
					path=tile.path;

					sEdge=tile.sEdge;
					wEdge=tile.wEdge;
					nEdge=tile.nEdge;
					eEdge=tile.eEdge;
					latSplit=sEdge+((nEdge-sEdge)>>>1);
					lonSplit=wEdge+((eEdge-wEdge)>>>1);

					splitCount--;
					if((n&3)==2) tile.isLeaf=true;
					if((n&3)==1) {
						tileStack.push(tile.se=new reach.road.Tile(self,path+'3',tileCount++,sEdge,lonSplit,latSplit,eEdge));
						tileStack.push(tile.sw=new reach.road.Tile(self,path+'2',tileCount++,sEdge,wEdge,latSplit,lonSplit));
						tileStack.push(tile.ne=new reach.road.Tile(self,path+'1',tileCount++,latSplit,lonSplit,nEdge,eEdge));
						tileStack.push(tile.nw=new reach.road.Tile(self,path+'0',tileCount++,latSplit,wEdge,nEdge,lonSplit));
					}

					n=n>>>2;
				}

				return(splitCount);
		}
	};

	step=0;
	return(advance);
};

/** @param {reach.MU} ll
  * @param {number} depth Zero for unlimited.
  * @return {reach.road.Tile} */
reach.road.TileTree.prototype.findTile=function(ll,depth) {
	var lat,lon;
	var latSplit,lonSplit;
	var tile,next;

	tile=this.root;
	next=this.root;

	lat=ll.llat;
	lon=ll.llon;

	while(next && --depth) {
		tile=next;
		latSplit=tile.sEdge+((tile.nEdge-tile.sEdge)>>>1);
		lonSplit=tile.wEdge+((tile.eEdge-tile.wEdge)>>>1);

		if(lat<latSplit) next=(lon<lonSplit)?tile.sw:tile.se;
		else next=(lon<lonSplit)?tile.nw:tile.ne;
	}

	return(tile);
};

/** @param {number} boundS
  * @param {number} boundW
  * @param {number} boundN
  * @param {number} boundE
  * @return {reach.road.Tile} */
reach.road.TileTree.prototype.findBoxTile=function(boundS,boundW,boundN,boundE) {
	var latSplit,lonSplit;
	var tile,next;

	tile=this.root;
	next=this.root;

	while(next) {
		tile=next;
		latSplit=tile.sEdge+((tile.nEdge-tile.sEdge)>>>1);
		lonSplit=tile.wEdge+((tile.eEdge-tile.wEdge)>>>1);

		// If tile's center meridian or circle of latitude crosses the bounding box, tile is the innermost tile containing the box.
		if((boundS<latSplit && boundN>=latSplit) || (boundW<lonSplit && boundE>=lonSplit)) return(tile);

		if(boundN<latSplit) next=(boundE<lonSplit)?tile.sw:tile.se;
		else next=(boundE<lonSplit)?tile.nw:tile.ne;
	}

	return(tile);
};

/** @param {function(reach.road.Tile)} handler */
reach.road.TileTree.prototype.forEach=function(handler) {
	/** @param {reach.road.Tile} tile */
	function rec(tile) {
		if(!tile) return;
		handler(tile);

		rec(tile.nw);
		rec(tile.ne);
		rec(tile.sw);
		rec(tile.se);
	}

	rec(this.root);
};

/** @param {string} data */
/*
reach.road.TileTree.prototype.importText=function(data) {
	var codec=new reach.data.Codec();
	var decomp;
	var dec;
	var pos,len;

	pos=0;

	dec=codec.decodeLong(data,pos,1);
	pos=dec[0];
	len=dec[1];

	decomp=codec.decompressBytes(data,pos,len,10000);
	pos=decomp.pos;
	this.typeList=decomp.data.split('\n');

	dec=codec.decodeLong(data,pos,1);
	pos=dec[0];
	len=dec[1];

	decomp=codec.decompressBytes(data,pos,len,10000);
	pos=decomp.pos;
	this.nameList=decomp.data.split('\n');
};
*/

/** @param {string} data */
//reach.road.TileTree.prototype.importTempPack=function(data) {
	/** @type {reach.road.TileTree} */
//	var self=this;
	/** @type {number} */
//	var pos;

//	pos=0;
//	this.forEach(importTile);

	/** @param {reach.road.Tile} tile */
//	function importTile(tile) {
//		pos=tile.importPack(data,pos,self.typeList,self.nameList);
//	}
//};

/** @param {function(string)} write
  * @return {{typeList:Array.<string>,nameList:Array.<string>}} */
//reach.road.TileTree.prototype.exportTempPack=function(write) {
	/** @type {reach.data.Codec} */
//	var codec=new reach.data.Codec();
	/** @type {Array.<string>} */
//	var typeList;
	/** @type {Object.<string,number>} */
//	var typeTbl;
	/** @type {Array.<string>} */
//	var nameList;
	/** @type {Object.<string,number>} */
//	var nameTbl;
//	var typeNum,typeCount,typeLen;
//	var nameNum,nameCount,nameLen;
//	var len;

//	typeList=/** @type {Array.<string>} */ [];
//	typeTbl=/** @type {Object.<string,number>} */ {};
//	nameList=/** @type {Array.<string>} */ [];
//	nameTbl=/** @type {Object.<string,number>} */ {};

//	this.forEach(
		/** @param {reach.road.Tile} tile */
//		function(tile) {
//			if(!tile.isLeaf) return;

//			tile.exportPack(write,typeList,typeTbl,nameList,nameTbl);
//		}
//	);

//	return({typeList:typeList,nameList:nameList,typeLen:typeLen,nameLen:nameLen});
//};

/** @param {reach.MU} ll
  * @param {function(reach.road.Tile)} loadTile
  * @param {number} runId
  * @param {number} snapDist
  * @return {function():reach.road.NearWay} */
// This never returns null even if Tile.findWay does. Instead a sentinel with null way is returned.
reach.road.TileTree.prototype.findWay=function(ll,loadTile,runId,snapDist) {
	/** @type {reach.road.TileTree} */
	var self=this;
	/** @type {Array.<reach.road.Tile>} */
	var tileStack;
	var stackPos;
	/** @type {reach.road.NearWay} */
	var nearest;
	/** @type {reach.road.NearWay} */
	var sentinel;
	var lat,lon;

	lat=ll.llat;
	lon=ll.llon;

	snapDist=ll.llat-ll.offset(-snapDist,0).llat;

	tileStack=/** @type {Array.<reach.road.Tile>} */ [this.root];
	stackPos=1;
	sentinel=/** @type {reach.road.NearWay} */ {way:null,dist:snapDist*snapDist};
	nearest=sentinel;


	function advance() {
		var latSplit,lonSplit;
		var tile,next;
		var maybeNearest;
		var tileList;
		var tileNum;
		var dist;

		while(stackPos>0) {
			tile=tileStack[--stackPos];
			dist=tile.sqDistTo(lat,lon);

			if(dist>nearest.dist) continue;

			if(tile.isLeaf) {
				if(!tile.loaded) {
					// Put tile back in stack and come back to this function when it's loaded.
					stackPos++;
					loadTile(tile);
					return(null);
				}
				maybeNearest=tile.findWay(ll,runId);
				if(maybeNearest && maybeNearest.dist<nearest.dist) nearest=maybeNearest;
				continue;
			}

			latSplit=tile.sEdge+((tile.nEdge-tile.sEdge)>>1);
			lonSplit=tile.wEdge+((tile.eEdge-tile.wEdge)>>1);

			if(lat<latSplit) next=(lon<lonSplit)?tile.sw:tile.se;
			else next=(lon<lonSplit)?tile.nw:tile.ne;

			// Check other quadrants if necessary.
			tileList=/** @type {Array.<reach.road.Tile>} */ [tile.nw,tile.ne,tile.sw,tile.se];
			for(tileNum=0;tileNum<4;tileNum++) {
				tile=tileList[tileNum];
				if(tile && tile!=next) tileStack[stackPos++]=tile;
			}

			// Find closest segment in quadrant where reference point belongs.
			if(next) tileStack[stackPos++]=next;
		}

		if(nearest && nearest!=sentinel) {
			tile=self.findTile(nearest.ll,0);
			if(!tile.loaded) {
				// Come back here when the tile is loaded.
				loadTile(tile);
				// Make sure stack is empty so next call we come straight back to this point.
				stackPos=0;
				return(null);
			}
			nearest=tile.findWay(ll,runId);
			if(nearest && nearest!=sentinel) {
				nearest.ll.llat=~~(nearest.ll.llat+0.5);
				nearest.ll.llon=~~(nearest.ll.llon+0.5);
//				if(nearest.pos==1) {
//					nearest.pos=0;
//					nearest.nodeNum++;
//				}
			}
		}

		return(nearest);
	}

	return(advance);
};

/** @param {string} data
  * @param {reach.road.Tile} tile */
/*
reach.road.TileTree.prototype.importTilePack=function(data,tile) {
	var codec=new reach.data.Codec();
	var pos,len;
	var dec;
	var decomp;
	var typeList,nameList;

	pos=0;

	dec=codec.decodeLong(data,pos,1);
	pos=dec[0];
	len=dec[1];

	decomp=codec.decompressBytes(data,pos,len,10000);
	pos=decomp.pos;
	typeList=decomp.data.split('\n');

	dec=codec.decodeLong(data,pos,1);
	pos=dec[0];
	len=dec[1];

	decomp=codec.decompressBytes(data,pos,len,10000);
	pos=decomp.pos;
	nameList=decomp.data.split('\n');

	tile.importPack(data,pos,typeList,nameList);
};
*/

/** @param {reach.data.Stream} stream
  * @param {Array.<reach.trans.Stop>} stopList
  * @return {function():number} */
reach.road.TileTree.prototype.importStopRefPack=function(stream,stopList) {
	/** @type {reach.road.TileTree} */
	var self=this;
	var stopCount,stopNum;
	var step;

	var advance=function() {
		var stop;
		var lat,lon;
		var llPrev,llNext;
		var way,node;
		var ll;
		var dec;
		var i;

		switch(step) {
			// Initialize. 
			case 0:
				step++;

				stopCount=stopList.length;
				stopNum=0;

				return(stopCount);

			case 1:
				if(stopNum>=stopCount) return(0);

				stop=stopList[stopNum];
				lat=stop.ll.llat;
				lon=stop.ll.llon;
				dec=stream.readShort(4);

				llPrev=new reach.MU(lat+reach.util.toSigned(dec[0]),lon+reach.util.toSigned(dec[1]));
				llNext=new reach.MU(lat+reach.util.toSigned(dec[2]),lon+reach.util.toSigned(dec[3]));
				node=self.addCustomNode(stop.ll,llPrev,llNext,reach.road.Tile.Persist.TIMETABLE);

				if(!node.stopList) node.stopList=[];
				node.stopList.push(stop);
//				stop.inputPoint=new reach.route.InputPoint(stop.ll,null,null,stopNum);
//				stop.inputPoint.node=node;

				stopNum++;
				return(stopCount-stopNum);
		}
	};

	step=0;
	return(advance);
};

/** @param {reach.MU} ll
  * @param {reach.MU} llPrev
  * @param {reach.MU} llNext
  * @param {reach.road.Tile.Persist} persist
  * @return {reach.road.Node} */
reach.road.TileTree.prototype.addCustomNode=function(ll,llPrev,llNext,persist) {
	var llSplit;
	var lat,lon;
	var dlat,dlon;
	var dist;
	var posAlong;
	var way;

	lat=ll.llat;
	lon=ll.llon;

	if((lat==llPrev.llat && lon==llPrev.llon) || (lat==llNext.llat && lon==llNext.llon)) {
		// Node already exists so no need to connect.
		return(this.findTile(ll,0).insertNode(ll,persist));
	}

	dlat=llNext.llat-llPrev.llat;
	dlon=llNext.llon-llPrev.llon;

	if(dlat!=0 || dlon!=0) {
		// Stop is connected in the middle of a road, which needs to be split.
		dist=dlat*dlat+dlon*dlon;
		posAlong=0;
		// Dist should be > 0 since dlats/dlons aren't equal but paranoid test anyway to avoid div by zero...
		if(dist>0) {
			// Nearest position to stop along road segment.
			posAlong=((lat-llPrev.llat)*dlat+(lon-llPrev.llon)*dlon)/dist;
			// If the position lies outside the road segment, move it to one of the end points.
			// Shouldn't happen since then the stop would be connected elsewhere.
			if(posAlong<0) posAlong=0;
			if(posAlong>1) posAlong=1;
		}

		// Coordinates where to split existing road segment.
		llSplit=new reach.MU(llPrev.llat + dlat*posAlong,llPrev.llon + dlon*posAlong);

		// Keep the old segment and just add two new ones on top, connected to the split point.
		this.insertWay([llPrev,llSplit],'routing','',reach.road.Way.Access.WALK,persist);
		this.insertWay([llSplit,llNext],'routing','',reach.road.Way.Access.WALK,persist);
	} else {
		// Stop is connected to a road corner.
		llSplit=llPrev;
	}

	// Add a segment connecting the new node to the existing road network.
	// Note: way must start at ll instead of ending there, so that the returned way will be in the same tile as the new node.
	way=this.insertWay([ll,llSplit],'routing','',reach.road.Way.Access.WALK,persist);
	if(way) return(/** @type {reach.road.Node} */ way.pointList[0]);

	// Somehow failed to create a way?! Bind the stop to a dummy node to recover.
	return(this.findTile(ll,0).insertNode(ll,persist));
};

/** @param {Array.<reach.MU>} pointList
  * @param {string} type
  * @param {string} name
  * @param {reach.road.Way.Access} access
  * @param {reach.road.Tile.Persist} persist
  * @return {reach.road.Way} The part of the way fully inside the tile containing the way's starting point. */
reach.road.TileTree.prototype.insertWay=function(pointList,type,name,access,persist) {
	var boundS,boundW,boundN,boundE;
	var pointNum,pointCount;
	/** @type {Array.<number>} */
	var distList;
	var dist;
	var ll,llPrev;
	var tile;
	var result;
	/** @enum {number} */
	var Quad={
		SW:1,
		SE:2,
		NW:4,
		NE:8
	};

	pointCount=pointList.length;
	if(pointCount==0) return(null);

	ll=pointList[0];
	boundS=ll.llat;
	boundW=ll.llon;
	boundN=ll.llat;
	boundE=ll.llon;

	ll=pointList[0];
	distList=/** @type {Array.<number>} */ [];

	// Calculate bounding box and distance between each point for way.
	for(pointNum=0;pointNum<pointCount;pointNum++) {
		llPrev=ll;
		ll=pointList[pointNum];
		if(ll.llat<boundS) boundS=ll.llat;
		if(ll.llon<boundW) boundW=ll.llon;
		if(ll.llat>boundN) boundN=ll.llat;
		if(ll.llon>boundE) boundE=ll.llon;

		distList[pointNum]=ll.distTo(llPrev);
	}

	// Find tile containing entire bounding box.
	tile=this.findBoxTile(boundS,boundW,boundN,boundE);

	if(tile.isLeaf) return(tile.insertWay(pointList,null,distList,type,name,access,persist,false));

	result=null;

	/** @param {reach.road.Tile} tile
	  * @param {number} pointFirst
	  * @param {number} pointLast
	  * @return {number} */
	function handleLeaf(tile,pointFirst,pointLast) {
		var edgeS,edgeW,edgeN,edgeE;
		var pointNum;
		var lat,lon;
		var way;
		var ll;

		edgeS=tile.sEdge;
		edgeW=tile.wEdge;
		edgeN=tile.nEdge;
		edgeE=tile.eEdge;

		for(pointNum=pointFirst+1;pointNum<=pointLast;pointNum++) {
			ll=pointList[pointNum];

			lat=ll.llat;
			lon=ll.llon;

			if(lat<edgeS || lat>=edgeN || lon<edgeW || lon>=edgeE) {
				way=tile.insertWay(pointList.slice(pointFirst,pointNum+1),null,distList.slice(pointFirst,pointNum+1),type,name,access,persist,false);
				return(pointNum);
			}
		}

		way=tile.insertWay(pointList.slice(pointFirst,pointLast+1),null,distList.slice(pointFirst,pointLast+1),type,name,access,persist,false);
		if(!result) result=way;

		return(pointLast+1);
	}

	/** @param {reach.road.Tile} tile
	  * @param {number} pointPrev
	  * @param {number} pointFirst
	  * @param {number} pointLast
	  * @return {number} */
	function rec(tile,pointPrev,pointFirst,pointLast) {
		var edgeS,edgeW,edgeN,edgeE;
		var latSplit,lonSplit;
		var lat,lon,latPrev,lonPrev;
		var quad,quadPrev,quadMid;
		var pointNum;
		var next,prev;
		var ll;

		// TODO: handle reasonably the case that a line to be added goes through a tile not allocated (no data can be loaded for it).
		if(!tile) {
			return(pointLast+1);
		}

		/** @type {Array.<OpenLayers.Marker.Box>} */
		var boxList=/** @type {Array.<OpenLayers.Marker.Box>} */ [];

		/** @param {reach.road.Tile} tile
		  * @param {string} color
		  * @param {number} width */
		function drawBox(tile,color,width) {
			if(!tile) return;
			var ll1=new reach.MU(tile.sEdge,tile.wEdge).toDeg().toGoog();
			var ll2=new reach.MU(tile.nEdge,tile.eEdge).toDeg().toGoog();
			var box=new OpenLayers.Marker.Box(OpenLayers.Bounds.fromArray([ll1.llon,ll1.llat,ll2.llon,ll2.llat]));
			boxList.push(box);

			box.setBorder(color,width);
			globalMap.quadLayer.layer.addMarker(box);
		}

		function killBoxes() {
			var boxNum,boxCount;

			boxCount=boxList.length;
			for(boxNum=0;boxNum<boxCount;boxNum++) {
				globalMap.quadLayer.layer.removeMarker(boxList[boxNum]);
			}
		}

//		drawBox(tile,'blue',8);

		if(tile.isLeaf) {
//			alert('box');
//			killBoxes();
			return(handleLeaf(tile,pointFirst>0?pointFirst-1:0,pointLast));
		}

		edgeS=tile.sEdge;
		edgeW=tile.wEdge;
		edgeN=tile.nEdge;
		edgeE=tile.eEdge;
		latSplit=edgeS+((edgeN-edgeS)>>>1);
		lonSplit=edgeW+((edgeE-edgeW)>>>1);

		lat=0;
		lon=0;
		quad=0;

		/** Find tiles that the line intersects while they don't directly contain any points along the line.
		  * @param {number} pointPrev
		  * @param {number} pointNum */
		function handleIntersectTile(pointPrev,pointNum) {
			var quad,quadPrev,quadMid;
			/** @type {number} */
			var lat;
			/** @type {number} */
			var lon;
			/** @type {number} */
			var latPrev;
			/** @type {number} */
			var lonPrev;
			var ll;

			/** @param {number} latTest
			  * @param {number} west
			  * @param {number} east
			  * @return {number} */
			function latCheck(latTest,west,east) {
				var lonTest;

				if((lat<latTest)==(latPrev<latTest)) return(0);

				lonTest=(lon-lonPrev)*(latTest-latPrev)/(lat-latPrev)+lonPrev;
				if(lonTest>=edgeW && lonTest<edgeE) return((lonTest<lonSplit)?west:east);
				return(0);
			}

			/** @param {number} lonTest
			  * @param {number} south
			  * @param {number} north
			  * @return {number} */
			function lonCheck(lonTest,south,north) {
				var latTest;

				if((lon<lonTest)==(lonPrev<lonTest)) return(0);

				latTest=(lat-latPrev)*(lonTest-lonPrev)/(lon-lonPrev)+latPrev;
				if(latTest>=edgeS && latTest<edgeN) return((latTest<latSplit)?south:north);
				return(0);
			}

			quadMid=0;

			if(pointNum<=pointLast) {
//				var foop=new reach.MU(pointList[pointNum].llat,pointList[pointNum].llon).toDeg().toGoog();
//				var fooz=new OpenLayers.LonLat(foop.llon,foop.llat);
//				mark2.move(fooz);

				ll=pointList[pointNum];
				lat=ll.llat;
				lon=ll.llon;

				quad=0;
				if(lat>=edgeS && lat<edgeN && lon>=edgeW && lon<edgeE) {
					if(lat<latSplit) {
						quad=(lon<lonSplit)?Quad.SW:Quad.SE;
						next=(lon<lonSplit)?tile.sw:tile.se;
					} else {
						quad=(lon<lonSplit)?Quad.NW:Quad.NE;
						next=(lon<lonSplit)?tile.nw:tile.ne;
					}

//					drawBox(next,'green',8);
				}
			}

			if(pointPrev>=0) {
//				var foop=new reach.MU(pointList[pointPrev].llat,pointList[pointPrev].llon).toDeg().toGoog();
//				var fooz=new OpenLayers.LonLat(foop.llon,foop.llat);
//				mark1.move(fooz);

				ll=pointList[pointPrev];
				latPrev=ll.llat;
				lonPrev=ll.llon;

				quadPrev=0;
				if(latPrev>=edgeS && latPrev<edgeN && lonPrev>=edgeW && lonPrev<edgeE) {
					if(latPrev<latSplit) {
						quadPrev=(lonPrev<lonSplit)?Quad.SW:Quad.SE;
						prev=(lonPrev<lonSplit)?tile.sw:tile.se;
					} else {
						quadPrev=(lonPrev<lonSplit)?Quad.NW:Quad.NE;
						prev=(lonPrev<lonSplit)?tile.nw:tile.ne;
					}

//					drawBox(prev,'red',8);
				}

				if(pointNum<=pointLast) {
					quadMid|=latCheck(edgeN,Quad.NW,Quad.NE);
					quadMid|=latCheck(latSplit,Quad.SW|Quad.NW,Quad.SE|Quad.NE);
					quadMid|=latCheck(edgeS,Quad.SW,Quad.SE);

					quadMid|=lonCheck(edgeW,Quad.SW,Quad.NW);
					quadMid|=lonCheck(lonSplit,Quad.SW|Quad.SE,Quad.NW|Quad.NE);
					quadMid|=lonCheck(edgeE,Quad.SE,Quad.NE);

					quadMid&=~(quad|quadPrev);

//					if(quadMid&Quad.SW) drawBox(tile.sw,'yellow',4);
//					if(quadMid&Quad.SE) drawBox(tile.se,'yellow',4);
//					if(quadMid&Quad.NW) drawBox(tile.nw,'yellow',4);
//					if(quadMid&Quad.NE) drawBox(tile.ne,'yellow',4);
				}
			}

//			alert('box');
//			killBoxes();

			if(quadMid&Quad.SW) rec(tile.sw,pointPrev,pointNum,pointNum);
			if(quadMid&Quad.SE) rec(tile.se,pointPrev,pointNum,pointNum);
			if(quadMid&Quad.NW) rec(tile.nw,pointPrev,pointNum,pointNum);
			if(quadMid&Quad.NE) rec(tile.ne,pointPrev,pointNum,pointNum);
		}

		for(pointNum=pointFirst;pointNum<=pointLast;) {
			handleIntersectTile(pointPrev,pointNum);

			ll=pointList[pointNum];
			lat=ll.llat;
			lon=ll.llon;

			if(lat>=edgeS && lat<edgeN && lon>=edgeW && lon<edgeE) {
				pointNum=rec(next,pointPrev,pointNum,pointLast);
				ll=pointList[pointNum-1];
				lat=ll.llat;
				lon=ll.llon;
				pointPrev=pointNum-1;
//				drawBox(tile,'blue',8);
				if(pointNum>pointLast) handleIntersectTile(pointPrev,pointNum);
			} else break;
		}

		return(pointNum);
	}

	rec(tile,-1,0,pointCount-1);

	return(result);
};

/** @param {reach.road.Node} node
  * @param {reach.road.Tile.Persist} persist */
reach.road.TileTree.prototype.setNodePersist=function(node,persist) {
	var list;

	if(persist&(reach.road.Tile.Persist.TIMETABLE|reach.road.Tile.Persist.QUERY)) {
		// The following properties are only used here, to avoid adding the same node multiple times.
		if(!node.persist) node.persist=/** @type {reach.road.Tile.Persist} */ 0;
		// TODO: handle each set bit separately.
		if((node.persist&persist)!=persist) {
			node.persist|=persist;

			list=this.persistNodeTbl[persist];
			if(!list) {
				list=[];
				this.persistNodeTbl[persist]=list;
			}
			list.push(node);
		}
	}
};

/** @param {reach.road.Tile.Persist} persist */
reach.road.TileTree.prototype.clearData=function(persist) {
	var nodeList;
	var nodeNum,nodeCount;
	var node;
	var wayList;
	var wayNum,wayCount;
	var way;
	var pointList;
	var pointNumList;
	var posList;
	var refList;
	var refNum;
	var tile;

	nodeList=this.persistNodeTbl[persist];
	this.persistNodeTbl[persist]=[];
	if(nodeList) {
		nodeCount=nodeList.length;
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=nodeList[nodeNum];
			wayList=node.wayList;
			// Check if node has been removed already. Should never happen.
			if(!wayList) continue;

			wayCount=wayList.length;
			for(wayNum=0;wayNum<wayCount;wayNum++) {
				way=wayList[wayNum];
				// Check if the way belongs to another persistence class so it shouldn't be removed now.
				if(way.persist&~persist) {
					// TODO: maybe do way.persist&=~persist; so they won't belong to this persistent class any more? Then again that might actually
					// prevent them from getting deleted which defeats the point.
					break;
				}
			}

			if(wayNum==wayCount) {
				// Ready to remove node.
				tile=this.findTile(node.ll,0);
				if(tile) tile.removeNode(node);
				// This saves the effort of removing references to each way individually when nuking ways.
				// The only references to this node should be from ways to be deleted in the next step.
				node.wayList=null;
				node.posList=null;
			}
		}
	}

	wayList=this.persistWayTbl[persist];
	this.persistWayTbl[persist]=[];
	if(wayList) {
		wayCount=wayList.length;
		for(wayNum=0;wayNum<wayCount;wayNum++) {
			way=wayList[wayNum];
			// Check if way doesn't belong to this persistence class or also belongs to others.
			if(way.persist!=persist) {
				way.persist&=~persist;
				continue;
			}

			// TODO: handle this more efficiently somehow, now it's O(n^3) or so.
			pointList=way.pointList;
			pointNumList=way.pointNumList;
			nodeCount=way.nodeCount;
//			if(pointNumList) nodeCount=pointNumList.length;
//			else nodeCount=pointList.length;

			for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
				if(pointNumList) node=pointList[pointNumList[nodeNum]];
				else node=pointList[nodeNum];
				posList=node.posList;
				refList=node.wayList;
				if(!refList) continue;

//				for(refNum=node.wayCount;refNum--;) {
				for(refNum=node.wayList.length;refNum--;) {
					if(refList[refNum]==way) {
						// Remove reference from node to way.
//console.log(refList);
						refList.splice(refNum,1);
						posList.splice(refNum,1);
//						node.wayCount--;
//console.log(refList);
					}
				}
			}

			// Clear tile of all ways in the class to be removed.
			// TODO: would be more efficient to somehow do this assignment only once at the end for each affected tile.
			way.tile.persistWayTbl[persist]=[];

			way.tile=null;
			way.fromTile=null;
			way.toTile=null;

			way.pointList=null;
			way.pointNumList=null;
			way.distList=null;
			way.nodeDistList=null;
		}
	}
};
