goog.provide('reach.data.RadixHeap');
goog.require('reach.data.HeapItem');

/** @constructor
  * @param {number} size */
reach.data.RadixHeap=function(size) {
	var i;

	/** @type {Array.<reach.data.HeapItem>} */
	this.heap=[];
//	this.heap=new Array(size);
	/** @type {number} */
	this.cursor=0;
	/** @type {number} */
	this.size=size;
	/** @type {number} */
	this.itemCount=0;

//	for(i=0;i<size;i++) this.heap[i]=null;
};

reach.data.RadixHeap.prototype.clear=function() {
	var i;

	this.heap=[];
//	this.heap=new Array(size);
	this.cursor=0;
	this.itemCount=0;

//	for(i=0;i<this.size;i++) this.heap[i]=null;
};

/** @param {reach.data.HeapItem} item */
reach.data.RadixHeap.prototype.remove=function(item) {
	var next;

	next=item.heapNext;

	if(next) next.heapPrev=item.heapPrev;
	if(item.heapPrev) {
		item.heapPrev.heapNext=next;
	} else {
		this.heap[~~item.cost]=next;
	}

	item.heapPrev=null;
	item.heapNext=null;
	this.itemCount--;
};

/** @param {reach.data.HeapItem} item
  * @param {number} cost */
reach.data.RadixHeap.prototype.insert=function(item,cost) {
	var old;

//if(cost<this.cursor) console.log('RadixHeap.insert says: The cursor decrease IS necessary.');
//	if(cost<this.cursor) this.cursor=cost;
	item.cost=cost;

	old=this.heap[~~item.cost];
	item.heapNext=old;
	item.heapPrev=null;
	if(old) old.heapPrev=item;

	this.heap[~~item.cost]=item;
	this.itemCount++;
};

/** @param {reach.data.HeapItem} item
  * @param {number} cost */
reach.data.RadixHeap.prototype.setKey=function(item,cost) {
	this.remove(item);
	this.insert(item,cost);
};

/** @return {reach.data.HeapItem} */
reach.data.RadixHeap.prototype.extractMin=function() {
	var item;

	if(this.itemCount==0) return(null);
	while(!this.heap[this.cursor]) {
		this.cursor++;
//if(this.cursor%1000==0) console.log(this.cursor);
//		console.log(this.itemCount+'\t'+this.cursor);
	}

	item=this.heap[this.cursor];
	if(item) this.remove(item);

	return(item);
};
