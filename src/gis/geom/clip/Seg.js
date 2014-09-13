goog.provide('gis.geom.clip.Seg');
goog.require('gis.Obj');
goog.require('gis.Q');
goog.require('gis.geom.clip.Point');

/** @constructor
  * @implements {gis.data.SplayKey}
  * @param {gis.geom.clip.Point} p1
  * @param {gis.geom.clip.Point} p2 */
gis.geom.clip.Seg=function(p1,p2) {
	/** @type {gis.geom.clip.Point} */
	this.p1=p1;
	/** @type {gis.geom.clip.Point} */
	this.p2=p2;
	/** @type {gis.osm.Way} */
	this.way;
	/** @type {number} */
	this.pos;
};

/** @param {gis.geom.clip.Point} p1
  * @param {gis.geom.clip.Point} p2
  * @return {number} */
gis.geom.clip.Seg.prototype.crossProd=function(p1,p2) {
	return(gis.math.Rat.detFloat(
		this.p2.x-this.p1.x,
		this.p2.y-this.p1.y,
		p2.x-p1.x,
		p2.y-p1.y
	));
};

gis.geom.clip.Seg.prototype.crossSign64=function(a1,a2,b1,b2) {
	return(gis.Q.detSign64(
		a2.x-a1.x,a2.y-a1.y,
		b2.x-b1.x,b2.y-b1.y
	));
};

/** @param {gis.geom.clip.Point} p1
  * @param {gis.geom.clip.Point} p2
  * @return {gis.math.Rat} */
gis.geom.clip.Seg.prototype.crossRat=function(p1,p2) {
	return(gis.math.Rat.det(
		this.p2.x-this.p1.x,
		this.p2.y-this.p1.y,
		p2.x-p1.x,
		p2.y-p1.y
	));
};

/** Sign of perpendicular dot product (magnitude of cross product) of this and another line.
  * @param {gis.geom.clip.Seg} other
  * @return {number} */
gis.geom.clip.Seg.prototype.compareCross=function(other) {
	return(gis.Q.detSign(
		this.p2.x-this.p1.x,
		this.p2.y-this.p1.y,
		other.p2.x-other.p1.x,
		other.p2.y-other.p1.y
	));
};

/** Sign of perpendicular dot product of a line from pt to this.p1 and this line.
  * @param {gis.geom.clip.Point} pt
  * @return {number} */
gis.geom.clip.Seg.prototype.compareSide=function(pt) {
	return(gis.Q.detSign(
		this.p2.x-this.p1.x,
		this.p2.y-this.p1.y,
		this.p1.x-pt.x,
		this.p1.y-pt.y
	));
};

/** @param {gis.geom.clip.Seg} other
  * @return {number} */
gis.geom.clip.Seg.prototype.intersectRat=function(other) {
	var zero=new gis.math.BigInt(0);
	var posThis,posOther;
	var det;

	det=this.crossRat(other.p1,other.p2);
	if(det.absDeltaFrom(zero)) {
		posThis=other.crossRat(other.p1,this.p1);
		posOther=this.crossRat(other.p1,this.p1);

		// Check that posThis and posOther are between 0 and det (inclusive).
		// The isZero checks are because zeroes can have opposite signs and still be equal.
		if(
			((posThis.neg==det.neg || posThis.isZero()) && posThis.absDeltaFrom(det)<=0) &&
			((posOther.neg==det.neg || posOther.isZero()) && posOther.absDeltaFrom(det)<=0)
		) {
			return(false);
		}
	}

	return(null);
};

/** Calculate epsilon, maximum possible error from the cross product function.
  * Grossly overestimating is fine, underestimating is not.
  * Should be kept fast, calculations are hardly ever within epsilon from an edge case anyway.
  * @param {gis.geom.clip.Seg} other
  * @return {number} */
gis.geom.clip.Seg.prototype.crossError=function(other) {
	var err,errSum;

	// Every difference used in cross products is squared, summed and divided by 2^48 to get portion not fitting in
	// a floating point value (mantissa is 52 bits so 48 gives ample safety margin).
	errSum=0;
	err=(this.p2.x-this.p1.x);errSum+=err*err;
	err=(other.p2.x-other.p1.x);errSum+=err*err;
	err=(other.p1.x-this.p1.x);errSum+=err*err;

	err=(this.p2.y-this.p1.y);errSum+=err*err;
	err=(other.p2.y-other.p1.y);errSum+=err*err;
	err=(other.p1.y-this.p1.y);errSum+=err*err;

	return((errSum/281474976710656)>>>0);
};

/** Try to use floating point algebra to check if lines intersect.
  * Automatically switch to exact rational algebra if result is uncertain.
  * @param {gis.geom.clip.Seg} other
  * @return {number} */
