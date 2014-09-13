goog.provide('reach.color.ColorSet');

/** @constructor */
reach.color.ColorSet=function() {
	var cssList;
	var angleList;
	var colorNum,colorCount;
	var chroma,luma,angle;
	var aa,bb;
	var rgb;
	var r,g,b;
	var mode=2;

	// SRLAB2 hue angles for isochrone curve colors.
	angleList=[15,55,85,110,135,255,315];
	chromaList=[60,60,60,60,60,40,40];
//	chromaList=[60,60,60,40,40,60,60];
//	angleList=[90,95,100,105,110,115,120];
//	angleList=[15,55,95,135,255,280,315];
//	chroma=60;

	if(mode==1) {
	cssList=[];
	colorCount=angleList.length*3;
	for(colorNum=0;colorNum<colorCount;colorNum++) {
		luma=70-(colorNum%3)*12;
		chroma=chromaList[~~(colorNum/3)];
		angle=angleList[~~(colorNum/3)]*Math.PI/180;

		aa=Math.cos(angle)*chroma;
		bb=Math.sin(angle)*chroma;
		rgb=this.srlab2rgb(luma,aa,bb);
		r=~~(rgb[0]*255);
		g=~~(rgb[1]*255);
		b=~~(rgb[2]*255);
		cssList[colorNum]='rgb('+r+','+g+','+b+')';
	}
	} else if(mode==2) {
	cssList=[];
	colorCount=angleList.length*3;
	for(colorNum=0;colorNum<colorCount;colorNum++) {
		if(colorNum<6) {
			luma=60+Math.cos((7-colorNum)*Math.PI/7*0.75)*40;
			chroma=40-Math.cos((7-colorNum)*Math.PI/7*1.25)*40;
			angle=(132-colorNum*2)*Math.PI/180;
		} else if(colorNum==6) {
			luma=100;
			chroma=0;
			angle=0;
		} else {
//			luma=60+Math.cos((colorNum-5)*Math.PI/15*1)*40;
//			chroma=40-Math.cos((colorNum-5)*Math.PI/15*1.5)*40;
//			angle=(-20-(1-Math.cos((colorNum-5)*Math.PI/15*0.50))*100)*Math.PI/180;
			luma=60+Math.cos((colorNum-4)*Math.PI/16*1)*40;
			chroma=40-Math.cos((colorNum-4)*Math.PI/16*1.5)*40;
			angle=(-20-(1-Math.cos((colorNum-4)*Math.PI/16*0.50))*80)*Math.PI/180;
		}

		aa=Math.cos(angle)*chroma;
		bb=Math.sin(angle)*chroma;
		rgb=this.srlab2rgb(luma,aa,bb);
		r=~~(rgb[0]*255);
		g=~~(rgb[1]*255);
		b=~~(rgb[2]*255);
		cssList[colorNum]='rgb('+r+','+g+','+b+')';
	}
	}

	/** @type {Array.<string>} */
	this.cssList=cssList;
};

/** @param {number} n Sextant number
  * @param {number} v "Brightness" 0-255
  * @param {number} p 0-255
  * @param {number} q 0-255
  * @return {Array.<number>} */
reach.color.ColorSet.prototype.sextant=function(n,v,p,q) {
	switch(n) {
		case 0:	return([v,p,q]);
		case 1:	return([p,v,q]);
		case 2:	return([q,v,p]);
		case 3:	return([q,p,v]);
		case 4:	return([p,q,v]);
		case 5:	return([v,q,p]);
	}
}

/** @param {number} h Hue 0-360
  * @param {number} s Saturation 0-100
  * @param {number} l Lightness 0-255
  * @return {Array.<number>} */
reach.color.ColorSet.prototype.hsl2rgb=function(h,s,l) {
	var p,q,v;

	v=(128-Math.abs(l-128))*s;
	p=l+~~(v*(30-Math.abs(h%120-60))/3000);
	v=l+~~(v/100);
	q=l*2-v;
	return(sextant(~~(h/60),v,p,q));
}

