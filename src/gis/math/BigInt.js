/** @fileoverview Arbitrary precision integer arithmetic for clipping and intersections. */

goog.provide('gis.math.BigInt');

/** @constructor
  * @param {number} limb */
gis.math.BigInt=function(limb) {
	/** @type {number} */
	this.neg=limb<0?1:0;
	/** @type {Array.<number>} */
	this.limbList=[limb>=0?limb:-limb];
};

/** Multiply this by an integer factor, overwriting current number.
  * @param {number} factor Integer multiplication factor.
  * @param {Array.<number>} outLimbList List of limbs to overwrite with output.
  * @param {number} outPos Offset to output limb list, previous items are left untouched.
  * @param {number} outMask Mask to apply to existing output limbs before adding them to result. */
gis.math.BigInt.prototype.mulInt=function(factor,outLimbList,outPos,outMask) {
	var limbList;
	var limbNum,limbCount;
	var limb;
	var prod;
	var lo,carry;

	if(!factor) return;
	limbList=this.limbList;
	limbCount=limbList.length;
	carry=0;

	// limbList is an array of 32-bit ints but split here into 16-bit low and high words for multiplying by a 32-bit term,
	// so the intermediate 48-bit multiplication results fit into JavaScript's 53 bits of integer precision.
	for(limbNum=0;limbNum<limbCount;limbNum++) {
		limb=limbList[limbNum];

//		prod=factor*limb;
//		lo=((prod+carry&0xffff0000)|(factor*(limb&0xffff)+carry&0xffff))>>>0;

//		limb=((outLimbList[outPos]&outMask)+lo)>>>0;
//		outLimbList[outPos++]=limb;

//		carry=(prod/0x10000000)>>>0;
//		carry+=(lo^(((limb-lo)^lo)&~(limb^lo)))>>>31;

		// Multiply lower half of limb with factor, making carry temporarily take 48 bits.
		carry+=factor*(limb&0xffff);
		// Get lowest 16 bits of full product.
		lo=carry&0xffff;
		// Right shift by dividing because >> and >>> truncate to 32 bits before shifting.
		carry=(carry/65536)>>>0;

		// Multiply higher half of limb and combine with lowest 16 bits of full product.
		carry+=factor*(limb>>>16);
		lo|=carry<<16;
		// Lowest 32 bits of full product are added to output limb.
		limb=((outLimbList[outPos]&outMask)+lo)>>>0;
		outLimbList[outPos++]=limb;

		// Highest 32 bits of full product stay in carry, also increment by 1 if previous sum overflowed.
		carry=(carry/65536)>>>0;
		// This bit twiddle is equivalent to: if(limb<(lo>>>0)) carry++;
		carry+=(lo^(((limb-lo)^lo)&~(limb^lo)))>>>31;
	}

	// Extend arbitrary precision number by one more limb if it overflows.
	if(carry) outLimbList[outPos]=carry;
};

/** Multiply this by another BigInt, writing results into a new BigInt.
  * @param {gis.math.BigInt} factor
  * @return {gis.math.BigInt} */
gis.math.BigInt.prototype.mulBig=function(factor) {
	var limbList;
	var limbNum,limbCount;
	var out;

	limbList=factor.limbList;
	limbCount=limbList.length;

	out=new gis.math.BigInt(0);
	out.neg=this.neg^factor.neg;
	this.mulInt(limbList[0],out.limbList,0,0);

	for(limbNum=1;limbNum<limbCount;limbNum++) {
		this.mulInt(limbList[limbNum],out.limbList,limbNum,0xffffffff);
	}

	return(out);
};

/** Multiply this by an integer or another BigInt, writing results into a new BigInt.
  * @param {number|gis.math.BigInt} factor
  * @return {gis.math.BigInt} */
gis.math.BigInt.prototype.mul=function(factor) {
	var out;

	if(typeof(factor)=='number') {
		out=new gis.math.BigInt(0);
		out.neg=this.neg;
		if(factor<0) {
			factor=-factor;
			out.neg^=1;
		}
		this.mulInt(factor,out.limbList,0,0);
		return(out);
	}

	return(this.mulBig(factor));
};

/** Divide this by an integer divisor, overwriting current number. Return division remainder.
  * @param {number} divisor
  * @return {number} */
gis.math.BigInt.prototype.divInt=function(divisor) {
	var limbList;
	var limbNum;
	var limb;
	var hi,lo,carry;

	limbList=this.limbList;
	carry=0;

	limbNum=limbList.length;
	if(limbList[limbNum-1]<divisor) {
		carry=limbList[--limbNum];
		limbList.length=limbNum;
	}

	for(;limbNum--;) {
		limb=limbList[limbNum];

		carry=carry*65536+(limb>>>16);
		hi=(carry/divisor)>>>0;
		carry=carry-hi*divisor;

		carry=carry*65536+(limb&0xffff);
		lo=(carry/divisor)>>>0;
		carry=carry-lo*divisor;

		limbList[limbNum]=((hi<<16)|lo)>>>0;
	}

	return(carry);
};