gis.geom.clip.Seg.prototype.intersect=function(other) {
	var epsilon;
	var det;

	// Get maximum possible cross product floating point calculation error.
	epsilon=this.crossError(other);

	// Check if lines are parallel (cross product is zero).
	det=this.crossProd(other.p1,other.p2);
	if(det<-epsilon || det>epsilon) {
		// Calculate intersection positions along each line.
		// Divided by det they both must be between 0 and 1 for there to be an intersection.
		posThis=other.crossProd(other.p1,this.p1);
		posOther=this.crossProd(other.p1,this.p1);

		// Instead of dividing positions and epsilon by det, just set signs how they would be after division.
		if(det<0) {
			posThis=-posThis;
			posOther=-posOther;
			det=-det;
		}

		// Check if posThis and posOther are between 0 and det.
		if(posThis>=epsilon && posThis<=det-epsilon && posOther>=epsilon && posOther<=det-epsilon) {
			// Intersection detected.
//if(!(this.p1.x+(this.p2.x-this.p1.x)*posThis/det)) console.log('ERROR '+posThis+' '+det+' '+epsilon+' '+(det<=-epsilon || det>=epsilon)+' '+this.p1.x+' '+this.p2.x);
			return({x:this.p1.x+(this.p2.x-this.p1.x)*posThis/det,y:this.p1.y+(this.p2.y-this.p1.y)*posThis/det});
		} else if(posThis>=-epsilon && posThis<=det+epsilon && posOther>=-epsilon && posOther<=det+epsilon) {
			// If one or both positions are within epsilon from a range endpoint, try again using exact rational algebra.
//			console.log('RETRY');
			return(this.intersectRat(other));
		}
	} else {
		// If cross product is within epsilon from 0, try again using exact rational algebra.
//		console.log('RETRY');
		return(this.intersectRat(other));
	}

	return(null);
};

/** Exact intersection test for lines with 31-bit integer coordinates.
  * This is actually slightly slower than intersect() which also returns coordinates.
  * @param {gis.geom.clip.Seg} other
  * @return {boolean} */
gis.geom.clip.Seg.prototype.intersectTest=function(other) {
	var det;

	det=this.crossSign64(this.p1,this.p2,other.p1,other.p2);

	if(this.crossSign64(this.p1,this.p2,other.p1,this.p1)*det<0) return(false);
	if(this.crossSign64(other.p1,other.p2,other.p1,this.p1)*det<0) return(false);
	if(this.crossSign64(this.p2,this.p1,other.p2,this.p2)*det<0) return(false);
	if(this.crossSign64(other.p2,other.p1,other.p2,this.p2)*det<0) return(false);

	// Check if lines are parallel.
	if(!det) return(false);

	return(true);
};

/** Useless debug function.
  * @param {gis.geom.clip.Seg} other
  * @return {number} */
gis.geom.clip.Seg.prototype.intersectCheck=function(other) {
	var det;
	var detRat;
	var posThis,posOther;
	var posThisRat,posOtherRat;
	var zero;

	det=this.crossProd(other.p1,other.p2);
	detRat=this.crossRat(other.p1,other.p2);
	zero=new gis.math.BigInt(0);
//	if(det!=(this.p2.x-this.p1.x)*(other.p2.y-other.p1.y) - (this.p2.y-this.p1.y)*(other.p2.x-other.p1.x)) console.log('ERROR');

	if(det!=0) {
		posThis=other.crossProd(other.p1,this.p1)/det;
		posOther=this.crossProd(other.p1,this.p1)/det;
		posThisRat=other.crossRat(other.p1,this.p1);
		posOtherRat=this.crossRat(other.p1,this.p1);

		if(posThis>=0 && posThis<=1 && posOther>=0 && posOther<=1) {
var x1,y1,x2,y2,xa,ya,xb,yb;

			x1=this.p1.x;y1=this.p1.y;
			x2=this.p2.x;y2=this.p2.y;

			xa=x1+(x2-x1)*posThis;
			ya=y1+(y2-y1)*posThis;

			x1=other.p1.x;y1=other.p1.y;
			x2=other.p2.x;y2=other.p2.y;

			xb=x1+(x2-x1)*posOther;
			yb=y1+(y2-y1)*posOther;

			var sx1,sy1,sx2,sy2;

			sx1=detRat.mul(other.p1.x).add(posOtherRat.mul(other.p2.x-other.p1.x)).toString();
			sx2=detRat.mul(this.p1.x).add(posThisRat.mul(this.p2.x-this.p1.x)).toString();
			sy1=detRat.mul(other.p1.y).add(posOtherRat.mul(other.p2.y-other.p1.y)).toString();
			sy2=detRat.mul(this.p1.y).add(posThisRat.mul(this.p2.y-this.p1.y)).toString();

//			console.log(xa+'\t'+ya+'\n'+xb+'\t'+yb);
//			console.log(sx1+'\t'+sy1+'\n'+sx2+'\t'+sy2);

			if(sx1!=sx2 || sy1!=sy2) console.log('ERROR0');
			if(posThisRat.neg!=detRat.neg || posThisRat.absDeltaFrom(zero)<0 || posThisRat.absDeltaFrom(detRat)>0) console.log('ERROR1 '+posThis+' '+posThisRat.toString());
			if(posOtherRat.neg!=detRat.neg || posOtherRat.absDeltaFrom(zero)<0 || posOtherRat.absDeltaFrom(detRat)>0) console.log('ERROR2 '+posOther+' '+posOtherRat.toString());
		} else {
			if(
				(posThisRat.neg==detRat.neg && posThisRat.absDeltaFrom(zero)>=0 && posThisRat.absDeltaFrom(detRat)<=0) &&
				(posOtherRat.neg==detRat.neg && posOtherRat.absDeltaFrom(zero)>=0 && posOtherRat.absDeltaFrom(detRat)<=0)
			) {
				console.log('ERROR3 '+posThis+' '+posThisRat.toString()+' '+posOther+' '+posOtherRat.toString());
			}
		}
	}
};
