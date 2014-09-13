goog.provide('reach.data.BinaryHeap');
goog.require('reach.data.HeapItem');

/** @constructor */
reach.data.BinaryHeap=function() {
	/** @type {Array.<reach.data.HeapItem>} */
	this.heap=[];
	/** @type {number} */
	this.last=0;
};

reach.data.BinaryHeap.prototype.clear=function() {
	this.heap=[];
	this.last=0;
};

/** @param {number} heapIndex
  * @param {reach.data.HeapItem} item */
reach.data.BinaryHeap.prototype.bubble=function(heapIndex,item) {
	var parentIndex;
	var cost;
	var heap;

	heap=this.heap;
	cost=item.cost;

	while(heapIndex>0) {
		parentIndex=~~((heapIndex-1)/2);
		if(heap[parentIndex].cost<=cost) break;

		heap[heapIndex]=heap[parentIndex];
		heap[heapIndex].heapIndex=heapIndex;
		heapIndex=parentIndex;
    }

	heap[heapIndex]=item;
	heap[heapIndex].heapIndex=heapIndex;
};

/** @param {number} heapIndex
  * @param {reach.data.HeapItem} item */
reach.data.BinaryHeap.prototype.sink=function(heapIndex,item) {
	var cost,last;
	var minIndex,leftIndex,rightIndex;
	var leftCost,rightCost;
	var heap;

	heap=this.heap;
	cost=item.cost;
	last=this.last;

	while(1) {
		leftIndex=heapIndex*2+1;
		rightIndex=heapIndex*2+2;

		if(rightIndex<last) {
			leftCost=heap[leftIndex].cost;
			rightCost=heap[rightIndex].cost;
			if(leftCost<rightCost) {
				if(leftCost<cost) minIndex=leftIndex;
				else break;
			} else {
				if(rightCost<cost) minIndex=rightIndex;
				else break;
			}
		} else {
			if(leftIndex<last && heap[leftIndex].cost<cost) minIndex=leftIndex;
			else break;
		}

		heap[heapIndex]=heap[minIndex];
		heap[heapIndex].heapIndex=heapIndex;
		heapIndex=minIndex;
	}

	heap[heapIndex]=item;
	heap[heapIndex].heapIndex=heapIndex;
};

/** @param {reach.data.HeapItem} item
  * @param {number} cost */
reach.data.BinaryHeap.prototype.insert=function(item,cost) {
	item.cost=cost;
	this.bubble(this.last++,item);
};

/** @param {reach.data.HeapItem} item
  * @param {number} cost */
reach.data.BinaryHeap.prototype.setKey=function(item,cost) {
	var oldCost;

	oldCost=item.cost;
	item.cost=cost;

	if(cost>oldCost) this.sink(item.heapIndex,item);
	else this.bubble(item.heapIndex,item);
};

/** @return {reach.data.HeapItem} */
reach.data.BinaryHeap.prototype.extractMin=function() {
	var ret;

	if(!this.last) return(null);
	ret=this.heap[0];

	this.sink(0,this.heap[--this.last]);
	return(ret);
};
