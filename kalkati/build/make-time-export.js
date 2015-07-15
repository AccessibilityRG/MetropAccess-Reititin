var reach={};

var goog={
	provide:function(x) {
		var a,i,o;
		a=x.split('.');
		o=reach;
		for(i=1;i<a.length;i++) {
			if(!o[a[i]]) o[a[i]]={};
			o=o[a[i]];
		}
	},
	require:function() {}
};
goog.provide('goog');
goog.provide('reach.data.Codec');

/** @constructor */
reach.data.Codec=function() {
	//                  1         2         3         4         5         6         7         8         9
	//        0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
	var tbl="\n!#$%()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~";
	var b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	/** @type {Array.<string>} */
	var enc=[];
	/** @type {Array.<number>} */
	var dec=[];
	var i;

	for(i=0;i<tbl.length;i++) {
		dec[tbl.charCodeAt(i)]=i;
		enc[i]=tbl.charAt(i);
	}

	/** @type {Array.<string>} */
	this.encTbl=enc;
	/** @type {Array.<number>} */
	this.decTbl=dec;
	/** @type {number} */
	this.extra=tbl.length-64;

	dec=/** @type {Array.<number>} */ [];
	for(i=0;i<b64.length;i++) {
		dec[b64.charCodeAt(i)]=i;
	}

	/** @type {Array.<number>} */
	this.oldDecTbl=dec;

	/** @type {number} */
	this.minRefLen=2;
};

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
goog.provide('reach.data.Checksum');

/** @constructor */
reach.data.Checksum=function() {
//	var poly=0x82f63b78; (Castagnoli) Btrfs
//	var poly=0xeb31d82e; (Koopman)
//	var poly=0xedb88320; Ethernet, Gzip, PNG
	var poly=0xedb88320;
	var i,j,crc;
	var tbl;

	tbl=/** @type {Array.<number>} */ [];

	for(i=0;i<256;i++) {
		crc=i;
		for(j=8;j--;) {
			crc=((crc>>>1)^(-(crc&1)&poly))>>>0;
		}
		tbl[i]=crc;
	}

	this.tbl=tbl;
	this.crc=0xffffffff;
};

/** @param {string} data
  * @param {number} pos
  * @param {number} len
  * @return {number} */
reach.data.Checksum.prototype.append=function(data,pos,len) {
	var tbl;
	var crc;

	tbl=this.tbl;
	crc=this.crc;
	while(len--) crc=(crc>>>8)^tbl[(crc&255)^data.charCodeAt(pos++)];
	this.crc=crc;

	return((crc^0xffffffff)>>>0);
};
goog.provide('main');
goog.require('reach.data.Codec');
goog.require('reach.data.Checksum');

var fs=require('fs');

function encodeSplits(txt) {
	var pos,len;
	var count;
	var codec;
	var c,z;
	var n;
	var out;

	codec=new reach.data.Codec();
	z='0'.charCodeAt(0);
	count=0;
	out=[count];

	n=0;
	len=txt.length;
	for(pos=0;pos<len;pos++) {
		c=txt.charCodeAt(pos);
		if(c<z || c>z+9) break;

		n=(n>>2)+((c-z)<<4);
		count++;

		if(pos%3==2) {
			out.push(n);
			n=0;
		}
	}
	out.push(n);
	out[0]=count;

	return(codec.encodeShort(out));
}

function compute() {
	var crc32;
	var fileList;
	var dataList;
	var hdrList;
	var len;
	var fd;
	var codec;
	var path;

	path='../data';
	codec=new reach.data.Codec();

	function loadData(fileList) {
		var fileNum,fileCount;

		crc32=new reach.data.Checksum();
		dataList=[];
		hdrList=[];
		len=0;

		fileCount=fileList.length;

		for(fileNum=0;fileNum<fileCount;fileNum++) {
			dataList[fileNum]=fs.readFileSync(fileList[fileNum],'utf8');
		}
	}

	function writeData(fd,dataList) {
		var dataNum,dataCount;
		var data;

		dataCount=dataList.length;

		for(dataNum=0;dataNum<dataCount;dataNum++) {
			data=dataList[dataNum];

			hdrList[dataNum]=codec.encodeLong([data.length,crc32.append(data,0,data.length)]);
			len+=data.length+hdrList[dataNum].length;
		}

		write(codec.encodeLong([1,len]));

		for(dataNum=0;dataNum<dataCount;dataNum++) {
			write(hdrList[dataNum]);
			write(dataList[dataNum]);
		}
	}

	fd=fs.openSync(path+'/trans.txt','w');

	/** @param {string} txt */
	function write(txt) {
		fs.writeSync(fd,txt,null,'utf8');
	}

	loadData([
		path+'/stops.txt',
		path+'/lines.txt',
		path+'/trips.txt',
		path+'/deltas.txt'
	]);

	writeData(fd,dataList);

	fs.closeSync(fd);

	fd=fs.openSync(path+'/ref.txt','w');

	loadData([
		path+'/splits.txt',
		path+'/refs.txt'
	]);

	dataList[0]=encodeSplits(dataList[0]);

	writeData(fd,dataList);

	fs.closeSync(fd);
}

compute();
