goog.provide('reach.data.SplayTree');
goog.require('reach.data.SplayTreeItem');

/** @constructor
  * @param {function(*,*):number} compare
  * @param {boolean} combineDupes */
reach.data.SplayTree=function(compare,combineDupes) {
	/** @type {reach.data.SplayTreeItem} */
	this.root=null;
	/** @type {reach.data.SplayTreeItem} */
	this.first=null;
	/** @type {function(*,*):number} */
	this.compare=compare;
	/** @type {boolean} */
	this.combineDupes=combineDupes;
};

/** @param {*} key
  * @return {reach.data.SplayTreeItem} */
reach.data.SplayTree.prototype.insert=function(key) {
	var tree=this;
	var node,newNode;
	var d;

	if(!tree.root) {
		newNode=new reach.data.SplayTreeItem(key,null,null);
		tree.root=newNode;
		tree.first=newNode;
		return(newNode);
	}

	node=tree.root;

	while(1) {
		d=tree.compare(key,node.key);

		if(d==0 && tree.combineDupes) return(node);

		if(d<0) {
			if(!node.left) {
				newNode=new reach.data.SplayTreeItem(key,node.prev,node);
				if(!newNode.prev) this.first=newNode;
				node.left=newNode;
				break;
			}
			node=node.left;
		} else {
			if(!node.right) {
				newNode=new reach.data.SplayTreeItem(key,node,node.next);
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

/** @param {reach.data.SplayTreeItem} node */
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
