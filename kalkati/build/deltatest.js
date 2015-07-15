'use strict';

//require('fibers');
//var sqlite3=require('sqlite3');
var repl=require('repl');
//var path=require('path');
var fs=require('fs');
var searchConf;
var extra;
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
goog.provide('reach.Deg');

/** @constructor
  * @param {number} lat
  * @param {number} lon */
reach.Deg=function(lat,lon) {
	/** @type {number} */
	this.llat=lat;
	/** @type {number} */
	this.llon=lon;
};

reach.Deg.prototype.format=function() {
	return(reach.util.round(this.llat,100000)+(this.llat<0?'S':'N')+', '+reach.util.round(this.llon,100000)+(this.llon<0?'W':'E'));
};

reach.Deg.prototype.toString=reach.Deg.prototype.format;

/** @return {reach.MU} */
reach.Deg.prototype.toMU=function() {
	var r=reach.MU.range/2;

	return(new reach.MU(
		~~(Math.log(Math.tan((this.llat+90)*Math.PI/360))*r/Math.PI+r),
		~~(this.llon*r/180+r)
	));
};
goog.provide('reach.MU');
goog.require('reach.Deg');

/** @constructor
  * @param {number} lat
  * @param {number} lon */
reach.MU=function(lat,lon) {
	/** @type {number} */
	this.llat=lat;
	/** @type {number} */
	this.llon=lon;
};

reach.MU.range=1<<30;
reach.MU.flatten=1/298.257223563;
reach.MU.major=6378137;
reach.MU.minor=reach.MU.major*(1-reach.MU.flatten);

reach.MU.prototype.toString=function() {
	return(this.llat+','+this.llon);
};

reach.MU.prototype.pretty=function() {
	return('('+this.llat+', '+this.llon+')');
};

reach.MU.prototype.toDebug=function() {
	var deg;

	deg=this.toDeg();

	return({lat:deg.llat,lon:deg.llon});
};

/** @return {reach.Deg} */
reach.MU.prototype.toDeg=function() {
	var r=reach.MU.range/2;

	return(new reach.Deg(
		Math.atan(Math.exp((this.llat-r)*Math.PI/r))*360/Math.PI-90,
		(this.llon-r)*180/r
	));
};

/** @param {number} north Movement northward in meters.
  * @param {number} east Movement eastward in meters. */
reach.MU.prototype.offset=function(north,east) {
	var scale;
	var f,t;

	t=Math.exp((this.llat/reach.MU.range*2-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=reach.MU.range/(reach.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=reach.MU.flatten;
	t=t*t+1;
	t=f*( (1-t)/(t*t)*8+1 );

	return(new reach.MU(
		this.llat+scale/(1+( t*3-f )/2)*north,
		this.llon+scale/(1+( t+f )/2)*east
	));
};

/*
function getMetersPerOsmUnit(lat) {
    var r=536870912;
    var x=Math.exp((lat-r)*2*Math.PI/r);
    var scale=2/Math.sqrt(2+1/x+x); // Note: cosh(lat)=(1/x+x)/2

    return(reach.conf.earthRadiusMeters*Math.PI/r*scale);
}
*/
goog.provide('reach.XY');

/** @constructor
  * @param {number} x
  * @param {number} y */
reach.XY=function(x,y) {
	/** @type {number} */
	this.xx=x;
	/** @type {number} */
	this.yy=y;
};

reach.XY.prototype.toString=function() {
    return(this.xx+','+this.yy);
};
goog.provide('reach.util');
goog.require('reach.XY');
goog.require('reach.MU');

/** @constructor */
reach.util=function() {};

/** @param {string} msg */
reach.util.warn=function(msg) {
	console.log('WARNING: '+msg);
};

/** @param {number} a
  * @param {number} b
  * @return {number} */
reach.util.zip=function(a,b) {
	a=(a|(a<<4))&0x0f0f;
	a=(a|(a<<2))&0x3333;
	a=(a|(a<<1))&0x5555;

	b=(b|(b<<4))&0x0f0f;
	b=(b|(b<<2))&0x3333;
	b=(b|(b<<1))&0x5555;

	return((a<<1)|b);
};

/** @param {number} b
  * @return {Array.<number>} */
reach.util.unzip=function(b) {
	var a;

	a=(b>>1)&0x5555;
	b&=0x5555;

	a=(a|(a>>1))&0x3333;
	a=(a|(a>>2))&0x0f0f;
	a=(a|(a>>4))&0x00ff;

	b=(b|(b>>1))&0x3333;
	b=(b|(b>>2))&0x0f0f;
	b=(b|(b>>4))&0x00ff;

	return([a,b]);
};

/** @param {number} t
  * @return {string} */
reach.util.formatMins=function(t) {
	var h,m;

	h=~~(t/60);
	m=~~(t%60+0.5);

	if(m==60) {
		h++;
		m=0;
	}

	if(h<10) h='0'+h;
	if(m<10) m='0'+m;

	return(h+':'+m);
};

/** @param {number} t
  * @return {string} */
reach.util.formatSecs=function(t) {
	var h,m,s;

	t=~~(t+0.5);

	s=t%60;
	t=(t-s)/60;
	m=t%60;
	t=(t-m)/60;
	h=t;

	if(h<10) h='0'+h;
	if(m<10) m='0'+m;
	if(s<10) s='0'+s;

	return(h+':'+m+':'+s);
};

/** @param {number} t
  * @return {string} */
reach.util.formatMilli=function(t) {
	var h,m,s,milli;

	if(t<0) t=0;

	milli=t%1000;
	t=(t-milli)/1000;
	s=t%60;
	t=(t-s)/60;
	m=t%60;
	t=(t-m)/60;
	h=t;

	return((h?reach.util.pad(h,2)+':':'')+reach.util.pad(m,2)+':'+reach.util.pad(s,2)+'.'+reach.util.pad(milli,3));
};

/** @param {boolean} ok
  * @param {string} func
  * @param {string} msg */
reach.util.assert=function(ok,func,msg) {
	if(!ok) console.log('Assert failed in function '+func+': '+msg);
};

/** @param {number} n
  * @return {number} */
reach.util.fromSigned=function(n) {
	return(n<0?(((-n)<<1)-1):(n<<1));
};

/** @param {number} n
  * @return {number} */
reach.util.toSigned=function(n) {
	return((n&1)?-(n>>1)-1:(n>>1));
};

/** @param {number} n
  * @param {number} width
  * @return {string} */
reach.util.pad=function(n,width) {
	var len;

	n=''+n;
	len=n.length;
	if(len>=width) return(n);

	return(new Array(width-(''+n).length+1).join('0')+n);
};

/** @param {number} n
  * @param {number} width
  * @param {boolean} rightAlign
  * @return {string} */
reach.util.padSpace=function(txt,width,rightAlign) {
	var len;

	txt=''+txt;
	len=txt.length;
	if(len>width) {
		if(width<3) return(txt.substr(0,width));
		return(txt.substr(0,width-3)+'...');
	}

	if(rightAlign) return(new Array(width-txt.length+1).join(' ')+txt);
	return(txt+new Array(width-txt.length+1).join(' '));
};

/** @param {number} n
  * @param {number} prec
  * @return {number} */
reach.util.round=function(n,prec) {
	if(n<0) prec=-prec;
	return(~~(n*prec+0.5)/prec);
};

/** @param {Array.<number>} data
  * @return {{count:number,mean:number,variance:number,low:number,high:number}} */
reach.util.getStats=function(data) {
	var i,count;
	var x,sum;
	var mean,variance;
	var low,high;

	count=data.length;

	sum=0;
	for(i=0;i<count;i++) sum+=data[i];
	mean=sum/count;

	sum=0;
	low=data[0];
	high=low;

	for(i=0;i<count;i++) {
		x=data[i];
		if(x<low) low=x;
		if(x>high) high=x;
		x-=mean;
		sum+=x*x;
	}
	variance=sum/count;

	return({count:count,mean:mean,variance:variance,low:low,high:high});
};

/** @param {Element|Document} elem
  * @param {string} name
  * @param {string} type
  * @param {function(Event,string)} handler
  * @return {function(Event)} */
reach.util.bindEvent=function(elem,name,type,handler) {
	/** @param {Event} evt */
	function wrapper(evt) {
		if(!evt) evt=/** @type {Event} */window.event;
		handler(evt,name);
	}

	elem.addEventListener(type,wrapper,true);

	return(wrapper);
};

/** @param {Element|Document} elem
  * @param {string} name
  * @param {string} type
  * @param {function(Event)} wrapper */
reach.util.releaseEvent=function(elem,name,type,wrapper) {
	elem.removeEventListener(type,wrapper,true);
};

/** @param {Event} evt
  * @param {Element} elem
  * @return {reach.XY} */
reach.util.getEventXY=function(evt,elem) {
	var x,y;

	x=0;
	y=0;

	if(evt.pageX || evt.pageY) {
		x=evt.pageX;
		y=evt.pageY;
	} else if(evt.clientX || evt.clientY) {
		x=evt.clientX+document.body.scrollLeft+document.documentElement.scrollLeft;
		y=evt.clientY+document.body.scrollTop+document.documentElement.scrollTop;
	}

	x-=elem.offsetLeft;
	y-=elem.offsetTop;

	return(new reach.XY(x,y));
};

/** @param {reach.Deg} ll1
  * @param {reach.Deg} ll2
  * @return {?number} Distance in meters. */
reach.util.vincenty=function(ll1,ll2) {
	// Adapted from http://www.movable-type.co.uk/scripts/latlong-vincenty.html
	// MIT-licensed JavaScript code in GeographicLib gives more accuracy but takes over 1000 lines of code.

	var f=reach.MU.flatten;
	var a=reach.MU.major;
	var b=reach.MU.minor;
	var lonDiff=(ll2.llon-ll1.llon)*Math.PI/180;
	var U1=Math.atan((1-f)*Math.tan(ll1.llat*Math.PI/180));
	var U2=Math.atan((1-f)*Math.tan(ll2.llat*Math.PI/180));
	var sinU1U2,cosU1U2;
	var sinU1=Math.sin(U1),cosU1=Math.cos(U1);
	var sinU2=Math.sin(U2),cosU2=Math.cos(U2);
	var sigma,sinAlpha,cosAlpha2;
	var lambda,lambdaPrev;
	var sinLambda,cosLambda;
	var sinSigma,cosSigma;
	var iterLimit;
	var ss1,ss2;
	var cos2SigmaM;
	var A,B,C;
	var u2;

	lambda=lonDiff;
	iterLimit=16;

	sinU1U2=sinU1*sinU2;
	cosU1U2=cosU1*cosU2;

	do {
		sinLambda=Math.sin(lambda);
		cosLambda=Math.cos(lambda);

		ss1=cosU2*sinLambda;
		ss2=cosU1*sinU2 - sinU1*cosU2*cosLambda;

		sinSigma=Math.sqrt(ss1*ss1 + ss2*ss2);
		if(sinSigma==0) return(0);	// Both points are equal.
		cosSigma=sinU1U2 + cosU1U2*cosLambda;
		sigma=Math.atan2(sinSigma,cosSigma);

		sinAlpha=cosU1U2*sinLambda/sinSigma;
		cosAlpha2=1-sinAlpha*sinAlpha;
		if(cosAlpha2==0) cos2SigmaM=0;	// Crossing Equator.
		else cos2SigmaM=cosSigma-2*sinU1U2/cosAlpha2;
		C=f/16*cosAlpha2*(4+f*(4-3*cosAlpha2));

		lambdaPrev=lambda;
		lambda=lonDiff + (1-C)*f*sinAlpha*(
			sigma + C*sinSigma*(
				cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)
			)
		);
	} while(Math.abs(lambda-lambdaPrev)>1e-12 && iterLimit--);

	if(iterLimit==0) return(null);		// Didn't converge to a result.

	u2=cosAlpha2*(a*a - b*b)/(b*b);
	A=1 + u2/16384*(4096+u2*(-768+u2*(320-175*u2)));
	B=u2/1024*(256+u2*(-128+u2*(74-47*u2)));

	return(
		b*A*(sigma-(
			B*sinSigma*(
				cos2SigmaM+B/4*(
					cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)
					-
					B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)
				)
			)
		))
	);
};
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

	result=[];
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
	var len,x;
	var result;

	result=[0];
	len=data.length;

	while(pos<len && count--) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])>=64) x=x*extra+c-64;
		result.push((x<<6)+c);
	}

	result[0]=pos;
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
	var len,x;
	var result;

	result=[0];
	len=data.length;

	while(pos<len && count--) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])<64) x=(x<<6)+c;
		result.push(x*extra+c-64);
	}

	result[0]=pos;
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
		pos=dec[0];
		rep=reach.util.toSigned(dec[1]);

		if(rep<0) {
			plain=enc.substr(pos,-rep);
			store=plain.split('');

			data.push(plain);
			outPos-=rep;
			pos-=rep;
		} else {
			rep+=minRefLen;
			dec=this.decodeShort(enc,pos,1);
			pos=dec[0];
			dist=dec[1]+1;
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
goog.provide('reach.io.Query');

/** @constructor */
reach.io.Query=function() {
	/** @type {Fiber.Fiber} */
	this.fiber=Fiber.current;
};

/** @param {Object.<string,string|number>} row */
reach.io.Query.prototype.addRow=function(row) {
	this.fiber.run(row);
};

reach.io.Query.prototype.finish=function() {
	this.fiber.run(null);
};

/** @return {?Object.<string,string|number>} */
reach.io.Query.prototype.getRow=function() {
	return(/** @type {?Object.<string,string|number>} */ global.yield());
};
goog.provide('reach.io.SQL');
goog.require('reach.io.Query');

/** @constructor
  * @param {string} name */
reach.io.SQL=function(name) {
	this.db=new sqlite3.Database(name,sqlite3.OPEN_READONLY);
};

/** @param {string} sql
  * @return {reach.io.Query} */
reach.io.SQL.prototype.query=function(sql) {
	var query;
	var i,l;
	var arg;

	query=new reach.io.Query();

	/** @param {string} err
	  * @param {Object.<string,*>} row */
	function rowHandler(err,row) {
		(/** @type {reach.io.Query} */ query).addRow(row);
	}

	l=arguments.length;
	arg=[];
	for(i=0;i<l;i++) arg.push(arguments[i]);
	arg.push(rowHandler);
	arg.push(function() {(/** @type {reach.io.Query} */ query).finish();});

	this.db.each.apply(this.db,arg);

	return(query);
};
goog.provide('reach.road.Node');
//goog.require('reach.route.InputPoint'); Circular dependency...
//goog.require('reach.route.Dijkstra');
goog.require('reach.MU');

/** @constructor
  * @param {reach.MU} ll */
reach.road.Node=function(ll) {
	/** @type {reach.MU} */
	this.ll=ll;
	/** @type {Array.<reach.road.Way>} */
	this.wayList=[];
	/** @type {Array.<number>} */
	this.posList=[];

	/** @type {number} */
	this.followerCount;
	/** @type {Array.<reach.road.Node>} */
	this.followerList;
	/** @type {Object.<number,?number>} */
	this.followerTbl;
	/** @type {Array.<number>} */
	this.distList;
	/** @type {boolean} */
	this.important;
	/** @type {number} */
	this.id;

	// Properties used only when clustering road nodes together in preprocessing.
	/** @type {number} */
	this.clusterNum;
	/** @type {number} */
	this.clusterTestNum;
	/** @type {Array.<reach.road.Node>} */
	this.clusterMembers;
	/** @type {reach.road.Node} */
	this.clusterRef;

	/** @type {Array.<reach.trans.Stop>} */
	this.stopList;

	/** @type {number} */
	this.runId;
	/** @type {number} */
	this.cost;
	/** @type {number} */
	this.time;
	/** @type {reach.road.Node} */
	this.srcNode;
	/** @type {reach.trans.Stop} */
	this.srcStop;

	/** @type {reach.route.InputPoint} */
	this.inputPoint;

	// Used only when writing OpenStreetMap-format data dump for debugging.
	/** @type {number} */
	this.dumpId;

	/** @type {boolean} */
	this.routing;
};

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.WayVisitor} visitor */
reach.road.Node.clusterVisitHandler=function(dijkstra,visitor) {
	var node;

	node=visitor.way.nodeList[visitor.pos];
	if(!node.clusterNum && node.runId!=dijkstra.runId && reach.util.vincenty(dijkstra.conf.startWayNodeList[0].node.ll.toDeg(),node.ll.toDeg())<dijkstra.clusterDist) {
		dijkstra.visitList[dijkstra.visitCount++]=node;
		node.runId=dijkstra.runId;
	}
};

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Conf} conf
  * @param {number} clusterNum
  * @return {reach.road.Node} */
