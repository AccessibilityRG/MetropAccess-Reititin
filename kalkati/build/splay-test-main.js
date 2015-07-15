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
