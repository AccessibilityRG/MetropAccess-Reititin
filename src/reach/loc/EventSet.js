// Sweep line style algorithm for connecting walkable points with only a slice of the road graph in memory at a time.
// Slice is only 2*maxWalk meters plus tile size in north-south direction, covers whole graph in east-west direction.

goog.provide('reach.loc.EventSet');
goog.require('reach.loc.InputSet');
goog.require('reach.loc.Outdoor');
goog.require('reach.data.SplayTree');

/** @constructor
  * @param {number} maxWalk */
reach.loc.EventSet=function(maxWalk) {
	/** @type {Array.<reach.loc.InputSet>} */
	this.setList=[];

	/** @type {number} */
	this.maxWalk=maxWalk;
	/** @type {reach.data.SplayTree} */
	this.tree=new reach.data.SplayTree(this.comparePoints,true);
	/** @type {number} */
	this.count=0;
};

/** @enum {number} */
reach.loc.EventSet.Type={
	BIND:0,	// Connect a point to the road graph.
	WALK:1,	// Walk in all directions in road graph to find other points.
	FREE:2	// Free unnecessary road graph tile.
};

reach.loc.EventSet.prototype.clear=function() {
	this.setList=[];
	this.tree=new reach.data.SplayTree(this.comparePoints,true);
	this.count=0;
};

/** @param {*} a
  * @param {*} b
  * @return {number} */
reach.loc.EventSet.prototype.comparePoints=function(a,b) {
	var d;

	a=/** @type {reach.MU} */ a;
	b=/** @type {reach.MU} */ b;

	d=a.llat-b.llat;
	if(d) return(d);
	return(a.llon-b.llon);
};

/** @param {reach.MU} ll
  * @param {reach.loc.EventSet.Type} mode
  * @param {reach.loc.Outdoor} pt
  * @param {reach.road.Tile} tile Tile to be freed. */
reach.loc.EventSet.prototype.insert=function(ll,mode,pt,tile) {
	var leaf;
	var data;

	leaf=this.tree.insert(ll);
	data=/** @type {Array.<{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}>} */ (leaf.data);
	if(!data) {
		data=/** @type {Array.<{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}>} */ [];
		leaf.data=data;
	}
	data.push({type:mode,pt:pt,tile:tile});
	this.count++;
};

/** @param {reach.loc.InputSet} inputSet */
reach.loc.EventSet.prototype.importSet=function(inputSet) {
	var maxWalk;
	var ptList;
	var ptNum,ptCount;
	var pt;
	var loc;

	maxWalk=this.maxWalk;
	ptList=inputSet.list;
	ptCount=ptList.length;
	this.setList.push(inputSet);

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];
		// TODO: test that pt is of type outdoor.
		loc=/** @type {reach.loc.Outdoor} */ pt;

		// When reaching the point, walk in all directions to look for points in other input sets.
		this.insert(loc.ll,reach.loc.EventSet.Type.WALK,loc,null);
		// When point is max walking distance ahead, bind it to the road graph so it can be found by walking from other points.
		this.insert(loc.ll.offset(-maxWalk,0),reach.loc.EventSet.Type.BIND,loc,null);
//console.log('count '+this.count);
	}
};

/** @return {?{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}} */
reach.loc.EventSet.prototype.getNext=function() {
	var leaf;
	var data;
	var event;

	if(!this.count) return(null);
	this.count--;

	leaf=this.tree.first;
	data=/** @type {Array.<{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}>} */ (leaf.data);
	event=/** @type {{type:reach.loc.EventSet.Type,pt:?reach.loc.Outdoor,tile:?reach.road.Tile}} */ data.pop();
	if(!data.length) this.tree.remove(leaf);

	return(event);
};