reach.road.Node.prototype.makeCluster=function(dijkstra,conf,clusterNum) {
	/** @type {Array.<reach.road.Node>} */
	var clusterStack=[this];
	var bestCount;
	var bestCluster;
	var bestNode;
	var visitNum;
	var stackLen;
	var node;

	dijkstra.onVisitRoad=reach.road.Node.clusterVisitHandler;
	stackLen=1;
	bestCount=0;
	bestCluster=/** @type {Array.<reach.road.Node>} */ [];

	while(node=clusterStack[--stackLen]) {
		node.clusterTestNum=clusterNum;
		// Cost has to be != 0 or various tests for cost data existence will fail.
		conf.startWayNodeList=[{node:node,cost:1,time:0}];
		dijkstra.visitList=[];
		dijkstra.visitCount=0;
		dijkstra.start(conf);
		while(dijkstra.step()) {}
		if(dijkstra.visitCount>bestCount) {
			bestCount=dijkstra.visitCount;
			bestCluster=dijkstra.visitList;
			bestNode=node;

			for(visitNum=0;visitNum<bestCount;visitNum++) {
				node=/** @type {reach.road.Node} */ (bestCluster[visitNum]);
				if(node.clusterTestNum!=clusterNum) {
					node.clusterTestNum=clusterNum;
					clusterStack[stackLen++]=node;
				}
			}
		}
	}

	dijkstra.onVisitRoad=null;
	bestNode.clusterMembers=bestCluster;
	for(visitNum=0;visitNum<bestCount;visitNum++) {
		node=bestCluster[visitNum];
		node.clusterNum=clusterNum;
		node.clusterRef=bestNode;
	}

	return(bestNode);
};

/** @param {reach.road.Node} next */
reach.road.Node.prototype.removeFollower=function(next) {
	var followerNum;

	followerNum=this.followerTbl[next.id];
	//delete(this.followerTbl[next.id]);
//	this.followerList.splice(followerNum-1,1);
//	this.distList.splice(followerNum-1,1);

	this.followerTbl[next.id]=null;
	this.followerList[followerNum-1]=null;
//	this.distList[followerNum-1]=null;
	this.followerCount--;
};

/** @param {reach.road.Node} next
  * @param {number} dist */
reach.road.Node.prototype.connectTo=function(next,dist) {
	this.followerList.push(next);
	this.distList.push(dist);
	this.followerCount++;
	this.followerTbl[next.id]=this.followerCount;

	next.followerList.push(this);
	next.distList.push(dist);
	next.followerCount++;
	next.followerTbl[this.id]=next.followerCount;
};

/*
reach.road.Node.prototype.removeWay=function(way) {
	var wayList;
	var wayNum;

	wayList=this.wayList;
	for(wayNum=wayList.length;wayNum--;) {
		if(wayList[wayNum]==way) {
			wayList.splice(wayNum,1);
		}
	}
};
*/
goog.provide('reach.trans.Stop');
goog.require('reach.road.Node');
goog.require('reach.util');
goog.require('reach.MU');

/** @constructor
  * @param {number} id
  * @param {string} origId
  * @param {string} name
  * @param {reach.MU} ll */
