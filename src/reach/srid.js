goog.provide('reach.srid');

/** @constructor */
reach.srid=function() {
	// WGS 84
	this['EPSG:4326']='+proj=longlat +datum=WGS84 +no_defs';
	// ETRS89 / TM35FIN(E,N)
	this['EPSG:3067']='+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89
	this['EPSG:4258']='+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs';
	// ETRS89 / ETRS-GK19FIN
	this['EPSG:3126']='+proj=tmerc +lat_0=0 +lon_0=19 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK20FIN
	this['EPSG:3127']='+proj=tmerc +lat_0=0 +lon_0=20 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK21FIN
	this['EPSG:3128']='+proj=tmerc +lat_0=0 +lon_0=21 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK22FIN
	this['EPSG:3129']='+proj=tmerc +lat_0=0 +lon_0=22 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK23FIN
	this['EPSG:3130']='+proj=tmerc +lat_0=0 +lon_0=23 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK24FIN
	this['EPSG:3131']='+proj=tmerc +lat_0=0 +lon_0=24 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK25FIN
	this['EPSG:3132']='+proj=tmerc +lat_0=0 +lon_0=25 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK26FIN
	this['EPSG:3133']='+proj=tmerc +lat_0=0 +lon_0=26 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK27FIN
	this['EPSG:3134']='+proj=tmerc +lat_0=0 +lon_0=27 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK28FIN
	this['EPSG:3135']='+proj=tmerc +lat_0=0 +lon_0=28 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK29FIN
	this['EPSG:3136']='+proj=tmerc +lat_0=0 +lon_0=29 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK30FIN
	this['EPSG:3137']='+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / ETRS-GK31FIN
	this['EPSG:3138']='+proj=tmerc +lat_0=0 +lon_0=31 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / TM34
	this['EPSG:3046']='+proj=utm +zone=34 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / TM35
	this['EPSG:3047']='+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// ETRS89 / TM36
	this['EPSG:3048']='+proj=utm +zone=36 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
	// KKJ / Finland zone 0
	this['EPSG:3386']='+proj=tmerc +lat_0=0 +lon_0=18 +k=1 +x_0=500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland zone 1
	this['EPSG:2391']='+proj=tmerc +lat_0=0 +lon_0=21 +k=1 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland zone 2
	this['EPSG:2392']='+proj=tmerc +lat_0=0 +lon_0=24 +k=1 +x_0=2500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland Uniform Coordinate System
	this['EPSG:2393']='+proj=tmerc +lat_0=0 +lon_0=27 +k=1 +x_0=3500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland zone 4
	this['EPSG:2394']='+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=4500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
	// KKJ / Finland zone 5
	this['EPSG:3387']='+proj=tmerc +lat_0=0 +lon_0=33 +k=1 +x_0=5500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs';
};
