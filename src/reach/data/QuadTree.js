goog.provide('reach.data.QuadTree');
goog.require('reach.data.QuadTreeItem');

/** @constructor
  * @param {number} lat0
  * @param {number} lon0
  * @param {number} lat1
  * @param {number} lon1
  * @param {reach.data.QuadTree.Dup} dups */
reach.data.QuadTree=function(lat0,lon0,lat1,lon1,dups) {
	/** @type {number} */
	this.lat0=lat0;
	/** @type {number} */
	this.lon0=lon0;
	/** @type {number} */
	this.lat1=lat1;
	/** @type {number} */
	this.lon1=lon1;
	/** @type {reach.data.QuadTree.Dup} */
	this.dups=dups;
	/** @type {Array.<*>} */
	this.root=[reach.data.QuadTree.NodeType.QLEAF];
}

/** @const */
reach.data.QuadTree.maxChildren=4;

/** @enum {number} */
reach.data.QuadTree.NodeType={
	QBRANCH:0,
	QLEAF:1
};

/** @enum {number} */
reach.data.QuadTree.Dup={
	ALLOWDUP:0,
	NODUP:1
};

/** @enum {number} */
reach.data.QuadTree.Pos={
	SW:1,
	SE:2,
	NW:3,
	NE:4
};

/** @param {reach.data.QuadTreeItem} item */
reach.data.QuadTree.prototype.insert=function(item) {
	var lat0=this.lat0,lon0=this.lon0,lat1=this.lat1,lon1=this.lon1;
	var latSplit,lonSplit;
	var node=this.root,oldNode;
	var lat,lon;
	var itemNum,itemCount;
	var oldItem;
	var quadNum;

	lat=item.ll.llat;
	lon=item.ll.llon;

	while(1) {
		latSplit=(lat0+lat1)/2;
		lonSplit=(lon0+lon1)/2;

		if(node[0]==reach.data.QuadTree.NodeType.QLEAF) {
			if(this.dups==reach.data.QuadTree.Dup.NODUP) {
				itemCount=node.length;
				for(itemNum=1;itemNum<itemCount;itemNum++) {
					oldItem=/** @type {reach.data.QuadTreeItem} */ node[itemNum];
					if(oldItem.ll.llat==lat && oldItem.ll.llon==lon) return(oldItem);
				}
			}

			if(node.length<reach.data.QuadTree.maxChildren+1) {
				// Node has space, insert item.
				node[node.length]=item;
				return(item);
			} else {
				// Node is full, split.
				// Make copy of items.
				oldNode=(/** @type {Array.<*>} */ node).slice(0);
				// Change node from leaf to branch and remove items.
				node[0]=reach.data.QuadTree.NodeType.QBRANCH;
				node.length=1;
				// Split node in quads and reinsert items.
				itemCount=oldNode.length;
				for(itemNum=1;itemNum<itemCount;itemNum++) {
					quadNum=1;
					oldItem=/** @type {reach.data.QuadTreeItem} */ oldNode[itemNum];
					if(oldItem.ll.llon>=lonSplit) quadNum++;
					if(oldItem.ll.llat>=latSplit) quadNum+=2;
					if(node[quadNum]) node[quadNum][(/** @type {Array.<*>} */ (node[quadNum])).length]=oldItem;
					else node[quadNum]=[reach.data.QuadTree.NodeType.QLEAF,oldItem];
				}
			}
		}

		// Select appropriate quad containing input item.
		quadNum=1;
		if(lon>lonSplit) {quadNum++;lon0=lonSplit;} else lon1=lonSplit;
		if(lat>latSplit) {quadNum+=2;lat0=latSplit;} else lat1=latSplit;
		if(!node[quadNum]) {
			// If quad is empty, insert item and exit.
			node[quadNum]=[reach.data.QuadTree.NodeType.QLEAF,item];
			return(item);
		}

		// Move down the tree.
		node=node[quadNum];
	}
}

/** @param {number} qx0
  * @param {number} qy0
  * @param {number} qx1
  * @param {number} qy1
  * @param {function(reach.data.QuadTreeItem)} callBack */
reach.data.QuadTree.prototype.searchRect=function(qx0,qy0,qx1,qy1,callBack) {
	var node=this.root;

/** @param {Array.<*>} node
  * @param {number} lat0
  * @param {number} lon0
  * @param {number} lat1
  * @param {number} lon1 */
	function recurse(node,lat0,lon0,lat1,lon1) {
		var latSplit,lonSplit;
		var lat,lon;
		var itemNum,itemCount;
		var item;

		latSplit=(lat0+lat1)/2;
		lonSplit=(lon0+lon1)/2;

		if(node[0]==reach.data.QuadTree.NodeType.QLEAF) {
			itemCount=node.length;
			for(itemNum=1;itemNum<itemCount;itemNum++) {
				item=/** @type {reach.data.QuadTreeItem} */ node[itemNum];
				lat=item.ll.llat;
				lon=item.ll.llon;
				if(lat>=qx0 && lat<=qx1 && lon>=qy0 && lon<=qy1) callBack(item);
			}
			return;
		}

		if(qx0<=latSplit) {
			if(qy0<lonSplit && node[reach.data.QuadTree.Pos.SW]) recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.SW]),lat0,lon0,latSplit,lonSplit);
			if(qy1>=lonSplit && node[reach.data.QuadTree.Pos.SE]) recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.SE]),lat0,lonSplit,latSplit,lon1);
		}

		if(qx1>latSplit) {
			if(qy0<lonSplit && node[reach.data.QuadTree.Pos.NW]) recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.NW]),latSplit,lon0,lat1,lonSplit);
			if(qy1>=lonSplit && node[reach.data.QuadTree.Pos.NE]) recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.NE]),latSplit,lonSplit,lat1,lon1);
		}
	}

	recurse(this.root,this.lat0,this.lon0,this.lat1,this.lon1);
}

/** @param {function(reach.data.QuadTreeItem)} callBack */
reach.data.QuadTree.prototype.walk=function(callBack) {
	/** @param {Array.<*>} node */
	function recurse(node) {
		var itemNum,itemCount;
		var item;

		if(!node) return;

		if(node[0]==reach.data.QuadTree.NodeType.QLEAF) {
			itemCount=node.length;
			for(itemNum=1;itemNum<itemCount;itemNum++) {
				item=/** @type {reach.data.QuadTreeItem} */ node[itemNum];
				callBack(item);
			}
			return;
		}

		recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.SW]));
		recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.SE]));
		recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.NW]));
		recurse(/** @type {Array.<*>} */ (node[reach.data.QuadTree.Pos.NE]));
	}

	recurse(this.root);
}
