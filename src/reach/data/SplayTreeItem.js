goog.provide('reach.data.SplayTreeItem');

/** @constructor
  * @param {*} key
  * @param {reach.data.SplayTreeItem} prev
  * @param {reach.data.SplayTreeItem} next */
reach.data.SplayTreeItem=function(key,prev,next) {
	/** @type {reach.data.SplayTreeItem} */
	this.parent=null;
	/** @type {reach.data.SplayTreeItem} */
	this.left=null;
	/** @type {reach.data.SplayTreeItem} */
	this.right=null;

	/** @type {reach.data.SplayTreeItem} */
	this.prev=prev;
	/** @type {reach.data.SplayTreeItem} */
	this.next=next;

	if(prev) prev.next=this;
	if(next) next.prev=this;

	/** @type {*} */
	this.key=key;
	/** @type {*} */
	this.data;
};

reach.data.SplayTreeItem.prototype.rotateLeft=function() {
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

reach.data.SplayTreeItem.prototype.rotateRight=function() {
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

/** @return {reach.data.SplayTreeItem} */
reach.data.SplayTreeItem.prototype.splay=function() {
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
