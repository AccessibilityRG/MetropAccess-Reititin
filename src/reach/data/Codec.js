goog.provide('reach.data.Codec');

/** @constructor */
reach.data.Codec=function() {
	//                  1         2         3         4         5         6         7         8         9
	//        0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
	var tbl="\n!#$%()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~";
//	var b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	/** @type {Array.<string>} */
//	var enc=[];
	/** @type {Array.<number>} */
	var dec=[];
	var i;

	for(i=0;i<tbl.length;i++) {
		dec[tbl.charCodeAt(i)]=i;
//		enc[i]=tbl.charAt(i);
	}

	/** @type {Array.<string>} */
	this.encTbl=tbl.split('');
	/** @type {Array.<number>} */
	this.decTbl=dec;
	/** @type {number} */
	this.extra=tbl.length-64;

//	dec=/** @type {Array.<number>} */ [];
//	for(i=0;i<b64.length;i++) {
//		dec[b64.charCodeAt(i)]=i;
//	}

	/** @type {Array.<number>} */
//	this.oldDecTbl=dec;

	/** @type {number} */
	this.minRefLen=2;
};

/*
reach.data.Codec.test=function() {
	var codec=new reach.data.Codec();
	var i,j,n;
	var txt,code;

	for(j=0;j<100000;j++) {
		n=Math.random()*32;
		txt='';
		for(i=0;i<n;i++) txt+=Math.random()<0.5?'0':'1';
		code=codec.encodeShort(codec.validBitsToList(txt));
		if(codec.validListToBits(codec.decodeShort(code,0,-1).slice(1))!=txt) {
			console.log('error');
		}
	}
};
*/

/** @param {string} txt
  * @return {Array.<number>} */
reach.data.Codec.prototype.validBitsToList=function(txt) {
	var data;
	var i,len;
	var n;

	len=txt.length;
	data=[len];
	n=0;

	for(i=0;i<len;i++) {
		n<<=1;
		if(txt.charAt(i)!=0) n++;
		if(i%6==5) {
			data.push(n);
			n=0;
		}
	}

	i%=6;
	if(i) data.push(n<<(6-i));

	return(data);
};

/** @param {Array.<number>} data
  * @return {string} */
reach.data.Codec.prototype.validListToBits=function(data) {
	var n,bits;
	var i,len;

	len=data[0];
	bits=[];

	n=data[1];
	for(i=0;i<len;i++) {
		bits[i]=(n&32)?'1':'0';
		n<<=1;
		if(i%6==5) n=data[(i+7)/6];
	}

	return(bits.join(''));
};

/** @param {Array.<number>} data
  * @return {string} */
reach.data.Codec.prototype.encodeShort=function(data) {
	var enc=this.encTbl;
	var extra=this.extra;
	var c;
	var i,l,x;
	var result;

	result=/** @type {Array.<string>} */ [];

	l=data.length;
	i=l;
	while(i--) {
		x=data[i];
		result.push(enc[x&63]);
		x>>=6;

		while(x) {
			c=x%extra;
			x=(x-c)/extra;
			result.push(enc[c+64]);
		}
	}

	result.reverse();
	return(result.join(''));
};

/** @param {Array.<number>} data
  * @return {string} */
reach.data.Codec.prototype.encodeLong=function(data) {
	var enc=this.encTbl;
	var extra=this.extra;
	var c;
	var i,l,x;
	var result;

	result=/** @type {Array.<string>} */ [];

	l=data.length;
	i=l;
	while(i--) {
		x=data[i];
		c=x%extra;
		x=(x-c)/extra;
		result.push(enc[c+64]);

		while(x) {
			result.push(enc[x&63]);
			x>>=6;
		}
	}

	result.reverse();
	return(result.join(''));
};

/** @param {string} data
  * @param {number} pos
  * @param {number} count -1 for unlimited
  * @return {Array.<number>} */
reach.data.Codec.prototype.decodeShort=function(data,pos,count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var c;
	var len,x,n;
	var result;

	result=/** @type {Array.<number>} */ [];
	len=data.length;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])>=64) x=x*extra+c-64;
		result[n++]=(x<<6)+c;
	}

	result[count]=pos;
	return(result);
};

/** @param {string} data
  * @param {number} pos
  * @param {number} count
  * @return {Array.<number>} */
reach.data.Codec.prototype.decodeLong=function(data,pos,count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var c;
	var len,x,n;
	var result;

	result=/** @type {Array.<number>} */ [];
	len=data.length;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])<64) x=(x<<6)+c;
		result[n++]=x*extra+c-64;
	}

	result[count]=pos;
	return(result);
};

