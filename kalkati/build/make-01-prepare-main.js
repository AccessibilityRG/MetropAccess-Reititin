goog.provide('main');
goog.require('reach.util');
goog.require('reach.io.SQL');
goog.require('reach.trans.City');

var city;

function compute() {
	var db=new reach.io.SQL('kalkati/hsl.sqlite');
	var d;
	var data;
	var advance;
	var base;
	var fd;

	var stopNum,stopCount;
	var lineNum,lineCount;

	var histogram;
	var sum;
	var i;

	fd=null;
	base='..';
	city=new reach.trans.City();

	/** @param {string} txt */
	function write(txt) {fs.writeSync(fd,txt,null,'utf8');}

	d=process.argv[3].split('-');
	city.firstDate=reach.core.Date.fromYMD(+d[0],+d[1],+d[2]);
	city.dayCount=+process.argv[4];


	console.log('Stops start.');
	city.stopSet=new reach.trans.StopSet(city);
	city.stopSet.importKalkati(db);

	console.log('Stops write.');
	fd=fs.openSync(base+'/data/stops.txt','w');
	city.stopSet.exportPack(write);
	fs.closeSync(fd);
	console.log('Stops done.');


	console.log('Lines start.');
	city.lineSet=new reach.trans.LineSet(city);
	city.lineSet.importKalkati(db,city.stopSet);

	stopCount=city.stopSet.list.length;
	lineCount=city.lineSet.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) city.stopSet.list[stopNum].calcStats(city.statMul);
	for(lineNum=0;lineNum<lineCount;lineNum++) city.lineSet.list[lineNum].calcStats();

	console.log('Lines write.');
	fd=fs.openSync(base+'/data/lines.txt','w');
	city.lineSet.exportPack(write);
	fs.closeSync(fd);
	console.log('Lines done.');


	console.log('Trips start.');
	city.tripSet=new reach.trans.TripSet(city);
	city.tripSet.populate(city.lineSet);

	console.log('Trips write.');
	fd=fs.openSync(base+'/data/trips.txt','w');
	city.tripSet.exportPack(write,city.lineSet);
	fs.closeSync(fd);
	console.log('Trips done.');


	console.log('Deltas start.');
	city.deltaSet=new reach.trans.DeltaSet(city);
	histogram=city.deltaSet.importKalkati(db,city.lineSet,city.tripSet);

	console.log('Deltas write.');
	fd=fs.openSync(base+'/data/deltas.txt','w');
	city.deltaSet.exportPack(write,city.lineSet);
	fs.closeSync(fd);
	console.log('Deltas done.');

	console.log('Before correction:');
    sum=0;
    for(i=histogram.length;i--;) {
        if(histogram[i]) {
            sum+=histogram[i];
            console.log(reach.util.toSigned(i)+'\t'+histogram[i]+'\t'+sum);
        }
    }



	data=fs.readFileSync(base+'/data/deltas.txt','utf8');
	city.deltaSet=new reach.trans.DeltaSet(city);
	advance=city.deltaSet.importPack(data,city.lineSet,[60,63,63,63,63,63,63,63,63,63,63]).advance;
	while(advance()) {}

	city.deltaSet=new reach.trans.DeltaSet(city);
	histogram=city.deltaSet.importKalkati(db,city.lineSet,city.tripSet);

	console.log('After correction:');
    sum=0;
    for(i=histogram.length;i--;) {
        if(histogram[i]) {
            sum+=histogram[i];
            console.log(reach.util.toSigned(i)+'\t'+histogram[i]+'\t'+sum);
        }
    }

}

Fiber(compute).run();
