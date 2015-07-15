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
