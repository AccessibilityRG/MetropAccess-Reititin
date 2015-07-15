'use strict';

require('fibers');
var sqlite3=require('sqlite3');
var repl=require('repl');
var path=require('path');
var fs=require('fs');
var searchConf;
var extra;
var reach={};

var goog={
	provide:function(x) {
		var a,i,o;
		a=x.split('.');
		o=reach;
		for(i=1;i<a.length;i++) {
			if(!o[a[i]]) o[a[i]]={};
			o=o[a[i]];
		}
	},
	require:function() {}
};
goog.provide('goog');
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
goog.provide('reach.data.SplayTree');
goog.require('reach.data.SplayTreeItem');

/** @constructor
  * @param {function(*,*):boolean} compare
  * @param {boolean} combineDupes */
reach.data.SplayTree=function(compare,combineDupes) {
	/** @type {reach.data.SplayTreeItem} */
	this.root=null;
	/** @type {reach.data.SplayTreeItem} */
	this.first=null;
	/** @type {function(*,*):boolean} */
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
goog.provide('main');
goog.require('reach.data.SplayTree');

function error(msg) {
	console.log('ERROR '+msg);
}

function init() {
	var tbl;
	var tree;
	var i,l,pos;
	var a;
	var b;
	var n;
	var j;

	function rec(node,parent) {
		if(node.parent!=parent) error('parent');
		if(node.left) rec(node.left,node);
		if(a[j]!=node) error('in-order key '+a[j].key+' '+node.key);
		j++;
		if(node.right) rec(node.right,node);
	}

	function compare(a,b) {
		return(a-b);
	}

	function compare2(a,b) {
		return(a.key-b.key);
	}

	tbl={};
	tree=new reach.data.SplayTree(compare,true);

	a=[];
	l=2000000;
	for(i=0;i<l;i++) {
		if(Math.random()<0.5) {
			n=tree.insert(~~(Math.random()*100));
			if(!tbl[n.key]) {
				a.push(n);
				a.sort(compare2);
				tbl[n.key]=true;
			}
		} else if(a.length) {
			pos=~~(Math.random()*a.length);
			tbl[a[pos].key]=false;
			tree.remove(a[pos]);
			a.splice(pos,1);
		}
//		console.log(a.map(function(n) {return(n.key);}));

		if(a.length==0) {
			if(tree.root) error('root');
		} else {
			n=a[0];
			if(tree.first!=n) error('first '+n.key+' '+tree.first.key);
			if(n.prev) error('prev '+n.prev.key+' '+n.key);
			for(j=1;j<a.length;j++) {
				if(n.next!=a[j] || a[j].prev!=n) error('prev/next '+n.key+' '+a[j].prev.key+' '+n.next.key+' '+a[j].key);
				n=a[j];
			}
			if(n.next) error('next '+n.key+' '+n.next.key);

			n=tree.root;
			if(!n) error('root');

			j=0;
			rec(n,null);
		}
	}
}

init();
