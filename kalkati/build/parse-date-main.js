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
