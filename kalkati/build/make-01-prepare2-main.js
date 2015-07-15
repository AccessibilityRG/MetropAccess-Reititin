goog.provide('main');
goog.require('reach.util');
goog.require('reach.io.SQL');
goog.require('reach.core.Date');
goog.require('reach.trans.City');
//goog.require('reach.Debugger');

var city;

/** @param {reach.trans.City} city
  * @param {reach.io.SQL} db
  * @param {string} path */
function convertStops(city,db,path) {
	var fd;

	/** @param {string} txt */
	function write(txt) {
		fs.writeSync(fd,txt,null,'utf8');
	}

	city.stopSet=new reach.trans.StopSet(city);
	city.stopSet.importKalkati(db);

	fd=fs.openSync(path,'w');
	city.stopSet.exportPack(write);
	fs.closeSync(fd);
}

/** @param {reach.trans.City} city
  * @param {reach.io.SQL} db
  * @param {string} path */
function convertLines(city,db,path) {
	var stopNum,stopCount;
	var lineNum,lineCount;
	var fd;

	/** @param {string} txt */
	function write(txt) {
		fs.writeSync(fd,txt,null,'ascii');
//		fs.writeSync(fd,txt,null,'utf8');
	}

	city.lineSet=new reach.trans.LineSet(city);
	city.lineSet.importKalkati(db,city.stopSet);

	stopCount=city.stopSet.list.length;
	lineCount=city.lineSet.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) city.stopSet.list[stopNum].calcStats(city.statMul);
	for(lineNum=0;lineNum<lineCount;lineNum++) city.lineSet.list[lineNum].calcStats();

	fd=fs.openSync(path,'w');
	city.lineSet.exportPack(write);
	fs.closeSync(fd);
}

/** @param {reach.trans.City} city
  * @param {reach.io.SQL} db
  * @param {string} path */
function convertTrips(city,db,path) {
	var fd;

	/** @param {string} txt */
	function write(txt) {
		fs.writeSync(fd,txt,null,'utf8');
	}

	city.tripSet=new reach.trans.TripSet(city);
	city.tripSet.populate(city.lineSet);

	fd=fs.openSync(path,'w');
	city.tripSet.exportPack(write,city.lineSet);
	fs.closeSync(fd);
}

/** @param {reach.trans.City} city
  * @param {reach.io.SQL} db
  * @param {string} path */
function convertDeltas(city,db,path) {
	var fd;

	/** @param {string} txt */
	function write(txt) {
		fs.writeSync(fd,txt,null,'ascii');
//		fs.writeSync(fd,txt,null,'utf8');
	}

	city.deltaSet=new reach.trans.DeltaSet(city);
	city.deltaSet.importKalkati(db,city.lineSet,city.tripSet);

	fd=fs.openSync(path,'w');
	city.deltaSet.exportPack(write);
	fs.closeSync(fd);
}

function compute() {
	var dbg,ctx;
	var db=new reach.io.SQL('kalkati/hsl.sqlite');
	var data;
	var advance;
	var d;

	city=new reach.trans.City();

	d=process.argv[3].split('-');
	city.firstDate=reach.core.Date.fromYMD(+d[0],+d[1],+d[2]);
	city.dayCount=+process.argv[4];

//	dbg=new reach.Debugger();
//	ctx=repl.start().context;
//	ctx.reach=reach;
//	ctx.city=city;
//	ctx.dbg=dbg;

	if(process.argv[2]>2) {
		console.log('Converting stops...');
		convertStops(city,db,'data/stops.txt');
		console.log('OK');
	} else {
		console.log('Reading stops...');
		data=fs.readFileSync('data/stops.txt','utf8');
		advance=city.stopSet.importPack(data);
		while(advance()) {}
		console.log('OK');
	}

	if(process.argv[2]>1) {
		console.log('Converting lines...');
		convertLines(city,db,'data/lines.txt');
		convertTrips(city,db,'data/trips.txt');
		console.log('OK');
	} else {
		console.log('Reading lines...');
		data=fs.readFileSync('data/lines.txt','ascii');
		advance=city.lineSet.importPack(data,city.stopSet);
		while(advance()) {}
		console.log('OK');

		console.log('Reading trips...');
		data=fs.readFileSync('data/trips.txt','utf8');
		advance=city.tripSet.importPack(data,city.lineSet,true,[60,63,63,63,63,63,63,63,63,63,63]);
		while(advance()) {}
		console.log('OK');
	}

	if(process.argv[2]>0) {
/*
		console.log('Reading deltas...');
		data=fs.readFileSync('data/deltas.txt','utf8');
		advance=city.deltaSet.importPack(data,city.lineSet,[60,63,63,63,63,63,63,63,63,63,63]);
		while(advance()) {}
		console.log('OK');
*/
		console.log('Converting deltas...');
		convertDeltas(city,db,'data/deltas.txt');
		console.log('OK');
	} else {
		data=fs.readFileSync('data/deltas.txt','utf8');
		city.deltaSet.importPack(data,city.lineSet);
	}

	console.log('Ready.');
}

Fiber(compute).run();
