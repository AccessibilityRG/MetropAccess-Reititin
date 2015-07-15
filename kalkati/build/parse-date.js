'use strict';

//require('fibers');
//var sqlite3=require('sqlite3');
//var repl=require('repl');
var path=require('path');
var fs=require('fs');
var proc=require('child_process');
//var Buffer=require('buffer').Buffer;
var Iconv=require('iconv').Iconv;

var searchConf;
var extra;
var Proj4js;
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
goog.provide('main');
goog.require('reach.core.Date');

var flag,i,d;
var y1,y2,m1,m2,d1,d2;
var date1,date2;

flag=fs.readFileSync(process.argv[2],'ascii').split('\n');

for(i=0;i<flag.length;i++) {
	if(flag[i].match(/^[0-9]{8}-[0-9]{8},[0-9]+$/)) {
		d=flag[i].split(/[-,]/);
		y1=d[0].substr(0,4);m1=d[0].substr(4,2);d1=d[0].substr(6,2);
		y2=d[1].substr(0,4);m2=d[1].substr(4,2);d2=d[1].substr(6,2);
		date1=reach.core.Date.fromYMD(+d[0].substr(0,4),+d[0].substr(4,2),+d[0].substr(6,2));
		date2=reach.core.Date.fromYMD(+d[1].substr(0,4),+d[1].substr(4,2),+d[1].substr(6,2));

		console.log(date1.year+'-'+date1.month+'-'+date1.day);
		console.log(date2.jd-date1.jd);
		break;
	}
}
