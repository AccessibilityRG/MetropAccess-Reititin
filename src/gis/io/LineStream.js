goog.provide('gis.io.LineStream');
goog.require('gis.Obj');
goog.require('gis.io.Stream');

/** @constructor
  * @extends {gis.io.Stream}
  * @param {string} data
  * @param {function(string)} write */
gis.io.LineStream=function(data,write) {
	var lineList;

	gis.io.Stream.call(this);

	if(data) lineList=data.split(/\r?\n/);
	else lineList=[];

	/** @type {string} */
	this.lineList=lineList;
	/** @type {number} */
	this.lineCount=lineList.length;
	/** @type {function(string)} */
	this.write=write;
};

gis.inherit(gis.io.LineStream,gis.io.Stream);

/** @return {string} */
gis.io.LineStream.prototype.readLine=function() {
	if(this.pos>=this.lineCount) return(null);
	return(this.lineList[this.pos++]);
}

/** @param {string} txt */
gis.io.LineStream.prototype.writeText=function(txt) {
	this.write(txt);
};
