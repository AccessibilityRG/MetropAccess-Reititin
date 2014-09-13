goog.provide('gis.osm.WayProfile');
goog.require('gis.Obj');

/** @constructor */
gis.osm.WayProfile=function() {
	/** @type {gis.osm.WayProfile.Type} */
	this.type;

	/** @type {number} */
	this.lanes;
	/** @type {number} */
	this.layer;
	/** @type {boolean} */
	this.tunnel;
	/** @type {boolean} */
	this.bridge;

	/** @type {boolean} */
	this.access;
	/** @type {boolean} */
	this.car;
	/** @type {boolean} */
	this.bike;
	/** @type {boolean} */
	this.foot;
	/** @type {boolean} */
	this.oneway;

	/** @type {boolean} */
	this.lit;
};

gis.osm.WayProfile.Type={
	NONE:0,
	HIGHWAY:1,
	FASTCARS:2,
	SLOWCARS:3,
	PARKING:4,
	HOMEZONE:5,
	CARPATH:6,
	CYCLEWAY:7,
	FOOTWAY:8,
	PATH:9,
	STAIRS:10,
	TRANSIT:11,
	AIR:12
};

/** @return {string} */
gis.osm.WayProfile.prototype.getKey=function() {
	return([
		this.type,

		this.lanes,
		this.layer,
		(this.tunnel===null)?'':this.tunnel,
		(this.bridge===null)?'':this.bridge,

		(this.access===null)?'':this.access,
		(this.car===null)?'':this.car,
		(this.bike===null)?'':this.bike,
		(this.foot===null)?'':this.foot,
		(this.oneway===null)?'':this.oneway,

		(this.lit===null)?'':this.lit
	].join('\t'));
};

/** @return {string} */
gis.osm.WayProfile.prototype.export=function() {
	return(this.getKey());
};

/** @param {string} txt */
gis.osm.WayProfile.prototype.import=function(txt) {
	var fieldList;

	fieldList=txt.split('\t');
	this.type=+fieldList[0];

	if(fieldList[1]!='') this.lanes=+fieldList[1];
	if(fieldList[2]!='') this.layer=+fieldList[2];
	if(fieldList[3]!='') this.tunnel=fieldList[3];
	if(fieldList[4]!='') this.bridge=fieldList[4];

	if(fieldList[5]!='') this.access=fieldList[5];
	if(fieldList[6]!='') this.car=fieldList[6];
	if(fieldList[7]!='') this.bike=fieldList[7];
	if(fieldList[8]!='') this.foot=fieldList[8];
	if(fieldList[9]!='') this.oneway=fieldList[9];

	if(fieldList[10]!='') this.lit=fieldList[10];
};