/** @param {number} h Hue 0-360
  * @param {number} s Saturation 0-100
  * @param {number} v Value 0-255
  * @return {Array.<number>} */
reach.color.ColorSet.prototype.hsv2rgb=function(h,s,v) {
	var p,q;

	p=~~(v*(6000-s*Math.abs(h%120-60))/6000);
	q=~~(v*(100-s)/100);
	return(sextant(~~(h/60),v,p,q));
}

/** SRLAB2 to sRGB, adapted from code snippet by Jan Behrens. Original license:
  * "You can freely use, copy, modify, merge, publish, distribute, etc. these code snippets.
  *  There is no warranty of any kind: Use at your own risk."
  * SRLAB2 is a color space designed by Jan Behrens to be as simple as CIELAB but include some corrections introduced in CIECAM02. 
  * @param {number} l 0-100
  * @param {number} a
  * @param {number} b
  * @return {Array.<number>} Red 0-1, green 0-1, blue 0-1 */
reach.color.ColorSet.prototype.srlab2rgb=function(l,a,b) {
	var x,y,z;
	var r,g;

	x=0.01*l + 0.000904127*a + 0.000456344*b;
	y=0.01*l - 0.000533159*a - 0.000269178*b;
	z=0.01*l                 - 0.005800000*b;

	x=(x>0.08)?Math.pow((x+0.16)/1.16,3):x*2700/24389;
	y=(y>0.08)?Math.pow((y+0.16)/1.16,3):y*2700/24389;
	z=(z>0.08)?Math.pow((z+0.16)/1.16,3):z*2700/24389;

	r= 5.435679*x - 4.599131*y + 0.163593*z;
	g=-1.168090*x + 2.327977*y - 0.159798*z;
	b= 0.037840*x - 0.198564*y + 1.160644*z;

	r=(r>0.00304)?1.055*Math.pow(r,1/2.4)-0.055:r*12.92;
	g=(g>0.00304)?1.055*Math.pow(g,1/2.4)-0.055:g*12.92;
	b=(b>0.00304)?1.055*Math.pow(b,1/2.4)-0.055:b*12.92;

	if(r<0) r=0;
	if(g<0) g=0;
	if(b<0) b=0;
	if(r>1) r=1;
	if(g>1) g=1;
	if(b>1) b=1;

	return([r,g,b]);
}

/** sRGB to SRLAB2, adapted from code snippet by Jan Behrens. Original license:
  * "You can freely use, copy, modify, merge, publish, distribute, etc. these code snippets.
  *  There is no warranty of any kind: Use at your own risk."
  * @param {number} r Red 0-1
  * @param {number} g Green 0-1
  * @param {number} b Blue 0-1
  * @return {Array.<number>} Lightness, A, B */
reach.color.ColorSet.prototype.rgb2srlab=function(r,g,b) {
	var x,y,z;
	var l,a;

	r=(r>0.03928)?Math.pow((r+0.055)/1.055,2.4):r/12.92;
	g=(g>0.03928)?Math.pow((g+0.055)/1.055,2.4):g/12.92;
	b=(b>0.03928)?Math.pow((b+0.055)/1.055,2.4):b/12.92;

	x= 0.320530*r + 0.636920*g + 0.042560*b;
	y= 0.161987*r + 0.756636*g + 0.081376*b;
	z= 0.017228*r + 0.108660*g + 0.874112*b;

	x=(x>216/24389)?1.16*Math.pow(x,1/3)-0.16:x*24389/2700;
	y=(y>216/24389)?1.16*Math.pow(y,1/3)-0.16:y*24389/2700;
	z=(z>216/24389)?1.16*Math.pow(z,1/3)-0.16:z*24389/2700;

	l= 37.0950*x +  62.9054*y -   0.0008*z;
	a=663.4684*x - 750.5078*y +  87.0328*z;
	b= 63.9569*x + 108.4576*y - 172.4152*z;

	return([l,a,b]);
}
