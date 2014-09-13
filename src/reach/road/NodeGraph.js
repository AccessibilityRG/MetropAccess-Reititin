goog.provide('reach.road.NodeGraph');
goog.require('reach.road.TileTree');
goog.require('reach.road.Tile');
goog.require('reach.data.Codec');
goog.require('reach.data.Queue');
goog.require('reach.trans.Stop');
goog.require('reach.util');
goog.require('reach.MU');

/** @constructor */
reach.road.NodeGraph=function() {
	/** @type {Array.<reach.road.Node>} */
	this.nodeList=null;

	/** @type {number} */
	this.distDiv=8;

	/** @type {number} */
	this.nodeNum=0;

	/** @type {number} */
	this.ll2m=0;
};

/** @param {reach.road.TileTree} tree */
//reach.road.NodeGraph.prototype.importTileTree=function(tree) {
	/** @type {Array.<reach.road.Node>} */
/*
	var nodeList;
	var id;

	nodeList=[];
	id=1;

	tree.forEach(convert);
	this.nodeList=nodeList;
*/

	/** !!!param {reach.road.Tile} tile */
/*
	function convert(tile) {
		var nodeNum,nodeCount;
		var wayNum,wayCount;
		var way,node,prevNode;
		var dist;

		wayCount=tile.wayList.length;
		for(wayNum=0;wayNum<wayCount;wayNum++) {
			way=tile.wayList[wayNum];
			nodeCount=way.nodeList.length;

			// Remove unnecessary data structures and set up new empty ones.
			for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
				node=way.nodeList[nodeNum];
				node.wayList=null;
				node.posList=null;
				if(!node.followerList) {
					node.followerCount=0;
					node.followerList=[];
					node.followerTbl={};
					node.distList=[];
				}

				if(!node.id) {
					nodeList.push(node);
					node.id=id++;
				}
			}

			node=way.nodeList[0];

			// Store connections between neighbour nodes along the way.
			for(nodeNum=1;nodeNum<nodeCount;nodeNum++) {
				prevNode=node;
				node=way.nodeList[nodeNum];
				if(node==prevNode) continue;
				dist=way.distList[nodeNum-1];

				if(!prevNode.followerTbl[node.id]) {
					prevNode.followerCount++;
					prevNode.followerList.push(node);
					prevNode.followerTbl[node.id]=prevNode.followerCount;
					prevNode.distList.push(dist);
				}

				if(!node.followerTbl[prevNode.id]) {
					node.followerCount++;
					node.followerList.push(prevNode);
					node.followerTbl[prevNode.id]=node.followerCount;
					node.distList.push(dist);
				}
			}

			way.nodeList=null;
			way.distList=null;
		}

		tile.wayList=null;
	}
};
*/

reach.road.NodeGraph.prototype.countErrors=function() {
	var followerNum,followerCount;
	var nodeNum,nodeCount;
	var node,next;
	var realDist,guessDist;
	var errorCount=0;

	nodeCount=this.nodeList.length;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;

		node.dumpId=0;
		node.runId=0;

		followerCount=node.followerCount;
		for(followerNum=0;followerCount;followerNum++) {
			next=node.followerList[followerNum];
			if(!next) continue;

			followerCount--;

			realDist=node.distList[followerNum];
			guessDist=reach.util.vincenty(node.ll.toDeg(),next.ll.toDeg());
//			if(realDist+0.5/this.distDiv<guessDist) {
			if(realDist+2/this.distDiv<guessDist) {
				console.log(realDist+'\t'+guessDist);
				errorCount++;
			}
		}
	}
	console.log('Errors: '+errorCount);
};

reach.road.NodeGraph.prototype.purge=function() {
	var nodeNum,nodeCount;
	var nodeList;
	var removeCount;
	var followerNum,followerCount;
	var node,next;

	nodeList=this.nodeList;
	nodeCount=nodeList.length;
	removeCount=0;

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=nodeList[nodeNum];
		if(!node) continue;

		if(!node.important) {
			nodeList[node.id-1]=null;
			removeCount++;

			followerCount=node.followerCount;
			for(followerNum=0;followerCount;followerNum++) {
				next=node.followerList[followerNum];
				if(!next) continue;

				followerCount--;

				if(next.important) next.removeFollower(node);
			}
		}
	}

	console.log(removeCount+' nodes removed.');
};

