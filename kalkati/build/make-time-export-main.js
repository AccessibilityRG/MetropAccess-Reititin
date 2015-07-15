goog.provide('main');
goog.require('reach.data.Codec');
goog.require('reach.data.Checksum');

var fs=require('fs');

function compute() {
	var crc32;
	var fileList;
	var dataList;
	var hdrList;
	var len;
	var i,l;
	var fd;
	var codec;
	var path;

	path='data';

	crc32=new reach.data.Checksum();
	codec=new reach.data.Codec();
	fd=fs.openSync(path+'/trans.txt','w');

	/** @param {string} txt */
	function write(txt) {
		fs.writeSync(fd,txt,null,'utf8');
	}

	dataList=[];
	hdrList=[];

	fileList=[
		path+'/stops.txt',
		path+'/lines.txt',
		path+'/trips.txt',
		path+'/deltas.txt'
	];

	len=0;

	l=4;
	for(i=0;i<l;i++) {
		dataList[i]=fs.readFileSync(fileList[i],'utf8');
		hdrList[i]=codec.encodeLong([dataList[i].length,crc32.append(dataList[i],0,dataList[i].length)]);
		len+=dataList[i].length+hdrList[i].length;
	}

	write(codec.encodeLong([1,len]));

	for(i=0;i<l;i++) {
		write(hdrList[i]);
		write(dataList[i]);
	}

	fs.closeSync(fd);
}

compute();
