CREATE TABLE tile (
	tileid	INTEGER PRIMARY KEY,
	path	TEXT,
	sedge	INTEGER,
	wedge	INTEGER,
	nedge	INTEGER,
	eedge	INTEGER
);

CREATE TABLE tileway (
	tileid	INTEGER,
	num		INTEGER,
	wayid	INTEGER,
	start	INTEGER,
	len		INTEGER,
	flags	INTEGER,
	data	TEXT
);

CREATE TABLE waytag (
	wayid	INTEGER,
	num		INTEGER,
	keyid	INTEGER,
	valid	INTEGER
);

CREATE TABLE tagdata (
	tagid	INTEGER PRIMARY KEY,
	data	TEXT
);

CREATE UNIQUE INDEX tile_path ON tile (path);
CREATE UNIQUE INDEX tileway_id ON tileway (tileid,num);
CREATE INDEX waytag_id ON waytag (wayid,num);
CREATE INDEX waytag_key ON waytag (keyid,valid);
CREATE INDEX tagdata_data ON tagdata (data);
