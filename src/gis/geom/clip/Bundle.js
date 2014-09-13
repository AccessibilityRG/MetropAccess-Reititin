// A bundle of (partially) overlapping lines for dealing with polygon intersection special cases.

goog.provide('gis.geom.clip.Bundle');
goog.require('gis.Obj');
goog.require('gis.geom.clip.Seg');

/** @constructor
  * @param {gis.data.SplayTreeItem} sweepNode
  * @param {gis.geom.ClipLine} line
  * @param {number} id */
gis.geom.LineBundle=function(sweepNode,line,id) {
	/** @type {gis.data.SplayTreeItem} */
	this.sweepNode=sweepNode;
	/** @type {gis.geom.ClipLine} */
	this.form=line;

	/** @type {reach.geom.Point} */
	this.mid=line.p1;
	/**@type {boolean} */
	this.mark=false;
	/** @type {number} */
	this.id=id;
	/** @type {Array.<number>} */
	this.interFound=[];
	/** @type {number} */
	this.nestingBefore=0;
	/** @type {number} */
	this.nestingAfter=0;
	/** @type {number} */
	this.nestingDiff=0;
	// TODO: consider turning this into a hash to speed up remove operation, test usefulness with real data.
	/** @type {Array.<reach.geom.ClipLine>} */
	this.lineList=[];
}

/** @param {gis.geom.ClipLine} line */
gis.geom.LineBundle.prototype.addLine=function(line) {
	this.lineList.push(line);
}

/** @param {gis.geom.ClipLine} line */
gis.geom.LineBundle.prototype.removeLine=function(line) {
	var i;

	for(i=0;i<this.lines.length;i++) {
		if(this.lines[i]==line) {
			this.lineList.splice(i,1);
			break;
		}
	}
}
