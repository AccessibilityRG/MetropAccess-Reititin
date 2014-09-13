goog.provide('reach.loc.InputSet');
goog.require('reach.Obj');
goog.require('reach.loc.Outdoor');

/** @constructor
  * @param {reach.road.Net} net
  * @param {reach.loc.InputSet.Type} mode */
reach.loc.InputSet=function(net,mode) {
	/** @type {reach.road.Net} */
	this.net=net;

	/** @type {Array.<reach.loc.Location>} */
	this.list=[];
	/** @type {Array.<string>} */
	this.fieldList=[];

	/** @type {number} */
	this.count=0;

	/** @type {boolean} */
	this.onlyStops=false;

	/** @type {reach.loc.InputSet.Type} */
	this.mode=mode;

	/** @type {string} */
	this.path;
};

/** @enum {number} */
reach.loc.InputSet.Type={
	STOP:0,
	SRC:1,
	DST:2,
	EXTRA:3
};

/** @param {string} data
  * @param {Proj4js.Proj} srcProj
  * @param {Proj4js.Proj} dstProj
  * @param {string} path
  * @return {function():number} */
reach.loc.InputSet.prototype.importList=function(data,srcProj,dstProj,path) {
	/** @type {reach.loc.InputSet} */
	var self=this;
	var step;
	/** @type {Array.<string>} */
	var lineList;
	/** @type {number} */
	var lineNum;
	var lineCount;
	var line;
	var fieldList;
	var ll;
	var loc;
	var tile;
	var warnCount;
	var projPt;

	/** @enum {number} */
	var steps={
		init:0,
		read:1
	};

	var advance=function() {
		switch(step) {
			// Initialize.
			case steps.init:
				self.path=path;
				lineList=data.split(/[\n\r]+/);
				lineCount=lineList.length;
				lineNum=0;

				step=steps.read;

			case steps.read:
				line=lineList[lineNum++];
				if(line.length==0) break;

				fieldList=line.split(';');
				if(!fieldList[fieldList.length-1]) fieldList.pop();
				if(fieldList.length<3) break;
				if(fieldList[0].match(/^[ \t]*#/) || fieldList[1].match(/[^-.0-9]/) || fieldList[2].match(/[^-.0-9]/)) {
					if(lineNum-1==0) self.fieldList=fieldList;
					break;
				}
				projPt=Proj4js.transform(srcProj,dstProj,new Proj4js.Point(+fieldList[1],+fieldList[2]));
//				console.log(projPt.x+' '+projPt.y);

				ll=new reach.Deg(projPt.y,projPt.x).toMU();
				// Just check that tile is available, don't load it yet.
				tile=self.net.tree.findTile(ll,0);
				if(tile.isLeaf) {
					loc=new reach.loc.Outdoor(ll);
//					loc.inputSet=self;
					loc.fieldList=fieldList;
					loc.id=fieldList[0];
					loc.lineNum=lineNum;
					self.insertLocation(loc);
				} else {
					console.log('Point is out of data bounds:');
					console.log(fieldList.join(';'));
//					warn(path+' line '+lineNum+' has point ('+ll.toDeg().format()+') out of data bounds:');
				}

				break;
		}

		return(lineCount-lineNum);
	};

	step=steps.init;
	return(advance);
};

reach.loc.InputSet.prototype.clear=function() {
	var locNum;
	var pt;
	var loc;
	var walkList;
	var locWalkNum,nodeWalkNum;
	var leg;
	var node;

	locNum=this.list.length;
	while(locNum--) {
		pt=this.list[locNum];
		// TODO: test that pt is of type outdoor.
		loc=/** @type {reach.loc.Outdoor} */ pt;

		walkList=loc.walkList[reach.loc.Outdoor.Type.GRAPH];
		if(!walkList) continue;
		locWalkNum=walkList.length;
		while(locWalkNum--) {
			leg=/** @type {reach.route.result.WalkLeg} */ (walkList[locWalkNum].leg);
			node=leg.startNode;
			nodeWalkNum=node.walkList.length;
			while(nodeWalkNum--) {
				if(node.walkList[nodeWalkNum].leg==leg) {
					node.walkList.splice(nodeWalkNum,1);
//					console.log('YAY');
					break;
				}
			}
		}
	}

	this.list=[];
	this.count=0;
};

/** @param {reach.loc.Location} loc */
reach.loc.InputSet.prototype.insertLocation=function(loc) {
	this.list[this.count++]=loc;
	loc.inputSet=this;
};