reach.trans.Stop=function(id,origId,name,ll) {
	/** @type {number} */
	this.id=id;
	/** @type {string} */
	this.origId=origId;
	/** @type {string} */
	this.name=name;
	/** @type {number} */
	this.nameId;
	/** @type {reach.MU} */
	this.ll=ll;

	// Links connecting stop to transit network.
	/** @type {Array.<reach.trans.Line>} Transit lines passing by this stop. */
	this.lineList=[];
	/** @type {Array.<number>} How many stops are passed along each transit line before reaching this stop. */
	this.posList=[];

	// Routing data to store how stop was reached etc.
	/** @type {number} */
	this.runId;
	/** @type {Array.<number>} */
//	this.costList;
	/** @type {Array.<number>} */
//	this.timeList;
	/** @type {number} */
	this.cost;
	/** @type {number} */
	this.time;
	/** @type {Array.<reach.road.Node>} Street network node that led to this stop. */
	this.srcNodeList;
	/** @type {Array.<reach.trans.Trip>} Trip along a transit line that led to this stop. */
	this.srcTripList;
	/** @type {Array.<number>} Offset of this stop along source trip. */
	this.srcPosList;

	// For backtracking.
	/** @type {number} */
	this.lastVisitTime;
	/** @type {Array.<number>} */
	this.lastTimeList;
	/** @type {Array.<reach.trans.Trip>} */
	this.lastTripList;
	/** @type {Array.<{time:number,cost:number,trip:reach.trans.Trip}>} */
	this.reverseDataList;
	this.reverseData;
	/** @type {reach.trans.Stop} */
//	this.revStop;
	/** @type {number} */
//	this.revData;
	/** @type {number} */
//	this.revWalk;
	/** @type {number} */
//	this.revTime;

	// Links connecting stop to road network.
	/** @type {reach.road.Node} Nearest fast road graph node. */
	this.node;
	/** @type {reach.road.Node} Start point of nearest road segment in full road tile set. */
	this.refNodeA;
	/** @type {reach.road.Node} End point of nearest road segment in full road tile set. */
	this.refNodeB;

	// Time table statistics used when compressing and decompressing.
	/** @type {Array.<reach.trans.Stop>} */
	this.followerList=[];
	/** @type {Object.<number,number>} */
	this.followerTbl={};
	/** @type {Array.<Array.<number>>} */
	this.durationsTo;
	/** @type {Array.<{count:number,mean:number,variance:number,low:number,high:number}>} */
	this.statsTo=[];

	/** @type {number} */
	this.packFollowers;
	/** @type {Object.<number,number>} */
	this.packTbl;

	/** @type {reach.route.InputPoint} */
	this.inputPoint;

	/** @type {number} Number of departures around search start time, to evaluate stop niceness. */
	this.departureCount;

	/** @type {boolean} */
	this.disabled;
};

reach.trans.Stop.prototype.toString=function() {
	return(this.id+'\t'+this.name+'\t'+this.ll.toDeg());
};

/** @param {reach.trans.Stop} next
  * @param {number} duration */
reach.trans.Stop.prototype.addFollower=function(next,duration) {
	var followerNum;

	if(!this.durationsTo) this.durationsTo=[];
	followerNum=this.followerTbl[next.id];
	if(!followerNum && followerNum!==0) {
		followerNum=this.followerList.length;
		this.followerTbl[next.id]=followerNum;
		this.followerList.push(next);
		this.durationsTo.push([duration]);
	} else {
		this.durationsTo[followerNum].push(duration);
	}
};

// This is only used for compressing data.
/** @param {number} statMul */
reach.trans.Stop.prototype.calcStats=function(statMul) {
	var followerNum,followerCount;
	var i,sampleCount;
	var stats;
	var mean,stdDev;
	var duration,err;
	var durations,filteredDurations;

	if(!this.durationsTo) return;
	followerCount=this.durationsTo.length;

	for(followerNum=0;followerNum<followerCount;followerNum++) {
		durations=this.durationsTo[followerNum];
		stats=reach.util.getStats(durations);

		// Try to find errors if variance is over 1 minute.
		if(stats.variance>1) {
			stdDev=Math.sqrt(stats.variance);
			sampleCount=stats.count;
			mean=stats.mean;

			filteredDurations=[];

			for(i=0;i<sampleCount;i++) {
				duration=durations[i];
				err=(duration-mean)/stdDev;
				if(err<0) err=-err;

				// If difference from mean is 3 sigma or less, accept data point.
				if(err<=3) filteredDurations.push(duration);
			}

			stats=reach.util.getStats(filteredDurations);
		}

		for(var stat in stats) {
			if(stat!='count') stats[stat]=~~(stats[stat]*statMul+0.5);
		}

		this.statsTo[followerNum]=stats;
	}
};
goog.provide('reach.trans.StopSet');
goog.require('reach.trans.Stop');
goog.require('reach.data.Codec');
goog.require('reach.io.SQL');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.StopSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<reach.trans.Stop>} */
	this.list=[];
	/** @type {Object.<number,reach.trans.Stop>} */
	this.tbl={};
};

/** @param {reach.io.SQL} db */
reach.trans.StopSet.prototype.importKalkati=function(db) {
	var result;
	var row;
	var stopId;
	var origId;
	var name;
	var lat,lon;
	var ll;
	var stop;

	this.list=[];
	this.tbl={};

	result=db.query('SELECT statid,name,lat,lon FROM station ORDER BY statid;');
	stopId=0;

	while(row=result.getRow()) {
		origId=+row['statid'];
		name=/** @type {string} */ row['name'];
		lat=row['lat']/1000000;
		lon=row['lon']/1000000;
		ll=new reach.Deg(lat,lon).toMU();

		stop=new reach.trans.Stop(stopId,''+origId,name,ll);
		this.list.push(stop);
		this.tbl[origId]=stop;

		stopId++;
	}
};

/** @param {function(string)} write */
reach.trans.StopSet.prototype.exportPack=function(write) {
	var codec=new reach.data.Codec();
	var ll,lat,lon;
	var prevId,prevLat,prevLon,prevNameId;
	var i,stopCount;
	var stop;
	var data;
	var name,nameId,nameLen,nameCount,nameList,nameTbl;
	var compressed;

	stopCount=this.list.length;
	data=[];

	nameLen=0;
	nameCount=0;
	nameList=[];
	nameTbl=/** @type {Object.<string,number>} */ {};

	for(i=0;i<stopCount;i++) {
		stop=this.list[i];
		name=stop.name;
		if(name.length>nameLen) nameLen=name.length;
		nameId=nameTbl[name];
		if(!nameId) {
			nameId=nameCount++;
			nameTbl[name]=nameId;
			data.push(name+'\n');
		}
		stop.nameId=nameId;
	}

	compressed=codec.compressBytes(data.join(''),nameLen,10000);
	write(codec.encodeLong([this.city.firstDate.jd,this.city.dayCount,compressed.length]));
	write(compressed);

	data=[];

	prevId=0;
	prevLat=0;
	prevLon=0;
	prevNameId=0;

	for(i=0;i<stopCount;i++) {
		stop=this.list[i];
		ll=stop.ll.toDeg();
		lat=reach.util.round(ll.llat*100000,1);
		lon=reach.util.round(ll.llon*100000,1);
		nameId=stop.nameId;

		data.push(codec.encodeShort([
			reach.util.fromSigned(stop.origId-prevId),
			reach.util.fromSigned(stop.nameId-prevNameId),
			reach.util.fromSigned(lat-prevLat),
			reach.util.fromSigned(lon-prevLon)
		]));

		prevId=stop.origId;
		prevNameId=nameId;
		prevLat=lat;
		prevLon=lon;
	}

	write(codec.encodeLong([stopCount])+data.join('')+'\n');
};

/** @param {string} data
  * @return {{stepCount:number,advance:function():boolean}} */
reach.trans.StopSet.prototype.importPack=function(data) {
	/** @type {reach.trans.StopSet} */
	var self=this;
	/** @type {reach.data.Codec} */
	var codec;
	/** @type {number} */
	var origId;
	var ll;
	/** @type {number} */
	var lat;
	/** @type {number} */
	var lon;
	/** @type {number} */
	var nameId;
	/** @type {number} */
	var stopNum;
	var stopCount;
	var dec;
	var decomp;
	var pos,len;
	var nameList;
	var stop;
	var step;

	var state={stepCount:0,advance:function() {
		switch(step) {
			// Initialize.
			case 0:
				step++;

				codec=new reach.data.Codec();
				self.list=[];
				self.tbl={};
				pos=0;
				return(1);

			// Read list of stop names.
			case 1:
				step++;

				dec=codec.decodeLong(data,pos,3);
				pos=dec[0];
				self.city.firstDate=new reach.core.Date(dec[1]);
				self.city.dayCount=dec[2];
				len=dec[3];

				decomp=codec.decompressBytes(data,pos,len,10000);
				pos=decomp.pos;
				nameList=decomp.data.split('\n');
				return(1);

			// Initialize loop to read stop data.
			case 2:
				step++;

				origId=0;
				lat=0;
				lon=0;
				nameId=0;

				dec=codec.decodeLong(data,pos,1);
				pos=dec[0];

				stopCount=dec[1];
				stopNum=0;

				state.stepCount=stopCount;
				return(stopCount);

			// Iterate to read stop data.
			case 3:
				if(stopNum>=stopCount) return(0);

				dec=codec.decodeShort(data,pos,4);
				pos=dec[0];
				origId+=reach.util.toSigned(dec[1]);
				nameId+=reach.util.toSigned(dec[2]);
				lat+=reach.util.toSigned(dec[3]);
				lon+=reach.util.toSigned(dec[4]);

				ll=new reach.Deg(lat/100000,lon/100000).toMU();
				stop=new reach.trans.Stop(stopNum,''+origId,nameList[nameId],ll);

				self.list.push(stop);
				self.tbl[origId]=stop;

				stopNum++;
				return(stopCount-stopNum);
		}
	}};

	step=0;
	return(state);
};

reach.trans.StopSet.prototype.cleanUp=function() {
	var stopNum,stopCount;
	var stop;

//	delete(this.tbl);
	if(this.tbl) this.tbl=null;

	stopCount=this.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.list[stopNum];

		// Used in LineSet.importPack
//		delete(stop.followerList);
		if(stop.followerList) stop.followerList=null;

//		delete(stop.followerTbl);
//		delete(stop.durationsTo);
//		delete(stop.statsTo);
		if(stop.followerTbl) stop.followerTbl=null;
		if(stop.durationsTo) stop.durationsTo=null;
		if(stop.statsTo) stop.statsTo=null;

		// Used in StopSet.exportPack
//		delete(stop.nameId);

		// Used in LineSet.exportPack
//		delete(stop.packFollowers);
//		delete(stop.packTbl);
		if(stop.packFollowers) stop.packFollowers=null;
		if(stop.packTbl) stop.packTbl=null;
	}
};
goog.provide('reach.trans.Trip');
goog.require('reach.data.Codec');

/** @constructor
  * @param {reach.trans.Line} line
  * @param {{line:reach.trans.Line,mode:number,longCode:?string,shortCode:?string,name:?string}=} key */
reach.trans.Trip=function(line,key) {
	/** @type {{line:reach.trans.Line,mode:number,longCode:?string,shortCode:?string,name:?string}} */
	this.key=key?key:{
		line:line,
		mode:0,
		longCode:null,
		shortCode:null,
		name:null
	};

	/** @type {Array.<number>} Unit: minutes. */
	this.deltaList;

	/** @type {number} Unit: minutes. */
	this.startTime;
	/** @type {number} Unit: minutes. */
	this.duration;
	/** @type {number} */
	this.num;
};