reach.road.NodeGraph.prototype.optimize=function() {
	var nodeNum,nodeCount;
	var nodeList;
	var removeCount,totalRemoveCount;
	var followerNum,followerCount;
	var nextNum,prevNum;
	var node,next,prev;
	var dist;

	nodeList=this.nodeList;
	nodeCount=nodeList.length;
	totalRemoveCount=0;

for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
node=nodeList[nodeNum];
if(!node) continue;
reach.util.assert(node.id-1==nodeNum,'foop','Incorrect node ID '+node.id+'-1 != '+nodeNum+'.');
}

	do {
		removeCount=0;

		// Remove all roads leading to a dead end with no transit stop present.
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=nodeList[nodeNum];
			if(!node) continue;

			reach.util.assert(node.id-1==nodeNum,'foo','Incorrect node ID '+node.id+'-1 != '+nodeNum+'.');

			while(!node.important && node.followerCount==1) {
				next=null;
				for(followerNum=0;!next;followerNum++) next=node.followerList[followerNum];
				next.removeFollower(node);
				nodeList[node.id-1]=null;
				removeCount++;
				node=next;
			}

			if(!node.important && node.followerCount==0) {
				nodeList[node.id-1]=null;
				removeCount++;
			}
		}

		// Remove nodes with exactly 2 neighbours and connect the neighbours directly to each other instead.
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=nodeList[nodeNum];
			if(!node) continue;

			reach.util.assert(node.id-1==nodeNum,'foo','Incorrect node ID '+node.id+'-1 != '+nodeNum+'.');

			if(node.followerCount==0) continue;

			if(!node.important && node.followerCount==2) {
				next=null;
				prev=null;

				for(prevNum=0;!prev;prevNum++) prev=node.followerList[prevNum];
				for(nextNum=prevNum;!next;nextNum++) next=node.followerList[nextNum];

				dist=node.distList[prevNum-1]+node.distList[nextNum-1];

				reach.util.assert(dist==node.distList[node.followerTbl[prev.id]-1]+node.distList[node.followerTbl[next.id]-1],'foo','dist');

				followerNum=next.followerTbl[prev.id];
				if(followerNum) {
					// If next and prev are already connected, update dist if connection through this node is faster.
					if(next.distList[followerNum-1]>dist) next.distList[followerNum-1]=dist;
					next.removeFollower(node);
				} else {
					// Replace node with prev in next's followers.
					followerNum=next.followerTbl[node.id];
					next.followerTbl[node.id]=null;
					next.followerTbl[prev.id]=followerNum;
					next.followerList[followerNum-1]=prev;
					next.distList[followerNum-1]=dist;
				}

				followerNum=prev.followerTbl[next.id];
				if(followerNum) {
					// If prev and next are already connected, update dist if connection through this node is faster.
					if(prev.distList[followerNum-1]>dist) prev.distList[followerNum-1]=dist;
					prev.removeFollower(node);
				} else {
					// Replace node with next in prev's followers.
					followerNum=prev.followerTbl[node.id];
					prev.followerTbl[node.id]=null;
					prev.followerTbl[next.id]=followerNum;
					prev.followerList[followerNum-1]=next;
					prev.distList[followerNum-1]=dist;
				}

				nodeList[node.id-1]=null;
				removeCount++;
			}
		}

		console.log(removeCount+' nodes removed.');
		totalRemoveCount+=removeCount;
	} while(removeCount>0);
};

/** @param {function(string)} write
  * @param {Array.<reach.trans.Stop>} stopList */