/** Add integer addend to this, overwriting current number.
  * @param {number} addend */
gis.math.BigInt.prototype.addInt=function(addend) {
	var limbList;
	var limbNum,limbCount;
	var limb,sum;

	limbList=this.limbList;
	// Add addend to least significant limb and truncate to 32 bits.
	sum=(limbList[0]+addend)>>>0;
	limbList[0]=sum;

	// If and only if sum is >= addend, it didn't overflow and we're done.
	if(sum>=addend) return;

	// Add 1 to increasingly more significant limbs truncating sum to 32 bits.
	limbCount=limbList.length;
	for(limbNum=1;limbNum<limbCount;limbNum++) {
		sum=(limbList[limbNum]+1)>>>0;
		limbList[limbNum]=sum;
		// If sum is nonzero, adding 1 didn't overflow and we're done.
		if(sum) return;
	}

	// Extend arbitrary precision number by one more limb if it overflows.
	limbList[limbCount]=1;
};

/** Add another BigInt to this, writing results into a new BigInt.
  * @param {reach.math.BigInt} addend
  * @return {reach.math.BigInt} */
gis.math.BigInt.prototype.addBig=function(addend) {
	var out;
	var smallLimbList,largeLimbList,outLimbList;
	var limbNum,smallLimbCount,largeLimbCount;
	var limb,sum,carry;

	largeLimbList=this.limbList;
	largeLimbCount=largeLimbList.length;
	smallLimbList=addend.limbList;
	smallLimbCount=smallLimbList.length;

	out=new gis.math.BigInt(0);
	out.neg=this.neg;
	outLimbList=out.limbList;

	// If large and small are the wrong way around, swap them. Only limb count matters here, not which number is larger.
	if(smallLimbCount>largeLimbCount) {
		largeLimbList=addend.limbList;
		smallLimbList=this.limbList;
		limbNum=smallLimbCount;
		smallLimbCount=largeLimbCount;
		largeLimbCount=limbNum;
	}

	carry=0;

	for(limbNum=0;limbNum<smallLimbCount;limbNum++) {
		limb=(smallLimbList[limbNum]+carry)>>>0;
		sum=(largeLimbList[limbNum]+limb)>>>0;
		outLimbList[limbNum]=sum;

		carry=(limb<carry || sum<limb)?1:0;
	}

	for(;limbNum<largeLimbCount;limbNum++) {
		sum=(largeLimbList[limbNum]+carry)>>>0;
		outLimbList[limbNum]=sum;
		carry=!sum;
	}

	if(carry) outLimbList[limbNum]=1;

	return(out);
};

/** Subtract integer addend from this, overwriting current number.
  * @param {number} subtrahend */
gis.math.BigInt.prototype.subInt=function(subtrahend) {
	var limbList;
	var limbNum,limbCount;
	var limb,diff;

	limbList=this.limbList;
	// Subtract subtrahend from least significant limb and truncate to 32 bits.
	limb=limbList[0];
	diff=(limb-subtrahend)>>>0;
	limbList[0]=diff;

	// If and only if difference is <= original limb, it didn't overflow and we're done.
	if(diff<=limb) return;

	limbCount=limbList.length;
	// If the subtrahend was < this number, need to negate correctly.
	if(limbCount==1) {
		limbList[0]=(subtrahend-limb)>>>0;
		this.neg^=1;
		return;
	}

	// Subtract 1 from increasingly more significant limbs truncating sum to 32 bits.
	for(limbNum=1;limbNum<limbCount;limbNum++) {
		limb=limbList[limbNum];
		limbList[limbNum]=(limb-1)>>>0;
		// If limb was nonzero, subtracting 1 couldn't overflow and we're done.
		if(limb) return;
	}

	// Most significant limb may have become 0 and thus need to be dropped.
	if(limbCount>1 && !limbList[limbCount-1]) limbList.length--;
};

/** Subtract another BigInt from this, writing results into a new BigInt.
  * @param {reach.math.BigInt} subtrahend
  * @return {reach.math.BigInt} */
gis.math.BigInt.prototype.subBig=function(subtrahend) {
	var out;
	var smallLimbList,largeLimbList,outLimbList;
	var limbNum,smallLimbCount,largeLimbCount;
	var limb,limb2;
	var diff,carry;

	largeLimbList=this.limbList;
	largeLimbCount=largeLimbList.length;
	smallLimbList=subtrahend.limbList;
	smallLimbCount=smallLimbList.length;

	out=new gis.math.BigInt(0);
	out.neg=this.neg;
	outLimbList=out.limbList;

	// If large and small are the wrong way around, swap them.
	if(this.absDeltaFrom(subtrahend)<0) {
		largeLimbList=subtrahend.limbList;
		smallLimbList=this.limbList;
		limbNum=smallLimbCount;
		smallLimbCount=largeLimbCount;
		largeLimbCount=limbNum;
		out.neg^=1;
	}

	carry=0;

	for(limbNum=0;limbNum<smallLimbCount;limbNum++) {
		limb=(smallLimbList[limbNum]+carry)>>>0;
		limb2=largeLimbList[limbNum];
		diff=(limb2-limb)>>>0;
		outLimbList[limbNum]=diff;

		carry=(limb<carry || diff>limb2)?1:0;
	}

	for(;limbNum<largeLimbCount;limbNum++) {
		limb=largeLimbList[limbNum];
		outLimbList[limbNum]=(limb-carry)>>>0;
		carry=!limb;
	}

	// Most significant limbs may have become 0 and thus need to be dropped.
	while(largeLimbCount>1 && !outLimbList[largeLimbCount-1]) largeLimbCount--;
	outLimbList.length=largeLimbCount;

	return(out);
};

