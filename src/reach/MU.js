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

/** @type {number} */
reach.MU.range=1<<30;
/** @type {number} */
reach.MU.flatten=1/298.257223563;
/** @type {number} */
reach.MU.major=6378137;
/** @type {number} */
reach.MU.minor=reach.MU.major*(1-reach.MU.flatten);

/** @return {string} */
reach.MU.prototype.toString=function() {
	return(this.llat+','+this.llon);
};

/** @return {string} */
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
	return(new reach.Deg(
		Math.atan(Math.exp((this.llat/reach.MU.range*2-1)*Math.PI))*360/Math.PI-90,
		(this.llon/reach.MU.range*2-1)*180
	));
};

/** @param {number} north Movement northward in meters.
  * @param {number} east Movement eastward in meters.
  * @return {reach.MU} */
reach.MU.prototype.offset=function(north,east) {
	var scale;
	var f,t;

	// Tangent of latitude.
	t=Math.exp((this.llat/reach.MU.range*2-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=reach.MU.range/(reach.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=reach.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	return(new reach.MU(
		this.llat+scale/(1+( t*3-f )/2)*north,
		this.llon+scale/(1+( t+f )/2)*east
	));
};

/** Fast approximate distance calculation on ellipsoidal surfaces, intended for points <1km apart and not right on the polar ice caps.
  * @param {reach.MU} ll
  * @return {number} Distance in meters. */
reach.MU.prototype.distTo=function(ll) {
	var scale;
	var f,t;
	var north,east;

	// Tangent of average latitude.
	t=Math.exp(((this.llat+ll.llat)/reach.MU.range-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=reach.MU.range/(reach.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=reach.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	// Calculate displacement in rectangular coordinates in meters.
	north=(ll.llat-this.llat)*(1+( t*3-f )/2)/scale;
	east=(ll.llon-this.llon)*(1+( t+f )/2)/scale;

	return(Math.sqrt(north*north+east*east));
};

/*
function getMetersPerOsmUnit(lat) {
    var r=536870912;
    var x=Math.exp((lat-r)*2*Math.PI/r);
    var scale=2/Math.sqrt(2+1/x+x); // Note: cosh(lat)=(1/x+x)/2

    return(reach.conf.earthRadiusMeters*Math.PI/r*scale);
}
*/