reach.road.NodeGraph.prototype.exportPack=function(write,stopList) {
var debug=0;
	var codec=new reach.data.Codec();
	var distDiv;
	var followerNum,followerCount;
	/** @type {Array.<reach.road.Node>} */
	var newList;
	/** @type {Array.<reach.road.Node>} */
	var seenList;
	var nodeNum,nodeCount;
	var stopNum,stopCount;
	var nodeTbl;
	var key;
	var queue;
	var node;
	/** @type {reach.road.Node} */
	var next;
	var lat,lon;
	var dlat,dlon,d;
	var dist;
	var id,nodeId;
	var data,data2;
	var branchCount;
	var itemNum,itemCount;

	var realDist,guessDist;
	var ll2m;

	// Distances are stored as integers so they're multiplied by distDiv to use a predefined level of
	// sub-meter accuracy.
	distDiv=this.distDiv;
	ll2m=this.ll2m;
	realDist=0;
	guessDist=0;
	next=null;

	// Prepare nodes for export and find smallest length multiplier among all node pairs to get true distance
	// in meters from Pythagoras distance in Mercator grid (used as initial guess to compress distance data).
	nodeCount=this.nodeList.length;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;

		node.dumpId=0;
		node.runId=0;
	}

	if(!ll2m) {
		for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
			node=this.nodeList[nodeNum];
			if(!node) continue;

			followerCount=node.followerCount;
			for(followerNum=0;followerNum<followerCount;followerNum++) {
				next=node.followerList[followerNum];
				if(!next) continue;

				realDist=node.distList[followerNum];
				dlat=next.ll.llat-node.ll.llat;
				dlon=next.ll.llon-node.ll.llon;
				guessDist=Math.sqrt(dlat*dlat+dlon*dlon);

				d=realDist/guessDist;
				if(ll2m==0 || d<ll2m) ll2m=d;
			}
		}

		ll2m=~~(ll2m*(1<<24)*distDiv);
	}

//	console.log('ll2m='+ll2m);

	// Set up FIFO for breadth first search.
	queue=new reach.data.Queue();

	// Insert nodes of all transit stops in queue, their coordinates have already been stored with stops so
	// no need to output them. Instead they're used as a reference to store nearby coordinates as difference only.
	nodeTbl={};
	id=1;
	stopCount=stopList.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		node=stopList[stopNum].node;
		key=node.ll.llat+'\t'+node.ll.llon;
		if(!nodeTbl[key]) {
			nodeTbl[key]=node;
			node.dumpId=id++;
			queue.insert(node);
		}
	}

	data2=[];
	branchCount=0;
	itemCount=0;

	// Breadth first search through all nodes, store their location as difference from previous neighbour.
	while(node=queue.extract()) {
		// Check if node has already been output.
		reach.util.assert(!node.runId,'NodeGraph.exportPack','Node has already been output!');
		if(node.runId) continue;

		node.runId=1;
		nodeId=id;

		branchCount++;
		itemNum=0;

		newList=/** @type {Array.<reach.road.Node>} */ [];
		seenList=/** @type {Array.<reach.road.Node>} */ [];

		followerCount=node.followerCount;
		for(followerNum=0;followerCount;followerNum++) {
			next=node.followerList[followerNum];
			if(!next) continue;

			followerCount--;
			reach.util.assert(followerNum==(node.followerTbl[next.id]-1),'foo','wtf '+followerNum+' '+(node.followerTbl[next.id]-1));

			if(!next.runId) {
				if(next.dumpId) {
					seenList.push(next);
				} else {
					newList.push(next);
					next.dumpId=id++;
				}
			}
		}

		lat=node.ll.llat;
		lon=node.ll.llon;

		data=[codec.encodeShort([reach.util.zip(newList.length,seenList.length)])];

		// Output connections to new nodes along with their coordinates.
		followerCount=newList.length;
		for(followerNum=0;followerNum<followerCount;followerNum++) {
			next=newList[followerNum];
			dist=~~(node.distList[node.followerTbl[next.id]-1]*distDiv+0.5);

			dlat=next.ll.llat-lat;
			dlon=next.ll.llon-lon;
			d=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24));
			if(d>dist) console.log('ERROR '+d+'\t'+dist);
