goog.provide('reach.road.Net');
goog.require('reach.road.NodeGraph');
goog.require('reach.road.TileTree');
goog.require('reach.data.Stream');
goog.require('reach.trans.City');

/** @constructor
  * @param {reach.trans.City} city */
reach.road.Net=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/* type {reach.road.NodeGraph} */
	this.graph=null;
	/** @type {reach.road.TileTree} */
	this.tree=null;

	/** @type {Array.<Array.<number>>} */
	this.areaList=[
//		[60.17163,24.93930,60.17220,24.93986],	// Elielinaukion bussilaiturit
		[60.17130,24.93929,60.17220,24.93986],	// Elielinaukion bussilaiturit
		[60.17053,24.94004,60.17219,24.94045],	// Vltavan it‰puolinen aukio
		[60.17213,24.93992,60.17258,24.94047],	// Elielinaukion junalaiturit ja tunnelin sis‰‰nk‰ynti
		[60.19845,24.93266,60.19916,24.93457],	// Pasilan asema
		[60.16864,24.93057,60.16898,24.93153],	// Kampin bussilaiturit
		[60.20976,25.07690,60.21010,25.07730],	// It‰keskuksen metroaseman bussilaiturit
		[60.20863,25.07873,60.21042,25.08480],	// It‰keskus
		[60.20980,25.07990,60.21144,25.08206],	// Tallinnanaukio
		[60.22985,24.94215,60.23057,24.94260],	// Tuusulanv‰yl‰n liittym‰ Maunulan kohdalla
		[60.25112,25.01005,60.25203,25.01161]	// Malmin asema
	];

	/** @type {Object.<string,reach.road.Node>} */
	this.areaNodeTbl={};
	/** @type {number} */
	this.areaGrain=512;
	/** @type {number} */
	this.areaNodeMinID=0;
};

/** @param {reach.data.Stream} stream
  * @param {function(reach.road.Tile,reach.task.Task):reach.task.Task} loadTile
  * @return {function():number} */
reach.road.Net.prototype.initTree=function(stream,loadTile) {
	this.tree=new reach.road.TileTree(loadTile);
	return(this.tree.importPack(stream));
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.road.Net.prototype.parseGraph=function(stream) {
	this.graph=new reach.road.NodeGraph();
	return(this.graph.importPack(stream,this.city.stopSet.list));
};

/** @param {string} data */
reach.road.Net.prototype.parseTweaks=function(data) {
//	return(this.graph.importTweaks(data,this.city.stopSet));
	this.graph.importTweaks(data,this.city.stopSet);
};

/** @param {reach.data.Stream} stream
  * @return {function():number} */
reach.road.Net.prototype.parseRefs=function(stream) {
	return(this.tree.importStopRefPack(stream,this.city.stopSet.list));
};

/** Add to each tile a list of routing graph nodes within its bounds.
  * @param {reach.task.Task} task
  * @return {function():number} */
reach.road.Net.prototype.bindGraph=function(task) {
	/** @type {reach.road.Net} */
	var self=this;
	var step;

	/** @enum {number} */
	var steps={
		init:0
	};

	var advance=function() {
		switch(step) {
			// Initialize.
			case steps.init:
				step++;

				// TODO: consider removing recursion.
				/** Recursively partition list of nodes according to boundaries of tile's children.
				  * @param {reach.road.Tile} tile
				  * @param {Array.<reach.road.Node>} nodeList */
				function rec(tile,nodeList) {
					var listSW,listSE,listNW,listNE,list;
					var latSplit,lonSplit;
					var nodeNum,nodeCount;
					var node;
					var ll;

					if(tile.isLeaf) {
						tile.graphNodeList=nodeList;
					} else {
						listSW=[];
						listSE=[];
						listNW=[];
						listNE=[];

						latSplit=tile.sEdge+((tile.nEdge-tile.sEdge)>>>1);
						lonSplit=tile.wEdge+((tile.eEdge-tile.wEdge)>>>1);

						nodeCount=nodeList.length;
						for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
							node=nodeList[nodeNum];
							ll=node.ll;
							if(ll.llat<latSplit) list=(ll.llon<lonSplit)?listSW:listSE;
							else list=(ll.llon<lonSplit)?listNW:listNE;

							list.push(node);
						}

						if(listSW.length && tile.sw) rec(tile.sw,listSW);
						if(listSE.length && tile.se) rec(tile.se,listSE);
						if(listNW.length && tile.nw) rec(tile.nw,listNW);
						if(listNE.length && tile.ne) rec(tile.ne,listNE);
					}

					nodeList=null;
				}

				self.addWalkAreas(task);
				rec(self.tree.root,self.graph.nodeList);
				self.bindWalkAreas(task);

				break;
		}

		return(0);
	}

	step=steps.init;
	return(advance);
};

