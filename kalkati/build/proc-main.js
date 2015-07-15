goog.provide('main');

function init() {
	proc.exec('ogr2ogr -f "GeoJSON" -t_srs EPSG:4326 /dev/stdout extra.shp',function(err,stdout,stderr) {
console.log(err);
		console.log('out: '+stdout);
	});
}

init();
