CREATE TABLE company (
	compid	INTEGER PRIMARY KEY,
	name	TEXT
);

CREATE TABLE station (
	statid	INTEGER PRIMARY KEY,
	name	TEXT,
	lat		INTEGER,
	lon		INTEGER,
	virt	BOOL,
	type	INTEGER,
	cityid	INTEGER,
	x		INTEGER,
	y		INTEGER
);

CREATE INDEX station_city ON station (cityid);
CREATE INDEX station_type ON station (type);

CREATE TABLE servicedata (
	servid	INTEGER PRIMARY KEY,
	mode	INTEGER,
	first	INTEGER,
	compid	INTEGER,
	long	TEXT,
	short	TEXT,
	name	TEXT,
	valid	TEXT,
	data	TEXT
);

CREATE INDEX servdata_first ON servicedata (first);
CREATE INDEX servdata_long_first ON servicedata (long,valid DESC,first);
