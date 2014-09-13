goog.provide('gis.io.PackStream');
goog.require('gis.Obj');
goog.require('gis.io.Stream');

/** @constructor
  * @extends {gis.io.Stream}
  * @param {string} data
  * @param {function(string)} write */
gis.io.PackStream=function(data,write) {
	//                  1         2         3         4         5         6         7         8
	//        012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
	var tbl="\n!#$%()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~";
	// Potentially dangerous characters omitted: tab space "&'\`
	var dec=[];
	var i;

	gis.io.Stream.call(this);

	for(i=0;i<tbl.length;i++) {
		dec[tbl.charCodeAt(i)]=i;
	}

	/** @type {Array.<string>} */
	this.encTbl=tbl.split('');
	/** @type {Array.<number>} */
	this.decTbl=dec;
	/** @type {number} */
	this.extra=tbl.length-64;

	/** @type {string} */
	this.data=data;
	/** @type {number} */
	this.len=data?data.length:0;
	/** @type {function(string)} */
	this.write=write;
};

gis.inherit(gis.io.PackStream,gis.io.Stream);

/** Read a sequence of variable length integers. Small numbers compress better.
  * @param {number} count
  * @param {Array.<number>} result Output array, reused between calls for speed.
  * @return {Array.<number>} */
gis.io.PackStream.prototype.readShort=function(count,result) {
	var dec=this.decTbl;
	var extra=this.extra;
	var data;
	var pos;
	var c;
	var len,x,n;

	data=this.data;
	pos=this.pos;
	len=this.len;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])>=64) x=x*extra+c-64;
		result[n++]=(x<<6)+c;
	}

	this.pos=pos;
	return(result);
};

/** Read a sequence of variable length integers. Large numbers compress better.
  * @param {number} count
  * @param {Array.<number>} result Output array, reused between calls for speed.
  * @return {Array.<number>} */
gis.io.PackStream.prototype.readLong=function(count,result) {
	var dec=this.decTbl;
	var extra=this.extra;
	var data;
	var pos;
	var c;
	var len,x,n;

	data=this.data;
	pos=this.pos;
	len=this.len;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])<64) x=(x<<6)+c;
		result[n++]=x*extra+c-64;
	}

	this.pos=pos;
	return(result);
};

/** @param {Array.<number>} data Must be a list of positive numbers, otherwise this function hangs!
  * @return {number} */
gis.io.PackStream.prototype.writeShort=function(data) {
	var enc=this.encTbl;
	var extra=this.extra;
	var c;
	var len,x;
	var result;

	len=data.length;
	result='';

	while(len--) {
		x=data[len];
		result=enc[x&63]+result;
		x>>=6;

		while(x) {
			c=x%extra;
			x=(x-c)/extra;
			result=enc[c+64]+result;
		}
	}

	this.write(result);
	return(result.length);
};

/** @param {Array.<number>} data Must be a list of positive numbers, otherwise this function hangs!
  * @return {number} */
gis.io.PackStream.prototype.writeLong=function(data) {
	var enc=this.encTbl;
	var extra=this.extra;
	var c;
	var len,x;
	var result;

	len=data.length;
	result='';

	while(len--) {
		x=data[len];
		c=x%extra;
		x=(x-c)/extra;
		result=enc[c+64]+result;

		while(x) {
			result=enc[x&63]+result;
			x>>=6;
		}
	}

	this.write(result);
	return(result.length);
};

/** @param {number} len
  * @return {number} */
gis.io.PackStream.prototype.verify=function(len) {
//	return(this.check.append(this.data,this.pos,len));
	return(0);
};