/** @param {reach.task.Task} task */
reach.road.Net.prototype.addWalkAreas=function(task) {
	var areaList;
	var pos,posCount;
	var layer;
	var ll1,ll2;
	var llSW,llNE;
	var edgeS,edgeW,edgeN,edgeE;
	var lat,lon;
	var key;
	var nodeTbl;
	var node;
	var nodeNum;
	var box;
	var grain,mask;

	areaList=this.areaList;
	posCount=areaList.length;

/*
	if(reach.env.platform==reach.env.Type.BROWSER) {
		layer=new OpenLayers.Layer.Boxes('Walk areas');
		for(pos=0;pos<posCount;pos++) {
			ll1=new reach.Deg(areaList[pos][0],areaList[pos][1]).toGoog();
			ll2=new reach.Deg(areaList[pos][2],areaList[pos][3]).toGoog();
			box=new OpenLayers.Marker.Box(OpenLayers.Bounds.fromArray([ll1.llon,ll1.llat,ll2.llon,ll2.llat]));
			layer.addMarker(box);
		}

		globalMap.map.addLayers([layer]);
	}
*/

	grain=this.areaGrain;
	mask=grain-1;
	nodeNum=this.graph.nodeNum;
	nodeTbl=this.areaNodeTbl;
	this.areaNodeMinID=nodeNum;

	for(pos=0;pos<posCount;pos++) {
		llSW=new reach.Deg(areaList[pos][0],areaList[pos][1]).toMU();
		llNE=new reach.Deg(areaList[pos][2],areaList[pos][3]).toMU();
		edgeS=(~~llSW.llat+mask)&~mask;
		edgeW=(~~llSW.llon+mask)&~mask;
		edgeN=~~llNE.llat&~mask;
		edgeE=~~llNE.llon&~mask;

		if(edgeS>edgeN || edgeW>edgeE) continue;

		for(lat=edgeS;lat<=edgeN;lat+=grain) {
			for(lon=edgeW;lon<=edgeE;lon+=grain) {
				key=lat+'\t'+lon;
				node=nodeTbl[key];

				if(!node) {
					node=new reach.road.Node(new reach.MU(lat,lon));
					node.followerCount=0;
					node.followerList=[];
					node.distList=[];

					nodeTbl[key]=node;
					this.graph.nodeList[nodeNum-1]=node;
					node.id=nodeNum++;
				}
//node.followerList[node.followerCount]=next;
//node.distList[node.followerCount++]=dist;
			}
		}
	}

	this.graph.nodeNum=nodeNum;
};

