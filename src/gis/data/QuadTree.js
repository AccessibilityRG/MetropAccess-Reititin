goog.provide('gis.data.QuadTree');
goog.require('gis.Obj');
goog.require('gis.data.QuadTreeItem');

/** @constructor
  * @param {number} x1 South edge latitude.
  * @param {number} y1 West edge longitude.
  * @param {number} x2 North edge latitude.
  * @param {number} y2 East edge longitude.
  * @param {gis.data.QuadTree.Dup} dups Whether duplicate items are inserted.
  * @param {gis.data.QuadTree.Placement} placement Items go in a single branch closest to root or all leaves they touch. */
gis.data.QuadTree=function(x1,y1,x2,y2,dups,placement) {
	/** @type {number} */
	this.x1=x1;
	/** @type {number} */
	this.y1=y1;
	/** @type {number} */
	this.x2=x2;
	/** @type {number} */
	this.y2=y2;
	/** @type {gis.data.QuadTree.Dup} */
	this.dups=dups;
	/** @type {gis.data.QuadTree.Placement} */
	this.placement=placement;
	/** @type {Array.<*>} */
	this.root=[gis.data.QuadTree.NodeType.LEAF];
	/** @type {number} */
	this.maxChildren=4;
};

/** @enum {number} */
gis.data.QuadTree.NodeType={
	BRANCH:0,
	LEAF:1
};

/** @enum {number} */
gis.data.QuadTree.Dup={
	ALLOW:0,
	DENY:1
};

/** @enum {number} */
gis.data.QuadTree.Placement={
	TOPBRANCH:0,
	LEAVES:1
};

/** @enum {number} */
gis.data.QuadTree.Pos={
	SW:1,
	SE:2,
	NW:3,
	NE:4
};

/** @param {gis.data.QuadTreeItem} item
  * @return {gis.data.QuadTreeItem} */
gis.data.QuadTree.prototype.insert=function(item) {
	var x1,y1,x2,y2;
	var xSplit,ySplit;
	var node,oldNode;
	var bb,bbOld;
	var itemNum,itemCount;
	var oldItem;
	var quadNum;

	x1=this.x1;
	y1=this.y1;
	x2=this.x2;
	y2=this.y2;
	node=this.root;

	// Get item's bounding box.
	bb=item.getBB();

	while(1) {
		xSplit=(x1+x2)/2;
		ySplit=(y1+y2)/2;

		if((bb.x1<xSplit && bb.x2>=xSplit) || (bb.y1<ySplit && bb.y2>=ySplit)) {
			if(this.placement==gis.data.QuadTree.Placement.TOPBRANCH) {
				// Shape occupies several quadrants of this quadtree node so it can't go any deeper.
				node.push(item);
				return(item);
			} else {
				// OH NO!
			}
		}

		if(node[0]==gis.data.QuadTree.NodeType.LEAF) {
			if(node.length<this.maxChildren+1) {
				// Node has space, insert item.
				node.push(item);
				return(item);
			} else {
				// Node is full, split.
				// Make copy of items. Node object is cleared and refilled so pointers to it stay valid.
				oldNode=(/** @type {Array.<*>} */ node).slice(0);

				// Change node type from leaf to branch and remove items.
				node[0]=gis.data.QuadTree.NodeType.BRANCH;
				node.length=5;
				// Set child quadrants to null.
				for(itemNum=1;itemNum<5;itemNum++) node[itemNum]=null;

				// Split node in quads and reinsert items.
				itemCount=oldNode.length;
				for(itemNum=1;itemNum<itemCount;itemNum++) {
					oldItem=/** @type {gis.data.QuadTreeItem} */ (oldNode[itemNum]);

					bbOld=oldItem.getBB();
					if((bbOld.x1<xSplit && bbOld.x2>=xSplit) || (bbOld.y1<ySplit && bbOld.y2>=ySplit)) {
						if(this.placement==gis.data.QuadTree.Placement.TOPBRANCH) {
							// Existing shape doesn't fit entirely in any child node so add it back into the branch node.
							node.push(oldItem);
							continue;
						} else {
							// OH NO!
						}
					}

					quadNum=1;
					// Existing item will fit inside a quadrant so check where its center point belongs.
					if(bbOld.y1>=ySplit) quadNum++;
					if(bbOld.x1>=xSplit) quadNum+=2;

					// Insert existing item into the correct child quadrant, creating a new tree node if necessary.
					if(node[quadNum]) node[quadNum].push(oldItem);
					else node[quadNum]=[gis.data.QuadTree.NodeType.LEAF,oldItem];
				}
			}
		}

		// Select appropriate quad containing input item.
		quadNum=1;
		// Item will fit inside a quadrant so check where its center point belongs.
		if(bb.y1>=ySplit) {quadNum++;y1=ySplit;} else y2=ySplit;
		if(bb.x1>=xSplit) {quadNum+=2;x1=xSplit;} else x2=xSplit;

		if(!node[quadNum]) {
			// If quad is empty, insert new node containing item and exit.
			node[quadNum]=[gis.data.QuadTree.NodeType.LEAF,item];
			return(item);
		}

		// Move down the tree.
		node=node[quadNum];
	}
};
