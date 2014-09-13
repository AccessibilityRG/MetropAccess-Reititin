goog.provide('reach.data.Stream');
goog.require('reach.data.Codec');
goog.require('reach.data.Checksum');

/** @constructor
  * @param {string} data */
reach.data.Stream=function(data) {
	/** @type {string} */
	this.data=data;
	/** @type {number} */
	this.pos=0;
	/** @type {number} */
	this.len=data.length;

	/** @type {reach.data.Codec} */
	this.codec=new reach.data.Codec();
	/** @type {Array.<number>} */
	this.decTbl=this.codec.decTbl;
	/** @type {number} */
	this.extra=this.codec.extra;

	/** @type {reach.data.Checksum} */
	this.check=new reach.data.Checksum();
};

/** @param {number} count
  * @return {Array.<number>} */
reach.data.Stream.prototype.readShort=function(count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var data;
	var pos;
	var c;
	var len,x,n;
	var result;

	data=this.data;
	pos=this.pos;
	result=/** @type {Array.<number>} */ [];
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

/** @param {number} count
  * @return {Array.<number>} */
reach.data.Stream.prototype.readLong=function(count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var data;
	var pos;
	var c;
	var len,x,n;
	var result;

	data=this.data;
	pos=this.pos;
	result=/** @type {Array.<number>} */ [];
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

/** @param {number} len
  * @param {number} dictSize
  * @return {string} */
reach.data.Stream.prototype.readPack=function(len,dictSize) {
	var dec;

	dec=this.codec.decompressBytes(this.data,this.pos,len,dictSize);
	this.pos=dec.pos;

	return(dec.data);
};

/** @param {number} len
  * @return {number} */
reach.data.Stream.prototype.verify=function(len) {
	return(this.check.append(this.data,this.pos,len));
};
