goog.provide('gis.data.SplayItem');
goog.require('gis.Obj');

/** @constructor
  * @param {*} key
  * @param {gis.data.SplayItem} prev
  * @param {gis.data.SplayItem} next */
gis.data.SplayItem=function(key,prev,next) {
	/** @type {gis.data.SplayItem} */
	this.parent=null;
	/** @type {gis.data.SplayItem} */
	this.left=null;
	/** @type {gis.data.SplayItem} */
	this.right=null;

	/** @type {gis.data.SplayItem} */
	this.prev=prev;
	/** @type {gis.data.SplayItem} */
	this.next=next;

	if(prev) prev.next=this;
	if(next) next.prev=this;

	/** @type {*} */
	this.key=key;
};

gis.data.SplayItem.prototype.rotateLeft=function() {
	var node=this;
	var newparent;

	newparent=node.right;

	node.right=newparent.left;
	if(node.right) node.right.parent=node;
	newparent.left=node;

	if(node.parent) {
		if(node.parent.left==node) node.parent.left=newparent;
        else node.parent.right=newparent;
    }

    newparent.parent=node.parent;
    node.parent=newparent;
};

gis.data.SplayItem.prototype.rotateRight=function() {
	var node=this;
	var newparent;

	newparent=node.left;

	node.left=newparent.right;
	if(node.left) node.left.parent=node;
	newparent.right=node;

	if(node.parent) {
		if(node.parent.left==node) node.parent.left=newparent;
        else node.parent.right=newparent;
    }

	newparent.parent=node.parent;
	node.parent=newparent;
};

/** @return {gis.data.SplayItem} */
gis.data.SplayItem.prototype.splay=function() {
	var node=this;
	var grand,parent;

	while(node.parent) {
		parent=node.parent;
		grand=parent.parent;

		if(!grand) {
			if(node==parent.left) parent.rotateRight();
			else parent.rotateLeft();
			return(this);
        }

		if(node==parent.left) {
			if(parent==grand.left) {
				grand.rotateRight();
				parent.rotateRight();
			} else {
				parent.rotateRight();
				grand.rotateLeft();
			}
		} else {
			if(parent==grand.left) {
				parent.rotateLeft();
				grand.rotateRight();
			} else {
				grand.rotateLeft();
				parent.rotateLeft();
			}
		}
	}

	return(this);
};