//if(debug) console.log(lat+'\t'+lon+'\t'+next.ll.llat+'\t'+next.ll.llon+'\t'+Math.sqrt(dlat*dlat+dlon*dlon)+'\t'+ll2m+'\t'+d+'\t'+dist);
//console.log(dist+'\t'+d+'\t'+(dist-d));

			data[++itemNum]=codec.encodeShort([reach.util.fromSigned(dlat),reach.util.fromSigned(dlon),dist-d]);
			queue.insert(next);
		}

		// Output connections to already stored nodes by referring to their ID.
		followerCount=seenList.length;
		for(followerNum=0;followerNum<followerCount;followerNum++) {
			next=seenList[followerNum];
			dist=~~(node.distList[node.followerTbl[next.id]-1]*distDiv+0.5);

			dlat=next.ll.llat-lat;
			dlon=next.ll.llon-lon;
			d=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24));
			reach.util.assert(d<=dist,'NodeGraph.exportPack',d+' > '+dist);
//			if(d>dist) console.log('ERROR '+d+'\t'+dist);

//if(debug) console.log(lat+'\t'+lon+'\t'+next.ll.llat+'\t'+next.ll.llon+'\t'+Math.sqrt(dlat*dlat+dlon*dlon)+'\t'+ll2m+'\t'+d+'\t'+dist+'\t'+next.dumpId+'\t'+nodeId);
//console.log(nodeId+'\t'+(nodeId-next.dumpId)+'\t'+next.dumpId+'\t'+next.ll.llat+'\t'+next.ll.llon);
//console.log(dist+'\t'+d+'\t'+(dist-d));
			data[++itemNum]=codec.encodeShort([nodeId-next.dumpId,dist-d]);
		}

		itemCount+=itemNum;
		data2.push(data.join(''));
	}

	write(codec.encodeLong([ll2m,branchCount,itemCount]));
	write(data2.join(''));

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;
		if(!node.dumpId) this.nodeList[nodeNum]=null;
		node.dumpId=0;
	}
};

/** @param {reach.data.Stream} stream
  * @param {Array.<reach.trans.Stop>} stopList
  * @return {function():number} */
reach.road.NodeGraph.prototype.importPack=function(stream,stopList) {
	/** @type {reach.road.NodeGraph} */
	var self=this;
	/** @type {Object.<string,reach.road.Node>} */
	var nodeTbl;
	/** @type {Array.<reach.road.Node>} */
	var nodeList;
	/** @type {number} */
	var nodeNum;
	var stopNum,stopCount;
	var distDiv,ll2m;
	/** @type {reach.data.Queue} */
	var queue;
	var pos;
	var step;
	var branchCount;
	var itemNum,itemCount;

	var advance=function() {
		var followerNum,followerCount;
		var node,next;
		var lat,lon;
		var dlat,dlon,dist,d;
		var key;
		var stop;
		var dec;
		var counts;
		var nodeId;

		switch(step) {
			// Initialize. 
			case 0:
				step++;

				nodeTbl=/** @type {Object.<string,reach.road.Node>} */ {};
				nodeList=/** @type {Array.<reach.road.Node>} */ [];
				nodeNum=1;

				distDiv=self.distDiv;

				// Set up FIFO for breadth first search.
				queue=new reach.data.Queue();

				// Start from nodes for all transit stops, node coordinates are then stored as difference
				// from previous nodes.
				stopCount=stopList.length;
				for(stopNum=0;stopNum<stopCount;stopNum++) {
					stop=stopList[stopNum];
					key=stop.ll.llat+'\t'+stop.ll.llon;
					node=nodeTbl[key];
					if(!node) {
						node=new reach.road.Node(stop.ll);
						nodeTbl[key]=node;

						node.followerCount=0;
//						node.followerTbl={};
						node.followerList=[];
						node.distList=[];

						node.stopList=[];

						nodeList[nodeNum-1]=node;
						queue.insert(node);
						node.id=nodeNum++;
					}

					// Several stops can overlap and share a node.
					node.stopList.push(stop);
					stop.node=node;
				}

				dec=stream.readLong(3);
				ll2m=dec[0];
				branchCount=dec[1];
				itemCount=dec[2];
				self.ll2m=ll2m;
				self.nodeList=nodeList;

				break;

			case 1:
				node=queue.extract();
				if(!node) {
					step++;
					self.nodeNum=nodeNum;
					return(0);
				}

				// Check if node has already been processed.
				reach.util.assert(!node.runId,'NodeGraph.importPack','Node has already been processed!');
				if(node.runId) break;

				node.runId=1;
				nodeId=nodeNum;
				branchCount--;

				lat=node.ll.llat;
				lon=node.ll.llon;

				counts=reach.util.unzip(stream.readShort(1)[0]);

				// Read connections to new nodes that haven't been seen before.
				followerCount=counts[0];
				for(followerNum=0;followerNum<followerCount;followerNum++) {
					dec=stream.readShort(3);
					dlat=reach.util.toSigned(dec[0]);
					dlon=reach.util.toSigned(dec[1]);

					d=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24));
					dist=(d+dec[2])/distDiv;
//					dist=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24)+dec[3]+0.5)/distDiv;
//					dist=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24)+dec[3]+0.5)/distDiv;
//					dist=(~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24))/distDiv+dec[3]+0.5)/distDiv;
					next=new reach.road.Node(new reach.MU(lat+dlat,lon+dlon));
					key=(lat+dlat)+'\t'+(lon+dlon);
//					nodeTbl[key]=next;

					next.followerCount=1;
//					next.followerTbl={};
					next.followerList=[node];
					next.distList=[dist];
//					next.followerTbl[node.id]=1;

					nodeList[nodeNum-1]=next;
					queue.insert(next);
					next.id=nodeNum++;

					node.followerList[node.followerCount]=next;
					node.distList[node.followerCount++]=dist;
//					node.followerTbl[next.id]=node.followerCount;
				}

				// Read connections to previously seen nodes.
				followerCount=counts[1];
				for(followerNum=0;followerNum<followerCount;followerNum++) {
					dec=stream.readShort(2);

					next=nodeList[nodeId-dec[0]-1];
					dlat=next.ll.llat-lat;
					dlon=next.ll.llon-lon;
					d=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24));
					dist=(d+dec[1])/distDiv;
