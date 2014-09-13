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

/** @param {number|string} n
  * @param {number} width
  * @return {string} */
reach.util.pad=function(n,width) {
	var len;

	n=''+n;
	len=n.length;
	if(len>=width) return(n);

	return(new Array(width-n.length+1).join('0')+n);
};

/** @param {number|string} txt
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
  * @param {function(Event,Element|Document,string)} handler
  * @return {function(Event)} */
reach.util.bindEvent=function(elem,name,type,handler) {
	/** @param {Event} evt */
	function wrapper(evt) {
		if(!evt) evt=/** @type {Event} */window.event;
		handler(evt,elem,name);
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