/** @param {string} data
  * @return {Array.<number>} */
reach.data.Codec.prototype.decodeOld=function(data) {
	var dec=this.oldDecTbl;
	var result=[];
	var i,j,len;
	var c;
	var n;

	len=data.length;

	n=0;
	j=0;
	for(i=0;i<len;i++) {
		c=dec[data.charCodeAt(i)];
		n=n*32+(c&31);
		if(c<32) {
			result[j++]=(n>>1)*(1-(n&1)*2);
			n=0;
		}
	}

	return(result);
};

/** @param {string} data
  * @param {number} repLen
  * @param {number} dictSize -1 for unlimited, 0 for no compression, >0 for specific size in chars.
  * @return {string} */
reach.data.Codec.prototype.compressBytes=function(data,repLen,dictSize) {
	var minRefLen=this.minRefLen;
	var dataPos,dataLen;
	var bufLen,dictLen,plainLen;
	var buf,dict,plain;
	var len,bestLen,bestPos;
	var ref;
	var result;
	var i;

	result=[];
	buf=[];
	bufLen=0;
	dict=[];
	dictLen=0;
	plain=[];
	plainLen=0;

	dataLen=data.length;
	for(dataPos=0;dataPos<dataLen || bufLen>0;) {
		while(bufLen<repLen && dataPos<dataLen) {
			buf.push(data.charAt(dataPos++));
			bufLen++;
		}

		bestLen=0;
		bestPos=0;

		for(i=dictLen;i--;) {
			for(len=0;len<bufLen;len++) {
				if(buf[len]!=dict[i+len%(dictLen-i)]) break;
			}

			if(len-(i>dictLen-1-64?0:1)>bestLen) {
				bestLen=len;
				bestPos=i;
			}
		}

		ref='';
		if(bestLen>=minRefLen) {
			ref=this.encodeShort([reach.util.fromSigned(bestLen-minRefLen),dictLen-1-bestPos]);
		}

		if(bestLen<minRefLen || bestLen<=ref.length+(plainLen==0?0:1)) {
			plain.push(buf[0]);
			plainLen++;
			dict.push(buf[0]);
			if(dictLen==dictSize) dict.shift();
			else dictLen++;
			buf.shift();
			bufLen--;
		} else {
			if(plainLen>0) {
				result.push(this.encodeShort([reach.util.fromSigned(-plainLen)])+plain.join(''));
				plain=[];
				plainLen=0;
			}
			result.push(ref);
			buf.splice(0,bestLen);
			bufLen-=bestLen;

			if(bestLen>dictLen-bestPos) bestLen=dictLen-bestPos;
			dict.push.apply(dict,dict.slice(bestPos,bestPos+bestLen));
			dictLen+=bestLen;

			if(dictSize>=0 && dictLen>dictSize) {
				dict.splice(0,dictLen-dictSize);
				dictLen=dictSize;
			}
		}
	}

	if(plainLen>0) {
		result.push(this.encodeShort([reach.util.fromSigned(-plainLen)])+plain.join(''));
	}

	return(result.join(''));
};

/** @param {string} enc
  * @param {number} first
  * @param {number} len
  * @param {number} dictSize
  * @return {{pos:number,data:string}} */
reach.data.Codec.prototype.decompressBytes=function(enc,first,len,dictSize) {
	var minRefLen=this.minRefLen;
	var chars,store;
	var plain;
	var dict;
	var data;
	var pos,rep,count,outPos;
	var dist,ref;
	var dec;

	data=[];
	dict=[];
	pos=first;
	outPos=0;

	while(pos<first+len) {
		dec=this.decodeShort(enc,pos,1);
		pos=dec[1];
		rep=reach.util.toSigned(dec[0]);

		if(rep<0) {
			plain=enc.substr(pos,-rep);
			store=plain.split('');

			data.push(plain);
			outPos-=rep;
			pos-=rep;
		} else {
			rep+=minRefLen;
			dec=this.decodeShort(enc,pos,1);
			pos=dec[1];
			dist=dec[0]+1;
			ref=dict.length-dist;
			store=null;

			while(rep) {
				count=rep;
				if(count>dist) count=dist;

				chars=dict.slice(ref,ref+count);
				if(!store) store=chars;

				data.push(chars.join(''));
				outPos+=count;
				rep-=count;
			}
		}

		dict.push.apply(dict,store);
		if(dictSize>=0 && dict.length>dictSize) dict.splice(0,dict.length-dictSize);
	}

	return({pos:pos,data:data.join('')});
};
