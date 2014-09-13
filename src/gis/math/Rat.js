/** @fileoverview Arbitrary precision rational number arithmetic for clipping and intersections. */

goog.provide('gis.math.Rat');
goog.require('gis.math.BigInt');

/** @constructor
  * @param {gis.math.BigInt} numer
  * @param {gis.math.BigInt} denom */
gis.math.Rat=function(numer,denom) {
	/** @type {gis.math.BigInt} */
	this.numer=numer;
	/** @type {gis.math.BigInt} */
	this.denom=denom;
};

/** @type {number} Square of a number that definitely fits in the 53-bit integer precision of JavaScript numbers. */
gis.math.Rat.maxSqr=Math.pow(2,102);

/** Floating point cross product (2x2 determinant)
  * @param {number} a1
  * @param {number} b1
  * @param {number} b2
  * @param {number} a2
  * @return {number} */
gis.math.Rat.detFloat=function(a1,b1,b2,a2) {
	return(a1*a2-b1*b2);
};

/** Rational number cross product (2x2 determinant)
  * @param {number} a1
  * @param {number} b1
  * @param {number} b2
  * @param {number} a2
  * @return {number} */
gis.math.Rat.det=function(a1,b1,b2,a2) {
/*
	console.log('a1 '+a1+' = '+new gis.math.BigInt(a1).toString());
	console.log('a2 '+a2+' = '+new gis.math.BigInt(a2).toString());
	console.log('b1 '+b1+' = '+new gis.math.BigInt(b1).toString());
	console.log('b2 '+b2+' = '+new gis.math.BigInt(b2).toString());
	console.log('a1*a2 '+(a1*a2)+' = '+new gis.math.BigInt(a1).mul(a2).toString());
	console.log('-b1*b2 '+(b1*-b2)+' = '+new gis.math.BigInt(b1).mul(-b2).toString());
	console.log('cross '+(a1*a2-b1*b2)+' = '+new gis.math.BigInt(a1).mul(a2).add(new gis.math.BigInt(b1).mul(-b2)).toString());
*/
	return(new gis.math.BigInt(a1).mul(a2).add(new gis.math.BigInt(b1).mul(-b2)));
};

/** Return sign of cross product (2x2 determinant).
  * @param {number} a1
  * @param {number} b1
  * @param {number} b2
  * @param {number} a2
  * @return {number} */
gis.math.Rat.detSign=function(a1,b1,b2,a2) {
	var a,b,s,as,bs;

	// Try floating point first and return result if products are small enough (check the sum of their squares)
	// or their difference is large enough.
	// Multiplication results have 53 bits of accuracy while 64 may be needed, so after rounding error can be
	// +/- 2^10=1024 for each product and 2048 for their difference, if they don't fit in 53 bits.
	a=a1*a2;
	b=b1*b2;
	d=a-b;
	if(d*d>2048*2048 || a*a+b*b<gis.math.Rat.maxSqr) return(d);
	globalRats++;

	// Calculate only lowest 15 bits of products, since higher ones were already found to be equal.
	// Signs of products match because they're over 50 bits while their difference is small, so no checks are needed.
	d=(a1&0x7fff)*(a2&0x7fff)-(b1&0x7fff)*(b2&0x7fff);

	// Product high bits can be pairs like 7fff and 0000, while real difference is small (such as +/- 1).
	// To fix this, take only 13 bits of the difference and sign extend.
	return(((d&0x1fff)^0x1000)-0x1000);
};

/** @param {reach.math.BigInt|number} a
  * @param {reach.math.BigInt|number} b
  * @return {number} */
gis.math.Rat.minusSign=function(a,b) {
	if(typeof(a)=='number') {
		if(typeof(b)=='number') return(a-b);
		// Multiply a with denominator of b, compare to numerator of b
		return(b.denom.mulInt(a).minusSign(b.numer));
	}

	if(typeof(b)=='number') {
		// Multiply b with denominator of a, compare to numerator of a
		return(a.numer.minusSign(a.denom.mulInt(b)));
	}

	return(a.numer.mul(b.denom).minusSign(b.numer.mul(a.denom)));
};