/*
reach.trans.Trip.prototype.toDebug=function() {
	var codec=new reach.data.Codec();

	return({valid:codec.validListToBits(this.key.line.lineSet.validList[this.validity])});
};
*/

/** @param {Object.<string,*>|boolean} row
  * @param {Array.<string>} data
  * @param {number} valid */
reach.trans.Trip.prototype.importKalkati=function(row,data,valid) {
	var first,last,duration;
	var mins,prevMins;
	var stop,prevStop;
	var dataLen;
	var i,l;

	this.id=+row['servid'];
	this.key.mode=row['mode'];
	this.key.longCode=row['long'];
	this.key.shortCode=row['short'];
	this.key.name=row['name'];
	this.validity=valid;

	dataLen=data.length;

	// Read departure time from first stop in hhmm format and convert to minutes from midnight.
	first=+data[1];
	first=~~(first/100)*60+(first%100);

	// Read departure time from last stop in hhmm format and convert to minutes from midnight.
	last=+data[dataLen-1];
	last=~~(last/100)*60+(last%100);

	duration=last-first;
	if(duration<0) {
		// If arrival time at last stop is before first stop, it's probably the next day so check if the difference is over 12 hours.
		if(duration<-12*60) duration+=24*60;
		// If the difference is smaller, there must be an error and not much we can do.
		else duration=0;
	}
	if(duration>12*60) duration=0;

	this.startTime=first;
	this.duration=duration;

	prevStop=this.key.line.stopList[0];
	prevMins=first;
	l=data.length;
	for(i=3;i<dataLen;i+=2) {
		stop=this.key.line.stopList[(i-1)>>1];
		mins=+data[i];
		mins=~~(mins/100)*60+(mins%100);
		duration=mins-prevMins;

		if(duration<0) {
			// If arrival time at previous stop is before current stop, it's probably the next day so check if the difference is over 12 hours.
			if(duration<-12*60) duration+=24*60;
			// If the difference is smaller, there must be an error and not much we can do.
			else duration=0;
		}
		if(duration>12*60) duration=0;

		prevStop.addFollower(stop,duration);

		prevStop=stop;
		prevMins=mins;
	}
};

/** @param {number} stopNum
  * @return {number} Minutes from midnight. */
reach.trans.Trip.prototype.guessArrival=function(stopNum) {
	var statMul;
	var stopCount;
	var totalMeanDuration,totalVarianceSum;
	var correction,delta;
	var line;

	line=this.key.line;
	stopCount=line.stopList.length;
	totalMeanDuration=line.meanDuration[stopCount-1];
	totalVarianceSum=line.variance[stopCount-1];
	statMul=line.lineSet.city.statMul;

	if(totalVarianceSum==0) correction=0;
	else correction=(this.duration*statMul-totalMeanDuration)*line.variance[stopNum]/totalVarianceSum;

	if(this.deltaList && (delta=this.deltaList[stopNum>>2])) delta=((delta>>>((stopNum&3)*8))&255)-128;
	else delta=0;

//if(dbg && this.deltaList) console.log(this.startTime+'\t'+line.meanDuration[stopNum]+'\t'+correction+'\t'+delta+'\t'+this.duration+'\t'+statMul+'\t'+totalMeanDuration+'\t'+line.variance[stopNum]+'\t'+totalVarianceSum+'\t'+this.deltaList);

	return(this.startTime+~~((line.meanDuration[stopNum]+correction)/statMul+0.5)+delta);
};
goog.provide('reach.trans.Line');
goog.require('reach.trans.Stop');
goog.require('reach.trans.Trip');
goog.require('reach.util');

// TODO: Each line should have a table of transport modes used, to allow quick filterting when some transport modes are disallowed.
/** @constructor
  * @param {reach.trans.LineSet} lineSet */
reach.trans.Line=function(lineSet) {
	/** @type {reach.trans.LineSet} */
	this.lineSet=lineSet;
	/** @type {number} */
	this.id=0;

	/** @type {Array.<reach.trans.Stop>} */
	this.stopList=[];
	/** @type {Array.<reach.trans.Trip>} */
	this.tripList=[];

	/** @type {Object.<number,Object.<string,number>>} Used in compression error delta calculation to map departure times to trip numbers. */
	this.tripFirstTbl;

	/** @type {Object.<number,Array.<reach.trans.Trip>>} */
	this.tripListTbl={};
	/** @type {Array.<number>} Average time in minutes from first stop to reach each stop along the line. */
	this.meanDuration=[0];
	/** @type {Array.<number>} */
	this.variance=[0];

	/** @type {Object.<number,number>} Used to filter out line if none of its trips use an allowed mode of transportation. */
	this.transModeTbl={};

	/** @type {number} */
	this.runId=0;
	/** @type {Array.<number>} */
	this.costList=[];
	/** @type {Array.<number>} */
	this.timeList=[];
	/** @type {Array.<number>} */
//	this.srcPosList=[];
	/** @type {Array.<reach.trans.Stop>} */
	this.srcStopList=[];

	/** @type {Array.<number>} */
	this.distList=[];

	/** @type {number} Number of departures around search start time, to evaluate line niceness. */
	this.departureCount=0;
};

reach.trans.Line.prototype.calcStats=function() {
	var stopNum,stopCount;
	var followerNum;
	var stop,prevStop;
	var duration,variance;
	var stats;

	stopCount=this.stopList.length;
	stop=this.stopList[0];

	duration=0;
	variance=0;

	for(stopNum=1;stopNum<stopCount;stopNum++) {
		prevStop=stop;
		stop=this.stopList[stopNum];

		followerNum=prevStop.followerTbl[stop.id];
		stats=prevStop.statsTo[followerNum];
//		reach.util.assert(prevStop.followerList[followerNum]==stop,'calcStats','Error in follower list.');

		duration+=stats.mean;
		variance+=stats.variance;

		this.meanDuration[stopNum]=duration;
		this.variance[stopNum]=variance;
	}
};

/*
reach.trans.Line.prototype.dump=function(valid) {
	// Has to be fixed to use tripListTbl instead of tripList!
	var statMul;
	var stopNum,stopCount;
	var i,tripNum,tripCount;
	var stop;
	var trip;
	var name;
	var txt;
	var tripList;

	statMul=this.lineSet.city.statMul;
	stopCount=this.stopList.length;

	tripList=this.tripListTbl[valid];
	trip=tripList[0];
	console.log(trip.key.shortCode+'\t'+trip.key.name+'\t'+trip.key.longCode);
	console.log((this.meanDuration[stopCount-1]/statMul)+' +- '+(this.variance[stopCount-1]/statMul));

	txt=new Array(32).join(' ');

	i=0;
	tripCount=tripList.length;
	for(tripNum=0;tripNum<tripCount;tripNum++) {
		trip=tripList[tripNum];
//		if(!(this.lineSet.validList[trip.validity][1]&32)) continue;

		name=''+trip.duration;
//		tripList[i++]=trip;

		txt+=new Array(7-name.length).join(' ')+name;
	}

	console.log(txt);

	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.stopList[stopNum];
		name=stop.name.replace(/[\u00c4\u00c5\u00d6\u00e4\u00e5\u00f6]/g,'?');
		txt=name+(new Array(32-name.length).join(' '));

		tripCount=tripList.length;
		for(tripNum=0;tripNum<tripCount;tripNum++) {
			trip=tripList[tripNum];
//			txt+=' '+reach.util.formatMins(trip.startTime+~~((this.meanDuration[stopNum]+(trip.duration*statMul-this.meanDuration[stopCount-1])*this.variance[stopNum]/this.variance[stopCount-1])/statMul+0.5));
			txt+=' '+reach.util.formatMins(trip.guessArrival(stopNum));
		}

		console.log(txt);
	}
};
*/

/** @param {number} departTime Unit: minutes from midnight.
  * @return {number} */
reach.trans.Line.prototype.findDeparture=function(departTime) {
	var first,last,mid;
	var trip;

	mid=0;
	first=0;
	last=this.tripList.length-1;
	// Binary search to find when the next bus of this line arrives.
	while(first<=last) {
		mid=(first+last)>>1;
		trip=this.tripList[mid];
		if(trip.startTime<departTime) first=mid+1;
		else if(trip.startTime>departTime) last=mid-1;
		else break;
	}

	return(mid);
};

/** @param {number} stopNum   
  * @param {number} time   
  * @param {reach.route.Conf} conf   
  * @return {?{trip:reach.trans.Trip,time:number}} */
reach.trans.Line.prototype.guessArrival=function(stopNum,time,conf) {
	/** @type {reach.trans.Line} */
	var self=this;
	var departTime,arrivalTime,prevTime;
	var trip;
	var tripNum,last;
	var forward;
	var transCostTbl;
	var transCost;
	var prevNum;
	var near;

	if(this.tripList.length==0) return(null);

	transCostTbl=conf.transModeCostMul;
	if(!transCostTbl) transCostTbl={};

	forward=conf.forward;
	departTime=time/(60*conf.timeDiv)-this.meanDuration[stopNum]/conf.statMul;

	tripNum=this.findDeparture(departTime);
	trip=this.tripList[tripNum];
	transCost=transCostTbl[trip.key.mode];
	if(!transCost && transCost!==0) transCost=conf.transCostMul;

	arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
	last=this.tripList.length-1;

	/** @param {number} time
	  * @param {number} tripNum
	  * @param {number} arrivalTime
	  * @param {number} delta
	  * @param {number} last
	  * @param {reach.route.Conf} conf
	  * @param {Object.<number,number>} transCostTbl
	  * @return {Array.<number>} */
	function findNear(time,tripNum,arrivalTime,delta,last,conf,transCostTbl) {
		var prevTime;
		var transCost;
		var prevNum;
		var trip;

		prevNum=tripNum;
		prevTime=arrivalTime;
		tripNum+=delta;

		for(;tripNum>=0 && tripNum<=last;tripNum+=delta) {
			trip=self.tripList[tripNum];

			transCost=transCostTbl[trip.key.mode];
			if(!transCost && transCost!==0) transCost=conf.transCostMul;
			if(!transCost) continue;

			arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
			if((time-arrivalTime)*delta>0) {
				prevNum=tripNum;
				prevTime=arrivalTime;
			} else return([tripNum,arrivalTime,prevNum,prevTime]);
		}

		return([tripNum,arrivalTime,prevNum,prevTime]);
	}

	prevNum=tripNum;
	prevTime=arrivalTime;

	if((forward && arrivalTime>time) || (!forward && arrivalTime<time) || !transCost) {
		// Check if there's an even earlier arrival.
		near=findNear(time,tripNum,prevTime,forward?-1:1,last,conf,transCostTbl);
		tripNum=near[2];
		arrivalTime=near[3];

		trip=this.tripList[tripNum];
		transCost=transCostTbl[trip.key.mode];
		if(!transCost && transCost!==0) transCost=conf.transCostMul;
	}

	if((forward && arrivalTime<time) || (!forward && arrivalTime>time) || !transCost) {
		// The transport went already so find a later arrival.
		near=findNear(time,tripNum,prevTime,forward?1:-1,last,conf,transCostTbl);
		tripNum=near[0];
		arrivalTime=near[1];
		if(tripNum<0 || tripNum>last) return(null);

		trip=this.tripList[tripNum];
		transCost=transCostTbl[trip.key.mode];
		if(!transCost && transCost!==0) transCost=conf.transCostMul;
	}

	if((forward && arrivalTime<time) || (!forward && arrivalTime>time) || !transCost) return(null);

	return({trip:trip,time:arrivalTime,tripNum:tripNum});
};
goog.provide('reach.trans.TripSet');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.Line');
goog.require('reach.trans.Trip');
goog.require('reach.data.Codec');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.TripSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<{keyIdList:Array.<number>,tripDataTbl:Object.<number,{len:number,list:Array.<reach.trans.Trip>}>}>} */
	this.tripValidList;
	/** @type {Array.<string>} */
	this.keyList;
	/** @type {number} */
	this.keyMaxLen=0;
};