reach.road.Net.prototype.bindWalkAreas=function(task) {
	var areaList;
	var pos,posCount;
	var tile;
	var llSW,llNE;
	var edgeS,edgeW,edgeN,edgeE;
	var lat,lon;
	var key;
	var nodeTbl;
	var node,nodeW,nodeSW,nodeS,nodeSE;
	var nodeNum;
	var box;
	var grain,mask;
	var areaNodeMinID;

	areaList=this.areaList;
	posCount=areaList.length;
	areaNodeMinID=this.areaNodeMinID;

	grain=this.areaGrain;
	mask=grain-1;
	nodeNum=this.graph.nodeNum;
	nodeTbl=this.areaNodeTbl;
	this.areaNodeMinID=nodeNum-1;

	for(pos=0;pos<posCount;pos++) {
		llSW=new reach.Deg(areaList[pos][0],areaList[pos][1]).toMU();
		llNE=new reach.Deg(areaList[pos][2],areaList[pos][3]).toMU();
		edgeS=(~~llSW.llat+mask)&~mask;
		edgeW=(~~llSW.llon+mask)&~mask;
		edgeN=~~llNE.llat&~mask;
		edgeE=~~llNE.llon&~mask;

		if(edgeS>edgeN || edgeW>edgeE) continue;

		tile=this.tree.findBoxTile(llSW.llat,llSW.llon,llNE.llat,llNE.llon);
		tile.forEach(
			/** @param {reach.road.Tile} tile */
			function(tile) {
				var nodeList;
				var nodeNum,nodeCount;
				var node,areaNode;
				var lat,lon;
				var key;

				if(!tile.isLeaf) return;

				tile.areaList.push({boundSW:llSW,boundNE:llNE});
				nodeList=tile.graphNodeList;
				nodeCount=nodeList.length;
				for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
					node=nodeList[nodeNum];
					lat=node.ll.llat;
					lon=node.ll.llon;

					if(node.id>areaNodeMinID || lat<llSW.llat || lat>llNE.llat || lon<llSW.llon || lon>llNE.llon) continue;

					if(lat<edgeS) lat=edgeS;
					if(lat>edgeN) lat=edgeN;
					if(lon<edgeW) lon=edgeW;
					if(lon>edgeE) lon=edgeE;

					lat=(lat+grain/2)&~mask;
					lon=(lon+grain/2)&~mask;

					key=lat+'\t'+lon;
					areaNode=nodeTbl[key];
					if(!areaNode) continue;

					node.connectTo(areaNode,node.ll.distTo(areaNode.ll));
					node.area=true;
				}
			}
		);

		for(lat=edgeS+grain;lat<=edgeN;lat+=grain) {
			lon=edgeW;
			key=lat+'\t'+lon;
			node=nodeTbl[key];

			key=(lat-grain)+'\t'+lon;
			nodeS=nodeTbl[key];

			key=(lat-grain)+'\t'+(lon+grain);
			nodeSE=nodeTbl[key];

			for(lon=edgeW+grain;lon<=edgeE;lon+=grain) {
				key=lat+'\t'+lon;
				nodeW=node;
				node=nodeTbl[key];

				key=(lat-grain)+'\t'+(lon+grain);
				nodeSW=nodeS;
				nodeS=nodeSE;
				nodeSE=nodeTbl[key];

				if(!node || node.area) continue;

				if(nodeS) node.connectTo(nodeW,node.ll.distTo(nodeW.ll));
				if(nodeSW) node.connectTo(nodeSW,node.ll.distTo(nodeSW.ll));
				if(nodeS) node.connectTo(nodeS,node.ll.distTo(nodeS.ll));
				if(nodeSE) node.connectTo(nodeSE,node.ll.distTo(nodeSE.ll));
				node.area=true;

//if(!node.boundNW && nodeNW) console.log('NW '+node.ll.distTo(nodeNW.ll));
//if(!node.boundN && nodeN) console.log('N '+node.ll.distTo(nodeN.ll));

//				node.boundW=true;
//				node.boundSW=true;
//				node.boundS=true;
//				node.boundSE=true;
/*
				node=new reach.road.Node(new reach.MU(lat,lon));
				node.followerCount=0;
				node.followerList=[];
				node.distList=[];

				nodeTbl[key]=node;
				this.graph.nodeList[nodeNum-1]=node;
				node.id=nodeNum++;
//node.followerList[node.followerCount]=next;
//node.distList[node.followerCount++]=dist;
*/
			}
		}
	}
};
