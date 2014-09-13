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

/** @return {string} */
reach.Deg.prototype.format=function() {
	return(reach.util.round(this.llat,100000)+(this.llat<0?'S':'N')+', '+reach.util.round(this.llon,100000)+(this.llon<0?'W':'E'));
};

reach.Deg.prototype.toString=reach.Deg.prototype.format;

/** @return {reach.MU} */
reach.Deg.prototype.toMU=function() {
	var r=reach.MU.range/2;

	return(new reach.MU(
		~~((Math.log(Math.tan((this.llat+90)*Math.PI/360))/Math.PI+1)*r),
		~~((this.llon/180+1)*r)
	));
};

/** @return {{llat:number,llon:number}} */
reach.Deg.prototype.toGoog=function() {
	var r=reach.MU.major;

	return(/** @lends {reach.Deg.prototype} */ {
		llat:Math.log(Math.tan((this.llat+90)*Math.PI/360))*r,
		llon:this.llon/180*Math.PI*r
	});
};

/** @param {number} lat
  * @param {number} lon
  * @return {reach.Deg} */
reach.Deg.fromGoog=function(lat,lon) {
	var r=reach.MU.major;

	return(new reach.Deg(Math.atan(Math.exp(lat/r))*360/Math.PI-90,lon*180/r/Math.PI));
};