/** @param {reach.trans.LineSet} lineSet */
reach.trans.TripSet.prototype.populate=function(lineSet) {
	var lineNum,lineCount;
	var tripNum,tripCount;
	var line,trip;
	var tripData;
	var tripList;
	var tripKeyStruct;
	/** @type {Array.<{keyIdList:Array.<number>,tripDataTbl:Object.<number,{len:number,list:Array.<reach.trans.Trip>}>}>} */
	var tripValidList=[];
	/** @type {Object.<string,number>} */
	var keyTbl={};
	/** @type {Array.<string>} */
	var keyList=[];
	var keyId,keyCount,keyMaxLen;
	var keyData;

	lineCount=lineSet.list.length;

	keyCount=0;
	keyMaxLen=0;

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineSet.list[lineNum];

		for(var validId in line.tripListTbl) {
			if(!line.tripListTbl.hasOwnProperty(validId)) continue;

			// TODO: rename tripList and/or tripList2
			var tripList2=line.tripListTbl[+validId];
			tripCount=tripList2.length;
			for(tripNum=0;tripNum<tripCount;tripNum++) {
				trip=tripList2[tripNum];
				reach.util.assert(trip.key.line.id==lineNum,'exportTripPack','Incorrect line ID.');
				keyData=lineNum+'\t'+trip.key.mode+'\t'+trip.key.longCode+'\t'+trip.key.shortCode+'\t'+trip.key.name;

				keyId=keyTbl[keyData];
				if(!keyId && keyId!==0) {
					if(keyData.length>keyMaxLen) keyMaxLen=keyData.length;

					keyId=keyCount++;
					keyTbl[keyData]=keyId;
					keyList[keyId]=keyData;
				}

				tripKeyStruct=tripValidList[+validId];
				if(!tripKeyStruct) {
					tripKeyStruct={keyIdList:/** @type {Array.<number>} */ [],tripDataTbl:/** @type {Object.<number,{len:number,list:Array.<reach.trans.Trip>}>} */ {}};
					tripValidList[+validId]=tripKeyStruct;
				}

				tripData=tripKeyStruct.tripDataTbl[keyId];
				if(tripData) {
					tripList=tripData.list;
				} else {
					tripList=[];
					tripData={len:0,list:tripList};

					tripKeyStruct.tripDataTbl[keyId]=tripData;
					tripKeyStruct.keyIdList.push(keyId);
				}

				tripList[tripData.len++]=trip;
			}
		}
	}

	this.tripValidList=tripValidList;
	this.keyMaxLen=keyMaxLen;
	this.keyList=keyList;
};

/** @param {function(string)} write
  * @param {reach.trans.LineSet} lineSet */
reach.trans.TripSet.prototype.exportPack=function(write,lineSet) {
	var codec=new reach.data.Codec();
	var validNum,validCount;
	var keyNum,keyCount;
	var tripNum,tripCount;
	var tripList;
	var trip;
	var keyId,prevKeyId;
	var wait,prevWait;
	var prevId,prevStart,prevDuration;
	var tripKeyStruct;
	var data,row;
	var txt;
	var a,b;

	txt=codec.compressBytes(this.keyList.join('\n'),this.keyMaxLen,10000);
	write(codec.encodeLong([txt.length]));
	write(txt);

	validCount=this.tripValidList.length;
	write(codec.encodeLong([validCount]));

	for(validNum=0;validNum<validCount;validNum++) {
		write(codec.encodeShort(lineSet.validList[validNum]));
	}

	for(validNum=0;validNum<validCount;validNum++) {
		tripKeyStruct=this.tripValidList[validNum];
		if(!tripKeyStruct) {
			write(codec.encodeLong([0,0]));
			continue;
		}

		data=[];

//		prevId=0;
		keyId=0;
		keyCount=tripKeyStruct.keyIdList.length;

		for(keyNum=0;keyNum<keyCount;keyNum++) {
			prevKeyId=keyId;
			keyId=tripKeyStruct.keyIdList[keyNum];
			row=[];

			tripList=tripKeyStruct.tripDataTbl[keyId].list;
			tripCount=tripList.length;

			prevStart=0;
			prevWait=0;
			prevDuration=0;

			for(tripNum=0;tripNum<tripCount;tripNum++) {
				trip=tripList[tripNum];

				wait=trip.startTime-prevStart;
				a=reach.util.fromSigned(wait-prevWait);
				b=reach.util.fromSigned(trip.duration-prevDuration);
//				c=reach.util.fromSigned(trip.id-prevId);

//				prevId=trip.id;
				prevStart=trip.startTime;
				if(tripNum>0) prevWait=wait;
				prevDuration=trip.duration;

//				if(a<3 && b<3 && c==2) row.push(a*3+b);
//				else row.push(a+9,b,c);
				if(a<3 && b<3) row.push(a*3+b);
				else row.push(a+9,b);
			}

			txt=codec.encodeShort(row);
			data.push(codec.encodeShort([reach.util.fromSigned(keyId-prevKeyId),row.length]),txt);
		}

		txt=data.join('');

		txt=codec.compressBytes(txt,txt.length,10000);
		write(codec.encodeShort([keyCount,txt.length]));
		write(txt);
	}

	write('\n');
};

/** @param {string} data
  * @param {reach.trans.LineSet} lineSet
  * @param {Array.<number>} validMask
  * @return {function():boolean} */
reach.trans.TripSet.prototype.importPack=function(data,lineSet,validMask) {
	/** @type {reach.data.Codec} */
	var codec;
	var validAccept;
	var validNum,validCount;
	var tripCount;
//	var lineNum,lineCount;
	var dec;
	var validData;
	var pos,validPos,len;
	/** @type {Array.<string>} */
	var keyList;
	var decomp;
	var keyNum,keyId;
	var keyCount;
	var i,rowLen;
	var a,b;
	var startTime,wait,duration;
	var line,trip;
	var first;
	/** @type {Array.<string>} */
	var keyData;
	/** @type {{mode:number,longCode:?string,shortCode:?string,name:?string,line:reach.trans.Line}} */
	var key;
	var item;
	var step;

	var state={stepCount:0,advance:function() {
		switch(step) {
			// Initialize. 
			case 0:
				step++;

//				if(!createObj) {
//					lineCount=city.lineSet.list.length;
//					for(lineNum=0;lineNum<lineCount;lineNum++) {
//						lineSet.list[lineNum].tripDataTbl=[];
//					}
//				}

				codec=new reach.data.Codec();
				pos=0;

				return(1);

			// Read list of trip codes and names.
			case 1:
				step++;

				dec=codec.decodeLong(data,pos,1);
				pos=dec[0];
				len=dec[1];

				decomp=codec.decompressBytes(data,pos,len,10000);
				pos=decomp.pos;
				keyList=decomp.data.split('\n');

				return(1);

			// Initialize loop to read trip data.
			case 2:
				step++;

				dec=codec.decodeLong(data,pos,1);
				pos=dec[0];
				validCount=dec[1];
				validAccept=[];

				for(validNum=0;validNum<validCount;validNum++) {
					dec=codec.decodeShort(data,pos,1);
					pos=dec[0];
					len=dec[1];

					i=~~((len+5)/6);

					dec=codec.decodeShort(data,pos,i);
					pos=dec[0];
					dec[0]=len;

					lineSet.validList[validNum]=dec;

					validAccept[validNum]=false;
					do {
						if(dec[i]&validMask[i]) {
							validAccept[validNum]=true;
							break;
						}
					} while(--i);
				}
				lineSet.validAccept=validAccept;
				validNum=0;

				state.stepCount=validCount;
				break;

			// Iterate to read trip data for different sets of valid days.
			case 3:
				dec=codec.decodeShort(data,pos,2);
				pos=dec[0];
				keyCount=dec[1];
				len=dec[2];

				tripCount+=keyCount;

				if(!validAccept[validNum]) {
					pos+=len;
					validNum++;
					break;
				}

				decomp=codec.decompressBytes(data,pos,len,-1);
				pos=decomp.pos;
				validData=decomp.data;

				validPos=0;
				keyId=0;

				for(keyNum=0;keyNum<keyCount;keyNum++) {
					dec=codec.decodeShort(validData,validPos,2);
					validPos=dec[0];
					keyId+=reach.util.toSigned(dec[1]);
					rowLen=dec[2];

					keyData=keyList[keyId].split('\t');
					line=lineSet.list[+keyData[0]];
					key={line:line,mode:+keyData[1],longCode:keyData[2],shortCode:keyData[3],name:keyData[4]};

					dec=codec.decodeShort(validData,validPos,rowLen);
					validPos=dec[0];

					wait=0;
					startTime=0;
					duration=0;
					first=true;

					for(i=0;i<rowLen;) {
						a=dec[++i];
						if(a<9) {
							b=a%3;
							a=(a-b)/3;
						} else {
							a-=9;
							b=dec[++i];
						}

						wait+=reach.util.toSigned(a);
						duration+=reach.util.toSigned(b);
						startTime+=wait;

						if(first) wait=0;

						trip=new reach.trans.Trip(line,key);

//						trip.validity=validNum;
						trip.startTime=startTime;
						trip.duration=duration;

						if(!line.tripListTbl[validNum]) line.tripListTbl[validNum]=[];
						line.tripListTbl[validNum].push(trip);

						if(!line.transModeTbl[trip.key.mode]) line.transModeTbl[trip.key.mode]=0;
						line.transModeTbl[trip.key.mode]++;

						first=false;
					}
				}

				validNum++;
				break;
		}

		if(validNum>=validCount) state.stepCount=tripCount;
		return(validCount-validNum);
	}};

	tripCount=0;
	step=0;
	return(state);
};
goog.provide('reach.trans.LineSet');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.TripSet');
goog.require('reach.trans.Line');
goog.require('reach.data.Codec');
goog.require('reach.io.SQL');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.LineSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<reach.trans.Line>} */
	this.list=[];
	/** @type {number} */
	this.maxRep=16;

	/** @type {Object.<string,number>} */
	this.validBitsTbl={};
	/** @type {Array.<Array.<number>>} */
	this.validList=[];
	/** @type {Array.<boolean>} */
	this.validAccept;
};