//					dist=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24)+dec[2]+0.5)/distDiv;
//					dist=~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24)+dec[2]+0.5)/distDiv;
//					dist=(~~(Math.sqrt(dlat*dlat+dlon*dlon)*ll2m/(1<<24))/distDiv+dec[2]+0.5)/distDiv;

					next.followerList[next.followerCount]=node;
					next.distList[next.followerCount++]=dist;
//					next.followerTbl[node.id]=next.followerCount;

					node.followerList[node.followerCount]=next;
					node.distList[node.followerCount++]=dist;
//					node.followerTbl[next.id]=node.followerCount;

//if(debug) console.log(lat+'\t'+lon+'\t'+next.ll.llat+'\t'+next.ll.llon+'\t'+Math.sqrt(dlat*dlat+dlon*dlon)+'\t'+ll2m+'\t'+d+'\t'+(dist*distDiv)+'\t'+next.id+'\t'+nodeId);
//console.log(nodeId+'\t'+dec[1]+'\t'+next.id+'\t'+next.ll.llat+'\t'+next.ll.llon);
//console.log(dist*distDiv+'\t'+d+'\t'+dec[2]);
//			dist=~~(dist*distDiv+0.5);
//			if(dist-d!=dec[2]) console.log((dist-d)+'\t'+dec[2]);
				}

				break;
		}

		return(branchCount+1);
	};

	step=0;
	return(advance);
};

/** @param {string} data
  * @param {reach.trans.StopSet} stopSet */
