goog.provide('gis.data.SplayTree');
goog.require('gis.Obj');
goog.require('gis.data.SplayItem');

/** @constructor */
gis.data.SplayTree=function() {
	/** @type {reach.data.SplayItem} */
	this.root=null;
	/** @type {reach.data.SplayItem} */
	this.first=null;
};

/** @param {gis.data.SplayKey} key
  * @return {gis.data.SplayItem} */
reach.data.SplayTree.prototype.insert=function(key) {
	var tree=this;
	var node,newNode;
	var d;

	if(!tree.root) {
		newNode=new reach.data.SplayItem(key,null,null);
		tree.root=newNode;
		tree.first=newNode;
		return(newNode);
	}

	node=tree.root;

	while(1) {
		d=key.deltaFrom(node.key);
		if(d==0) return(node);

		if(d<0) {
			if(!node.left) {
				newNode=new reach.data.SplayItem(key,node.prev,node);
				if(!newNode.prev) this.first=newNode;
				node.left=newNode;
				break;
			}
			node=node.left;
		} else {
			if(!node.right) {
				newNode=new reach.data.SplayItem(key,node,node.next);
				node.right=newNode;
				break;
			}
			node=node.right;
		}
	}

	newNode.parent=node;
	tree.root=newNode.splay();

	return(newNode);
};

/** @param {reach.data.SplayItem} node */
reach.data.SplayTree.prototype.remove=function(node) {
	var tree=this;
	var successor,replacement,parent;
	var tmp;

	parent=node.parent;
	successor=node.next;
    
	if(node.left && node.right) {
		// successor will take the place of node, replacement will take the place of successor. successor can't have a left child.
		replacement=successor.right;

		// Connect successor's parent (which can be node) with replacement.
		if(successor.parent.left==successor) successor.parent.left=replacement;
		else successor.parent.right=replacement;
		if(replacement) replacement.parent=successor.parent;

		// Move node's left subtree under successor.
		successor.left=node.left;
		successor.left.parent=successor;

		// Move node's right subtree under successor.
		successor.right=node.right;
		// Right child can be null if successor is node's right child and replacement is null.
		if(successor.right) successor.right.parent=successor;

		replacement=successor;
	} else {
		replacement=node.left;
		if(!replacement) replacement=node.right;
	}

	// Connect node's parent with replacement.
	if(!parent) tree.root=replacement;
	else if(parent.left==node) parent.left=replacement;
	else parent.right=replacement;
	if(replacement) replacement.parent=parent;

	if(successor) successor.prev=node.prev;
	if(node.prev) node.prev.next=successor;
	else this.first=successor;

	if(parent) tree.root=parent.splay();
};