/** @param {reach.io.SQL} db
  * @param {reach.trans.StopSet} stopSet */
reach.trans.LineSet.prototype.importKalkati=function(db,stopSet) {
	var codec=new reach.data.Codec();
	var result,row;
	var lineTbl,lineId;
	var data;
	var dataLen;
	var stopIdList;
	var line;
	var lineKey;
	var trip;
	var i,l;
	var validBits;
	var valid;

	this.list=[];
	lineTbl=/** @type {Object.<string,reach.trans.Line>} */ {};

	result=db.query('SELECT servid,mode,long,short,name,valid,data FROM servicedata ORDER BY long,valid DESC,first;');
	lineId=0;

	while(row=result.getRow()) {
		data=(/** @type {Object.<string,string>} */ row)['data'].split(' ');

		dataLen=data.length;

		stopIdList=[];
		for(i=0;i<dataLen;i+=2) stopIdList.push(+data[i]);
		lineKey=stopIdList.join(' ');
		line=lineTbl[lineKey];

		if(!line) {
			line=new reach.trans.Line(this);
			line.id=lineId++;
			lineTbl[lineKey]=line;
			this.list.push(line);

			l=stopIdList.length;
			for(i=0;i<l;i++) {
				line.stopList.push(stopSet.tbl[stopIdList[i]]);
			}
		}

		validBits=row['valid'];
		valid=this.validBitsTbl[validBits];
		if(!valid && valid!==0) {
			valid=this.validList.length;
			this.validBitsTbl[validBits]=valid;
			this.validList[valid]=codec.validBitsToList(validBits);
		}

		trip=new reach.trans.Trip(line);
		trip.importKalkati(row,data,valid);

		if(!line.tripListTbl[valid]) line.tripListTbl[valid]=[];
		line.tripListTbl[valid].push(trip);
	}
};

/** @param {function(string)} write */
reach.trans.LineSet.prototype.exportPack=function(write) {
	var codec=new reach.data.Codec();
	var lineNum,lineCount;
	var i,stopCount;
	var line;
	var stop,prevStop;
	var packNum;
	var repLen;
	var stats;
	var data;
	var maxRep;

	maxRep=this.maxRep;

	lineCount=this.list.length;
	data=[];

	data.push(codec.encodeShort([lineCount]));

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];
		stopCount=line.stopList.length;

		stop=line.stopList[0];
		data.push(codec.encodeShort([stopCount,stop.id]));
		repLen=0;

		for(i=1;i<stopCount;i++) {
			prevStop=stop;

			if(!prevStop.packTbl) {
				prevStop.packTbl={};
				prevStop.packFollowers=0;
			}

			stop=line.stopList[i];
			packNum=prevStop.packTbl[stop.id];
			if(packNum===0) {
				if(repLen==maxRep) {
					data.push(codec.encodeShort([repLen-1]));
					repLen=0;
				}
				repLen++;
			} else {
				if(repLen) data.push(codec.encodeShort([repLen-1]));
				repLen=0;

				if(packNum) {
					data.push(codec.encodeShort([packNum+maxRep-1]));
				} else {
					stats=prevStop.statsTo[prevStop.followerTbl[stop.id]];
					data.push(codec.encodeShort([prevStop.packFollowers+stop.id+maxRep,stats.mean,stats.variance]));
					prevStop.packTbl[stop.id]=prevStop.packFollowers++;
				}
			}
		}
		if(repLen) data.push(codec.encodeShort([repLen-1]));
	}

	write(data.join('')+'\n');
};

/** @param {string} data
  * @param {reach.trans.StopSet} stopSet
  * @return {function():boolean} */
reach.trans.LineSet.prototype.importPack=function(data,stopSet) {
	/** @type {reach.trans.LineSet} */
	var self=this;
	/** @type {reach.data.Codec} */
	var codec;
	var lineNum,lineCount;
	var line;
	var i,stopNum,stopCount;
	var stop,prevStop;
	var id;
	var dec;
	var pos;
	var j,maxRep;
	var followerCount;
	var mean,variance;
	var step;

	var state={stepCount:0,advance:function() {
		switch(step) {
			// Initialize.
			case 0:
				step++;

				codec=new reach.data.Codec();
				maxRep=self.maxRep;
				pos=0;

				dec=codec.decodeShort(data,pos,1);
				pos=dec[0];
				lineCount=dec[1];
				lineNum=0;

				state.stepCount=lineCount;
				return(lineCount-lineNum);

			// Iterate to load info for each line such as list of stops.
			case 1:
				if(lineNum>=lineCount) return(0);

				line=new reach.trans.Line(self);
				line.id=lineNum;

				dec=codec.decodeShort(data,pos,2);
				pos=dec[0];
				stopCount=dec[1];
				stopNum=0;
				stop=stopSet.list[dec[2]];
//				line.stopList.push(stop);
				stop.posList.push(stopNum);
				line.stopList[stopNum++]=stop;
				stop.lineList.push(line);

				for(i=1;i<stopCount;i++) {
					dec=codec.decodeShort(data,pos,1);
					pos=dec[0];
					id=dec[1];

					followerCount=stop.followerList.length;

					if(id<maxRep) {
						// The next <id> stops are in the same order as when those stops were first seen in the data.
						for(j=0;j<=id;j++) {
							prevStop=stop;
							stop=prevStop.followerList[0];
//							line.stopList.push(stop);
							stop.posList.push(stopNum);
							line.stopList[stopNum++]=stop;
							stop.lineList.push(line);
						}
						i+=id;
					} else if(id<maxRep+followerCount) {
						// Next stop has already been seen after this stop on other lines so its full ID and reach time aren't needed.
						prevStop=stop;
						stop=prevStop.followerList[id-maxRep+1];
//						line.stopList.push(stop);
						stop.posList.push(stopNum);
						line.stopList[stopNum++]=stop;
						stop.lineList.push(line);
					} else {
						// Next stop hasn't been seen following this stop so also store reach time mean and variance between the stops.
						dec=codec.decodeShort(data,pos,2);
						pos=dec[0];
						mean=dec[1];
						variance=dec[2];

						prevStop=stop;
						stop=stopSet.list[id-followerCount-maxRep];
//						line.stopList.push(stop);
						stop.posList.push(stopNum);
						line.stopList[stopNum++]=stop;
						stop.lineList.push(line);

						prevStop.followerList[followerCount]=stop;
						prevStop.followerTbl[stop.id]=followerCount;
						prevStop.statsTo[followerCount]={mean:mean,variance:variance};
					}
				}

				line.calcStats();
				self.list.push(line);

				lineNum++;
				return(lineCount-lineNum);
		}
	}};

	step=0;
	return(state);
};

reach.trans.LineSet.prototype.cleanUp=function() {
	var lineNum,lineCount;
	var line;

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

//		delete(line.tripFirstTbl);
		if(line.tripFirstTbl) line.tripFirstTbl=null;
	}
};

// This used to be called initTrips.
reach.trans.LineSet.prototype.sortTrips=function() {
    var lineNum;
    var line;
    var tripListList;
	var tripNum;

	/** @param {reach.trans.Trip} a
	  * @param {reach.trans.Trip} b
	  * @return {number} */
	function compareTrips(a,b) {
		return(a.startTime-b.startTime);
	}

	for(lineNum=this.list.length;lineNum--;) {
		line=this.city.lineSet.list[lineNum];
		tripListList=[];
		for(var validNum in line.tripListTbl) {
			if(this.validAccept[validNum] && line.tripListTbl.hasOwnProperty(validNum)) {
				tripListList.push(line.tripListTbl[+validNum]);
			}
		}

		// Concatenate together all trip lists from different valid day groups.
		line.tripList=line.tripList.concat.apply(line.tripList,tripListList);

		line.tripList.sort(compareTrips);

		for(tripNum=line.tripList.length;tripNum--;) {
			line.tripList[tripNum].num=tripNum;
		}
	}
};

/** @param {number} startTime Unit: minutes. */
reach.trans.LineSet.prototype.calcNiceness=function(startTime) {
	var lineNum,lineCount;
	var line;
	var trip;
	var stopNum,stopCount;
	var stop;
	var lastTime;
	var i,l;

	stopCount=this.city.stopSet.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=this.city.stopSet.list[stopNum];
		stop.departureCount=0;
	}

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

		// Find departures within an hour after search start time.
		lastTime=startTime+60;
		l=line.tripList.length;

		line.departureCount=0;
		for(i=line.findDeparture(startTime);i<l;i++) {
			trip=line.tripList[i];
			if(trip.startTime>lastTime) break;
			line.departureCount++;
		}

		stopCount=line.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=line.stopList[stopNum];
			stop.departureCount+=line.departureCount;
		}
	}
};

/** @param {string} data
  * @param {reach.trans.StopSet} stopSet
  * @param {number} distDiv */