reach.road.NodeGraph.prototype.importTweaks=function(data,stopSet) {
	var txtList;
	var txtNum,txtCount;
	var fieldList;
	var srcList,dstList;
	var srcNum,srcCount;
	var dstNum,dstCount;
	var srcStop,dstStop;
	var dist;

	txtList=data.split(/\r?\n\r?/);
	txtCount=txtList.length;
//console.log(txtList);
	for(txtNum=0;txtNum<txtCount;txtNum++) {
		// Split on single tabs or any whitespace longer than one character.
		// Can't use () in split regexp due to cross-browser issues.
		if(txtList[txtNum].match(/(^[ \t]*#)|(^[ \t]*$)/)) continue;
		fieldList=txtList[txtNum].replace(/\t/g,'\t ').split(/[ \t][ \t][ \t]*/);
//console.log('Line '+txtNum+'\t'+fieldList.length);
		if(fieldList.length<5) {
			console.log('Too few fields ('+fieldList.length+' when 5 needed) on connections line '+(txtNum+1));
//console.log(fieldList);
			continue;
		}
//		console.log(fieldList);

		srcList=fieldList[0].split(',');
		dstList=fieldList[2].split(',');
		dist=+fieldList[4];

		srcCount=srcList.length;
		dstCount=dstList.length;
//console.log(srcCount+'\t'+dstCount);

		for(srcNum=0;srcNum<srcCount;srcNum++) {
			srcStop=stopSet.tbl[+srcList[srcNum]];
			if(!srcStop) {
				console.log('No stop with ID '+srcList[srcNum]+' on connections line '+(txtNum+1));
				continue;
			}
			// Make sure stop name matches conf file, but only compare alphanumeric characters in lowercase to avoid errors from minor differences.
			if(srcStop.name.replace(/[^A-Za-z]/g,'').toLowerCase()!=fieldList[1].replace(/[^A-Za-z]/g,'').toLowerCase()) {
				console.log('Stop name mismatch in connections line '+(txtNum+1)+', found '+srcStop.name+' and wanted '+fieldList[1]);
				continue;
			}

			for(dstNum=0;dstNum<dstCount;dstNum++) {
				dstStop=stopSet.tbl[+dstList[dstNum]];
				if(!dstStop) {
					console.log('No stop with ID '+dstList[dstNum]+' on connections line '+(txtNum+1));
					continue;
				}
				if(dstStop.name.replace(/[^A-Za-z]/g,'').toLowerCase()!=fieldList[3].replace(/[^A-Za-z]/g,'').toLowerCase()) {
					console.log('Stop name mismatch in connections line '+(txtNum+1)+', found '+dstStop.name+' and wanted '+fieldList[3]);
					continue;
				}

				srcStop.node.connectTo(dstStop.node,dist);
				dstStop.node.connectTo(srcStop.node,dist);
//console.log(srcStop.name+'\t'+dstStop.name+'\t'+dist);
			}
		}
	}
};

/** @param {function(string)} write */
/*
reach.road.NodeGraph.prototype.dumpOSM=function(write) {
	var followerNum,followerCount;
	var nodeNum,nodeCount;
	var node,next;
	var ll;
	var id;
	var lst;
	var i,l;
	var stop;

	write('<?xml version="1.0" encoding="UTF-8"?>\n');
	write('<osm version="0.6" generator="BusFaster Reach">\n');

	id=1;
	nodeCount=this.nodeList.length;

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;

		node.dumpId=0;
	}

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=this.nodeList[nodeNum];
		if(!node) continue;

		node.dumpId=-(id++);
		ll=node.ll.toDeg();
		write('<node id="'+node.dumpId+'" visible="true" lat="'+ll.llat+'" lon="'+ll.llon+'">');
		if(node.stopList) {
			lst=[];
			l=node.stopList.length;
			for(i=0;i<l;i++) {
				stop=node.stopList[i];
			lst.push(stop.origId+' '+stop.name);
			}
			write('\t<tag k="name" v="'+lst.join(', ')+'" />');
		}
		write('</node>\n');

		followerCount=node.followerCount;
		for(followerNum=0;followerCount;followerNum++) {
			next=node.followerList[followerNum];
			if(!next) continue;

			followerCount--;

			if(next.dumpId) {
				write('<way id="'+(-(id++))+'">\n');
				write('\t<nd ref="'+node.dumpId+'" />\n');
				write('\t<nd ref="'+next.dumpId+'" />\n');
				write('\t<tag k="name" v="'+node.distList[followerNum]+'" />');
				write('</way>\n');
			}
		}
	}

	write('</osm>\n');
};
*/
