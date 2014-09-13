// "Attribute records in the dBASE file must be in the same order as records in the main (.shp) file."
// - Library of Congress, National Digital Information Infrastructure and Preservation Program
// http://www.digitalpreservation.gov/formats/fdd/fdd000326.shtml

goog.provide('gis.format.Shp');
goog.require('gis.Obj');
goog.require('gis.io.OctetStream');
goog.require('gis.format.Dbf');

/** @constructor */
gis.format.Shp=function() {
	/** @type {gis.io.OctetStream} */
	this.buf;
	/** @type {number} */
	this.len;
	this.proj;

	/** @type {number} */
	this.geometryCode;
	/** @type {gis.format.Shp.GeometryType} */
	this.geometryType;

	/** @type {gis.format.Dbf} */
	this.dbf=new gis.format.Dbf();
};

/** @enum {number} */
gis.format.Shp.GeometryType={
	POINT:0,
	POLYLINE:1,
	POLYGON:2
};

/** @type {Object.<number,gis.format.Shp.GeometryType>} */
gis.format.Shp.geometryTypeTbl={
	1:gis.format.Shp.GeometryType.POINT,
	3:gis.format.Shp.GeometryType.POLYLINE,
	5:gis.format.Shp.GeometryType.POLYGON,
	11:gis.format.Shp.GeometryType.POINT,
	13:gis.format.Shp.GeometryType.POLYLINE,
	15:gis.format.Shp.GeometryType.POLYGON,
	21:gis.format.Shp.GeometryType.POINT,
	23:gis.format.Shp.GeometryType.POLYLINE,
	25:gis.format.Shp.GeometryType.POLYGON
};

/** Read Shapefile header.
  * @param {number} len */
gis.format.Shp.prototype.readHeader=function(len) {
	var buf;

	if(len<100) console.log('Incomplete shp file');

	buf=this.buf;
	buf.setEndian(gis.io.Stream.Endian.BIG);

	// Read Shapefile header.
	if(buf.read32()!=9994) console.log('Wrong shp magic header');
	buf.skip(4*5); // Unused
	this.len=buf.read32()*2;
	if(len<this.len) console.log('Incomplete shp file');

	buf.setEndian(gis.io.Stream.Endian.LITTLE);

	if(buf.read32()!=1000) console.log('Incompatible shp version');
	this.geometryCode=buf.read32();
	this.geometryType=gis.format.Shp.geometryTypeTbl[this.geometryCode];
	buf.skip(8*8); // Bounds for X, Y, Z, M.
};

/** @param {gis.io.OctetStream} shpBuf
  * @param {number} shpLen
  * @param {gis.io.OctetStream} dbfBuf
  * @param {number} dbfLen
  * @param {Array.<string>=} fieldNameList */
gis.format.Shp.prototype.importStream=function(shpBuf,shpLen,dbfBuf,dbfLen,srcProj,dstProj,fieldNameList) {
	this.buf=shpBuf;
	this.srcProj=srcProj;
	this.dstProj=dstProj;

	this.readHeader(shpLen);
	if(dbfBuf) this.dbf.importStream(dbfBuf,dbfLen,fieldNameList);
};

gis.format.Shp.prototype.readShape=function() {
	var buf;
	var num;
	var len,last;
	var geometryCode;
	var ringNum,ringCount;
	var ptNumList;
	var ptNum,ptNumPrev,ptCount;
	var lat,lon;
	var srcProj,dstProj;
	var projPt;
	var row;

	buf=this.buf;
	if(buf.pos==this.len) return(null);

	buf.setEndian(gis.io.Stream.Endian.BIG);

	num=buf.read32();
	len=buf.read32()*2;

	buf.setEndian(gis.io.Stream.Endian.LITTLE);

	last=buf.pos+len;
	if(last>this.len) console.log('Record reaches past end of file');

	geometryCode=buf.read32();
	if(geometryCode!=this.geometryCode) console.log('Mixing shape types not allowed');

	srcProj=this.srcProj;
	dstProj=this.dstProj;

	ptList=[];

	switch(this.geometryType) {
		case gis.format.Shp.GeometryType.POLYLINE:
		case gis.format.Shp.GeometryType.POLYGON:
			buf.skip(8*4); // Bounding box.
			ringCount=buf.read32();
			ptCount=buf.read32();
			ptNumList=[];
			ptNumPrev=0;

			for(ringNum=0;ringNum<ringCount;ringNum++) {
				ptNum=buf.read32();
				if(ptNum<ptNumPrev) console.log('Polygon rings are out of order');
				ptNumList[ringNum]=ptNum;
				ptNumPrev=ptNum;
			}

			for(ptNum=0;ptNum<ptCount;ptNum++) {
				lon=buf.readDouble();
				lat=buf.readDouble();

				projPt=Proj4js.transform(srcProj,dstProj,new Proj4js.Point(lon,lat));
				lon=projPt.x;
				lat=projPt.y;
				ptList.push(new reach.Deg(lat,lon).toMU());
			}

			break;
	}

	buf.skip(last-buf.pos);

	row=this.dbf.readRow();

//	return(this.len-buf.pos);
	return([ptList,row]);
};