/** @param {number|gis.math.BigInt} addend
  * @return {gis.math.BigInt} */
gis.math.BigInt.prototype.add=function(addend) {
	var out;
	var neg;

	if(typeof(addend)=='number') {
		neg=0;
		if(addend<0) {
			neg=1;
			addend=-addend;
		}

		out=new gis.math.BigInt(0);
		out.limbList=this.limbList.slice(0);

		if(this.neg^neg) {
			out.neg=this.neg;
			out.subInt(addend);
		} else {
			out.neg=this.neg;
			out.addInt(addend);
		}

		return(out);
	}

	if(this.neg^addend.neg) return(this.subBig(addend));
	else return(this.addBig(addend));
};

/** @return {boolean} */
gis.math.BigInt.prototype.isZero=function() {
	return(!this.limbList[0] && this.limbList.length==1);
};

/** @param {reach.math.BigInt} other
  * @return {number} */
gis.math.BigInt.prototype.absDeltaFrom=function(other) {
	var limbList,otherList;
	var limbNum,limbCount;
	var d;

	limbList=this.limbList;
	limbCount=limbList.length;
	otherList=other.limbList;

	// Compare lengths.
	d=limbCount-otherList.length;
	// If lengths are equal, compare each limb from most to least significant.
	while(!d && limbCount--) d=limbList[limbCount]-otherList[limbCount];

	return(d);
};

/** @param {gis.math.BigInt} other
  * @return {number} */
gis.math.BigInt.prototype.deltaFrom=function(other) {
	var limbList,otherList;

	// Check if signs are different.
	if(this.neg^other.neg) {
		limbList=this.limbList;
		otherList=other.limbList;
		// Make sure positive and negative zero have no difference (they're both exact integers).
		if(limbList[0]==0 && otherList[0]==0 && limbList.length==1 && otherList.length==1) return(0);
		// Return difference of signs.
		return(other.neg-this.neg);
	}
	return(this.absDeltaFrom(other));
};

/** Create new BigInt from a string with digits in base 10.
  * @param {string} txt
  * @return {reach.math.BigInt} */
gis.math.BigInt.fromString=function(txt) {
	var out;
	var first,pos,len;
	var neg;

	neg=0;
	first=0;
	len=txt.length;

	if(txt.charAt(0)=='-') {
		neg=1;
		first++;
	}

	// Extract first group of 1-9 digits from beginning of string, so that number of remaining digits is divisible by 9.
	pos=(len+8-first)%9+1+first;
	out=new gis.math.BigInt(+txt.substr(first,pos-first));
	out.neg=neg;

	// Extract digits from string in groups of 9.
	for(;pos<len;pos+=9) {
		// Multiply output adding 9 zeroes to the end.
		out.mulInt(1000000000,out.limbList,0,0);
		// Add next 9 digits from input string.
		out.addInt(+txt.substr(pos,9));
	}

	return(out);
};

/** Convert to string in base 10.
  * @return {string} */
gis.math.BigInt.prototype.toString=function() {
	var limbList;
	var limbNum;
	var tmp;
	var txt;

	// Start with an empty output string.
	txt='';

	// Create a copy of this BigInt's limbs for print loop to modify.
	limbList=this.limbList.slice(0);
	tmp=new gis.math.BigInt(0);
	tmp.limbList=limbList;

	// Find most significant limb with nonzero content.
	for(limbNum=limbList.length;limbNum--;) {
		if(limbList[limbNum]) break;
	}

	// If no nonzero limbs found, this number is zero.
	if(limbNum<0) return('0');

	// Loop while 2 or more limbs remain, requiring arbitrary precision division to extract digits.
	while(limbNum) {
		// Extract 9 digits at a time starting from least significant.
		limb=''+tmp.divInt(1000000000);
		// Prepend digits into final result, padded with zeroes to 9 digits.
		// Since more limbs still remain, whole result will not have extra padding.
		txt=new Array(10-limb.length).join('0')+limb+txt;
		// If most significant limb is zero after dividing, decrement number of limbs remaining.
		if(!limbList[limbNum]) limbNum--;
	}

	// Prepend last remaining limb and sign to result.
	txt=limbList[0]+txt;
	if(this.neg) txt='-'+txt;

	return(txt);
};