reach.trans.LineSet.prototype.importDistPack=function(data,stopSet,distDiv) {
	var codec=new reach.data.Codec();
	var stopNum,stopCount;
	var stop,prevStop;
	var followerNum,followerCount;
	var lineNum,lineCount;
	var line;
	var dist;
	var dec;
	var pos;

	pos=0;

	stopCount=stopSet.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopSet.list[stopNum];
		dec=codec.decodeShort(data,pos,1);
		pos=dec[0];
		followerCount=dec[1];

		for(followerNum=0;followerNum<followerCount;followerNum++) {
			dec=codec.decodeLong(data,pos,2);
			pos=dec[0];

			stop.followerTbl[dec[1]]=dec[2]/distDiv;
		}
	}

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

		stop=line.stopList[0];
		stopCount=line.stopList.length;
		for(stopNum=1;stopNum<stopCount;stopNum++) {
			prevStop=stop;
			stop=line.stopList[stopNum];

			if(prevStop.followerTbl[stop.id]) dist=prevStop.followerTbl[stop.id];
			if(!dist) dist=reach.util.vincenty(prevStop.ll.toDeg(),stop.ll.toDeg());
			if(!dist) dist=0;

			line.distList[stopNum-1]=dist;
		}
	}
};
goog.provide('reach.trans.DeltaSet');
goog.require('reach.trans.LineSet');
goog.require('reach.trans.TripSet');
goog.require('reach.data.Codec');
goog.require('reach.io.SQL');
goog.require('reach.util');

/** @constructor
  * @param {reach.trans.City} city */
reach.trans.DeltaSet=function(city) {
	/** @type {reach.trans.City} */
	this.city=city;
	/** @type {Array.<Array.<Array.<number>>>} */
	this.deltaList=[];
};

/** @param {reach.io.SQL} db
  * @param {reach.trans.LineSet} lineSet
  * @param {reach.trans.TripSet} tripSet */
reach.trans.DeltaSet.prototype.importKalkati=function(db,lineSet,tripSet) {
	var codec=new reach.data.Codec();
	var lineNum,lineCount;
	var stopNum,stopCount;
	var tripNum,tripCount;
	var tripList;
	var line,stop,trip;
	var lineTbl;
	var stopIdList;
	var key;
	var validNum;
	var valid;
	var result,row;
	var i,dataLen;
	var data;
	var first,arrival,err;
	var mins,prevMins,duration;
	var deltaList;
	var histogram,sum;

	// Build hashes to find trips by validity bit sets, trip codes, departure times etc.
	lineTbl=/** @type {Array.<string,reach.trans.Line>} */ {};

	i=0;
	for(i in lineSet.validBitsTbl) i++;
	if(i==0) {
		for(i=0;i<lineSet.validList.length;i++) {
			lineSet.validBitsTbl[codec.validListToBits(lineSet.validList[i])]=i;
		}
	}

	lineCount=lineSet.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineSet.list[lineNum];
		line.tripFirstTbl={};

		stopIdList=[];
		stopCount=line.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=line.stopList[stopNum];
			stopIdList.push(stop.origId);
		}
		key=stopIdList.join(' ');
		lineTbl[key]=line;

		for(var valid in line.tripListTbl) {
			if(!line.tripListTbl.hasOwnProperty(valid)) continue;

			validNum=+valid;
			line.tripFirstTbl[validNum]={};
			tripList=line.tripListTbl[validNum];
			tripCount=tripList.length;
			for(tripNum=0;tripNum<tripCount;tripNum++) {
				trip=tripList[tripNum];
				key=trip.startTime+'\t'+trip.key.longCode;
				line.tripFirstTbl[validNum][key]=tripNum;
			}
		}
	}

	histogram=[];
	deltaList=/** @type {Array.<Array.<Array.<number>>>} */ [];

	result=db.query('SELECT servid,mode,long,short,name,valid,data FROM servicedata ORDER BY long,valid DESC,first;');
	while(row=result.getRow()) {
		data=(/** @type {Object.<string,string>} */ row)['data'].split(' ');
		dataLen=data.length;

		stopIdList=[];
		for(i=0;i<dataLen;i+=2) stopIdList.push(+data[i]);
		key=stopIdList.join(' ');
		line=lineTbl[key];

		first=+data[1];
		first=~~(first/100)*60+(first%100);

		valid=lineSet.validBitsTbl[row['valid']];

		key=first+'\t'+row['long'];
		tripNum=line.tripFirstTbl[valid][key];
		trip=line.tripListTbl[valid][tripNum];
		reach.util.assert(trip.startTime==first && trip.key.longCode==row['long'],'DeltaSet.importKalkati','Incorrect tripNum '+tripNum+'.');

		stopNum=0;
		arrival=first;
		prevMins=first;
		for(i=1;i<dataLen;i+=2) {
			mins=+data[i];
			mins=~~(mins/100)*60+(mins%100);
			duration=mins-prevMins;

			if(duration<0) {
				// If arrival time at previous stop is before current stop, it's probably the next day so check if the difference is over 12 hours.
				if(duration<-12*60) duration+=24*60;
				// If the difference is smaller, there must be an error and not much we can do.
				else duration=0;
			}
			if(duration>12*60) duration=0;

			arrival+=duration;
			err=arrival-trip.guessArrival(stopNum);

			if(err<-1 || err>1) {
				if(!deltaList[valid]) deltaList[valid]=/** @type {Array.<Array.<number>>} */ [];
				deltaList[valid].push(/** @type {Array.<number>} */([line.id,tripNum,stopNum,err]));
			}

//console.log(err+'\t'+arrival+'\t'+trip.guessArrival(stopNum));
			err=reach.util.fromSigned(err);
			if(!histogram[err]) histogram[err]=0;
			histogram[err]++;

			prevMins=mins;
			stopNum++;
		}
	}

	this.deltaList=deltaList;
	return(histogram);
};

/** @param {function(string)} write */
reach.trans.DeltaSet.prototype.exportPack=function(write) {
	var codec=new reach.data.Codec();
	var validNum,validCount;
	var data;
	var deltaList;
	var deltaNum,deltaCount;
	var prevLine,prevTrip,prevStop,prevErr,err;
	var out;
	var data2;
	var txt;

	/** @param {Array.<number>} a
	  * @param {Array.<number>} b */
	function compareDeltas(a,b) {
		var d;
		d=a[0]-b[0];if(d) return(d);
		d=a[1]-b[1];if(d) return(d);
		d=a[2]-b[2];if(d) return(d);
		d=a[3]-b[3];
		return(d);
	}

	validCount=this.deltaList.length;
	write(codec.encodeShort([validCount]));

	for(validNum=0;validNum<validCount;validNum++) {
		deltaList=this.deltaList[validNum];
		if(!deltaList) {
			write(codec.encodeShort([0]));
			continue;
		}

		deltaList.sort(compareDeltas);

		prevLine=0;
		prevTrip=0;
		prevStop=0;

		deltaCount=deltaList.length;
		data2=[];

		for(deltaNum=0;deltaNum<deltaCount;deltaNum++) {
			data=deltaList[deltaNum];
//console.log(data);
//console.log(this.city.lineSet.list[data[0]].tripListTbl[validNum][data[1]].name+'\t'+this.city.lineSet.list[data[0]].tripListTbl[validNum][data[1]].startTime);
			err=reach.util.fromSigned(data[3]);

			if(data[0]==prevLine && data[1]==prevTrip && data[2]==prevStop+1) {
				if(err==prevErr) out=[9];
				else out=[10,err];
			} else {
				if(data[0]!=prevLine) {
					prevTrip=0;
					prevStop=0;
				}
				else if(data[1]!=prevTrip) prevStop=0;

				if(data[0]-prevLine<3 && data[1]-prevTrip<3) {
//					console.log(((data[0]-prevLine)*3+data[1]-prevTrip)+'\t'+(data[2]-prevStop)+'\t'+err);
					out=[((data[0]-prevLine)*3+data[1]-prevTrip),(data[2]-prevStop),err];
				} else {
//					console.log((data[0]-prevLine+11)+'\t'+(data[1]-prevTrip)+'\t'+(data[2]-prevStop)+'\t'+err);
					out=[(data[0]-prevLine+11),(data[1]-prevTrip),(data[2]-prevStop),err];
				}
			}

			data2.push(codec.encodeShort(out));

			prevLine=data[0];
			prevTrip=data[1];
			prevStop=data[2];
			prevErr=err;
		}

		txt=codec.compressBytes(data2.join(''),256,10000);
		write(codec.encodeShort([deltaCount,txt.length]));
		write(txt);
	}
};

/** @param {string} data
  * @param {reach.trans.LineSet} lineSet
  * @return {function():boolean} */
reach.trans.DeltaSet.prototype.importPack=function(data,lineSet) {
	/** @type {reach.data.Codec} */
	var codec=new reach.data.Codec();
	var deltaNum,deltaCount;
	var tripCount;
	var validNum,validCount;
	var validAccept;
	var lineNum,tripNum,stopNum;
	var line;
	var trip;
	var err;
	var dec;
	var pos,pos2,len;
	var decomp;
	var data,data2;
	var step;

	var state={stepCount:0,advance:function() {
		var lineDelta;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				pos=0;
				dec=codec.decodeShort(data,pos,1);
				pos=dec[0];
				validCount=dec[1];
//console.log(validCount);
				validAccept=lineSet.validAccept;
				validNum=0;

				state.stepCount=validCount;
				break;

			case 1:
				dec=codec.decodeShort(data,pos,1);
				pos=dec[0];
				deltaCount=dec[1];
				tripCount+=deltaCount;

				if(deltaCount==0) {
					validNum++;
					break;
				}

				dec=codec.decodeShort(data,pos,1);
				pos=dec[0];
				len=dec[1];

				if(validAccept && !validAccept[validNum]) {
					pos+=len;
					validNum++;
					break;
				}

				decomp=codec.decompressBytes(data,pos,len,10000);
				pos=decomp.pos;
				data2=decomp.data;
				pos2=0;

				lineNum=0;
				tripNum=0;
				stopNum=0;
				err=0;

				for(deltaNum=0;deltaNum<deltaCount;deltaNum++) {
					dec=codec.decodeShort(data2,pos2,1);
					pos2=dec[0];

					lineDelta=dec[1];
					if(lineDelta==9) {
						stopNum++;
					} else if(lineDelta==10) {
						dec=codec.decodeShort(data2,pos2,1);
						pos2=dec[0];
						err=reach.util.toSigned(dec[1]);
						stopNum++;
					} else if(lineDelta<9) {
						dec=codec.decodeShort(data2,pos2,2);
						pos2=dec[0];
						lineNum+=~~(lineDelta/3);
						if(lineDelta>2) tripNum=0;
						if(lineDelta!=0) stopNum=0;
						tripNum+=lineDelta%3;
						stopNum+=dec[1];
						err=reach.util.toSigned(dec[2]);
					} else {
						dec=codec.decodeShort(data2,pos2,3);
						pos2=dec[0];
						lineNum+=lineDelta-11;
						if(lineDelta>11) {tripNum=0;stopNum=0;}
						if(dec[1]>0) stopNum=0;
						tripNum+=dec[1];
						stopNum+=dec[2];
						err=reach.util.toSigned(dec[3]);
					}

					line=lineSet.list[lineNum];
					trip=line.tripListTbl[validNum][tripNum];
					if(!trip.deltaList) trip.deltaList=[];
					if(!trip.deltaList[stopNum>>2]) trip.deltaList[stopNum>>2]=0x80808080;
					trip.deltaList[stopNum>>2]^=(((err+128)&255)^0x80)<<((stopNum&3)*8);
//console.log(((trip.deltaList[stopNum>>2]>>>((stopNum&3)*8))&255)-128);
//					console.log(validNum+'\t'+lineNum+'\t'+tripNum+'\t'+stopNum+'\t'+err);
//for(var x in line.tripListTbl) console.log(x);
//					console.log(line.tripListTbl.length+'\t'+line.tripListTbl[validNum]);
//console.log(line.tripListTbl[validNum][tripNum].deltaList);
				}

				validNum++;
				break;
		}

		if(validNum>=validCount) state.stepCount=tripCount;
		return(validCount-validNum);
	}};

	tripCount=0;
	step=0;
	return(state);
};
goog.provide('reach.core.Date');

/** @constructor
  * @param {number} jd */
reach.core.Date=function(jd) {
	var year,month,day;
	var century;
	var isoWeekDay,weekDay,yearDay,isoYear,isoWeek;
	var jd1,jd4;
	var y;

	/** @param {number} jd */
	function getYMD(jd) {
		var century,centuryDay,yearDay;

		// Make the year start on March 1st so the weird month of February is moved to the end.
		jd+=305;
		// 146097 is the number of days in 400 years.
		century=~~((jd*4+3)/146097);
		centuryDay=jd-((century*146097)>>2);
		// 1461 is the number of days in 4 years.
		year=~~((centuryDay*4+3)/1461);
		yearDay=centuryDay-((year*1461)>>2);
		// 153 is the number of days in 5-month periods Mar-Jul and Aug-Dec. Here month 0 is March.
		month=~~((5*yearDay+2)/153);

		day=yearDay-~~((month*153+2)/5)+1;
		// Offset months so counting starts from 1 and March becomes 3.
		month=(month+2)%12+1;
		// If month is Jan-Feb, increment year because it was effectively decremented when years were modified to start on March 1st.
		year=century*100+year+((18-month)>>4);
	}

	// US day of the week minus one, 0 is Sunday.
	weekDay=jd%7;
	// ISO day of the week minus one, 0 is Monday.
	isoWeekDay=(jd+6)%7;


	// Handle ISO week which belongs to the year its Thursday falls on.
	// Process Julian day on this week's Thursday.
	getYMD(jd-isoWeekDay+3);
	isoYear=/** @type {number} */ year;

	y=isoYear-1;
	century=~~(y/100);
	// Julian day of Sunday before this ISO year's January 4th.
	jd4=(century>>2)-century+(y>>2)+y*365+3;
	jd4-=jd4%7;
	// Calculate ISO week number.
    isoWeek=~~((jd-jd4+6)/7);

	getYMD(jd);

	y=year-1;
	century=~~(y/100);
	// Julian day of the last day of previous year.
	jd1=(century>>2)-century+(y>>2)+y*365;
	// Get day number of the year by comparing with last day of previous year.
	yearDay=jd-jd1;

	/** @type {number} */
	this.jd=jd;
	/** @type {number} */
	this.year=year;
	/** @type {number} */
	this.month=month;
	/** @type {number} */
	this.day=day;
	/** @type {number} */
	this.weekDay=weekDay;
	/** @type {number} */
	this.yearDay=yearDay;
	/** @type {number} */
	this.isoYear=isoYear;
	/** @type {number} */
	this.isoWeek=isoWeek;
};

/** @param {number} year
  * @param {number} month
  * @param {number} day
  * @return {reach.core.Date} */
reach.core.Date.fromYMD=function(year,month,day) {
	var y,century,leapDays;

	if(isNaN(year) || isNaN(month) || isNaN(day) || month<1 || month>12 || day<1 || day>31) return(null);

	// ((18-month)>>4)==1 if month<=2, else 0.
	// if month<=2 then this year's leap status doesn't affect julian day, so check cumulative leap years only until previous year.
	y=year-((18-month)>>4);
	century=~~(y/100);
	leapDays=(century>>2)-century+(y>>2);

	return(new reach.core.Date(~~(((month+9)%12*153+2)/5)+leapDays+y*365+day-306));
};

/** @return {string} */
reach.core.Date.prototype.toFull=function() {
	/** @type {Array.<string>} */
	var weekDays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	/** @type {Array.<string>} */
	var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

	/** @param {number} n
	  * @param {number} width
	  * @return {string} */
	function pad(n,width) {
		return(new Array(width-(''+n).length+1).join('0')+n);
	}

	return(
		pad(this.year,4)+'-'+pad(this.month,2)+'-'+pad(this.day,2)+
		' '+
		pad(this.isoYear,4)+'-W'+pad(this.isoWeek,2)+'-'+((this.weekDay+6)%7+1)+
		' '+
		this.jd+
		' '+
		weekDays[this.weekDay]+
		' '+
		this.day+' '+months[this.month-1]+' '+this.year
	);
};

/** @return {string} */
reach.core.Date.prototype.format=function() {
	/** @param {number} n
	  * @param {number} width
	  * @return {string} */
	function pad(n,width) {
		return(new Array(width-(''+n).length+1).join('0')+n);
	}

	return(pad(this.year,4)+'-'+pad(this.month,2)+'-'+pad(this.day,2));
};

reach.core.Date.prototype.toString=reach.core.Date.prototype.format;
goog.provide('reach.trans.City');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.LineSet');
goog.require('reach.trans.TripSet');
goog.require('reach.trans.DeltaSet');
goog.require('reach.core.Date');

/** @constructor */
reach.trans.City=function() {
	/** @type {reach.trans.StopSet} */
	this.stopSet=null;
	/** @type {reach.trans.LineSet} */
	this.lineSet=null;
	/** @type {reach.trans.TripSet} */
	this.tripSet=null;
	/** @type {reach.trans.DeltaSet} */
	this.deltaSet=null;
//new reach.trans.DeltaSet(this);
	/** @type {number} */
	this.distDiv=8;
	/** @type {number} */
	this.statMul=60;
	/** @type {number} */
	this.nearStopCount=25;
	/** @type {reach.core.Date} */
	this.firstDate=null;
	/** @type {number} */
	this.dayCount=0;
};

/** @param {string} data */
reach.trans.City.prototype.parseStops=function(data) {
	this.stopSet=new reach.trans.StopSet(this);
	return(this.stopSet.importPack(data));
};

/** @param {string} data */
reach.trans.City.prototype.parseLines=function(data) {
	this.lineSet=new reach.trans.LineSet(this);
	return(this.lineSet.importPack(data,this.stopSet));
};

/** @param {string} data
  * @param {number} dayNum */
reach.trans.City.prototype.parseTrips=function(data,dayNum) {
	var mask;

	this.tripSet=new reach.trans.TripSet(this);
	if(dayNum<0) mask=[60,63,63,63,63,63,63,63,63,63,63];
	else mask=this.makeValidMask([dayNum]);
	return(this.tripSet.importPack(data,this.lineSet,mask));
};

/** @param {string} data
  * @param {number} dayNum */
reach.trans.City.prototype.parseDeltas=function(data) {
	this.deltaSet=new reach.trans.DeltaSet(this);
	return(this.deltaSet.importPack(data,this.lineSet));
};

/** @param {Array.<number>} dayList
  * @return {Array.<number>} */
reach.trans.City.prototype.makeValidMask=function(dayList) {
	var mask;
	var dayNum;
	var i,l;

	mask=[this.dayCount];
	l=~~((this.dayCount+5)/6);

	for(i=1;i<=l;i++) {
		mask[i]=0;
	}

	l=dayList.length;
	for(i=0;i<l;i++) {
		dayNum=dayList[i];
		mask[1+~~(dayNum/6)]|=(1<<(5-dayNum%6));
	}

	return(mask);
};
require('fibers');
var sqlite3=require('sqlite3');

goog.provide('main');
goog.require('reach.util');
goog.require('reach.io.SQL');
goog.require('reach.trans.City');

var city;

function compute() {
	var db=new reach.io.SQL('kalkati/hsl.sqlite');
	var data;
	var advance;
	var base;
	var fd;

	var stopNum,stopCount;
	var lineNum,lineCount;

	var histogram;
	var sum;
	var i;

	base='..';
	city=new reach.trans.City();

	data=fs.readFileSync(base+'/data/stops.txt','utf8');
	advance=city.parseStops(data).advance;
	while(advance()) {}

//	fd=fs.openSync(path,'w');
//	city.stopSet.exportPack(write);
//	fs.closeSync(fd);

//	data=fs.readFileSync(base+'/data/lines.txt','utf8');
//	advance=city.parseLines(data).advance;
//	while(advance()) {}

//	data=fs.readFileSync(base+'/data/trips.txt','utf8');
//	city.tripSet=new reach.trans.TripSet(city);
//	advance=city.tripSet.importPack(data,city.lineSet,true,[60,63,63,63,63,63,63,63,63,63,63]).advance;
//	while(advance()) {}

	city.lineSet=new reach.trans.LineSet(city);
	city.lineSet.importKalkati(db,city.stopSet);

	stopCount=city.stopSet.list.length;
	lineCount=city.lineSet.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) city.stopSet.list[stopNum].calcStats(city.statMul);
	for(lineNum=0;lineNum<lineCount;lineNum++) city.lineSet.list[lineNum].calcStats();

	city.tripSet=new reach.trans.TripSet(city);
	city.tripSet.populate(city.lineSet);

	data=fs.readFileSync(base+'/data/deltas.txt','utf8');
	city.deltaSet=new reach.trans.DeltaSet(city);
	advance=city.deltaSet.importPack(data,city.lineSet,[60,63,63,63,63,63,63,63,63,63,63]).advance;
	while(advance()) {}

	city.deltaSet=new reach.trans.DeltaSet(city);
	histogram=city.deltaSet.importKalkati(db,city.lineSet,city.tripSet);

    sum=0;
    for(i=histogram.length;i--;) {
        if(histogram[i]) {
            sum+=histogram[i];
            console.log(reach.util.toSigned(i)+'\t'+histogram[i]+'\t'+sum);
        }
    }
}

Fiber(compute).run();
