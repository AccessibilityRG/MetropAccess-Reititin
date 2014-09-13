goog.provide('gis.format.Dbf');
goog.require('gis.Obj');
goog.require('gis.format.DbfField');
goog.require('gis.io.OctetStream');
goog.require('gis.util.Date');

/** @constructor */
gis.format.Dbf=function() {
	/** @type {gis.io.OctetStream} */
	this.buf;
	/** @type {number} */
	this.len;

	/** @type {gis.util.Date} */
	this.date;
	/** @type {number} */
	this.rowCount;
	/** @type {number} */
	this.rowLen;

	/** @type {Array.<gis.format.DbfField>} */
	this.fieldList;
	/** @type {number} */
	this.fieldCount;
};

/** @enum {number} */
gis.format.Dbf.FieldTypeTbl={
	67:gis.format.DbfField.Type.STRING,
	78:gis.format.DbfField.Type.NUMBER
};

/** Read dBASE header.
  * @param {number} len */
gis.format.Dbf.prototype.readHeader=function(len) {
	var buf;
	var ver,year,month,day;
	var last;
	var field;

	if(len<68) console.log('Incomplete dbf file');

	buf=this.buf;
	buf.setEndian(gis.io.Stream.Endian.LITTLE);
	// A .cpg/.cst file can define the character set for content, headers should always be ASCII.
	buf.setEncoding('ISO-8859-1');

	ver=buf.read8()&7;
	if(ver!=3 && ver!=4) console.log('Incompatible dbf version');

	year=buf.read8()+1900;
	month=buf.read8();
	day=buf.read8();
	this.date=gis.util.Date.fromYMD(year,month,day);

	this.rowCount=buf.read32();
	last=buf.read16();
	this.rowLen=buf.read16();

	if(ver==3) {
		buf.skip(2+1+1+12+1);	// Reserved, dirty, encrypted, reserved, MDX.
		buf.read8();
		buf.skip(2);	// Reserved.
	} else {
		buf.skip(2+1+1+12+1);	// Reserved, dirty, encrypted, reserved, MDX.
		console.log(buf.readChars(32));
		buf.read8();
		buf.skip(2);	// Reserved.
		buf.skip(32);
		buf.skip(4);
	}

	this.fieldList=[];
	this.fieldCount=0;

	while(buf.peek8()!=13) {	// Character 0x13 (CR) terminates list of table columns.
		field=new gis.format.DbfField();

		if(ver==3) {
			field.name=buf.readChars(11).toLowerCase();
			field.type=gis.format.Dbf.FieldTypeTbl[buf.read8()];
			buf.skip(4);	// Reserved.
			field.len=buf.read8();
			field.digitCount=buf.read8();
			buf.skip(2+1+10+1);	// Reserved, area, reserved, MDX.
//			console.log(field);
		} else {
			console.log(buf.readChars(32));
//			buf.skip(2+1+2+4+4);	// Reserved, MDX, reserved, next autoincrement, reserved.
		}

		this.fieldList[this.fieldCount++]=field;
	}

	buf.read8();
};

gis.format.Dbf.prototype.readRow=function() {
	var buf;
	var pos,last;
	var fieldList;
	var fieldNum,fieldCount;
	var field;
	var mark;
	var txt;
	var row;

	row=null;
	buf=this.buf;
	pos=buf.pos;
	do {
		last=pos+this.rowLen;
		mark=buf.read8();
		if(mark==32) {
			row={};
			fieldList=this.fieldList;
			fieldCount=fieldList.length;
			for(fieldNum=0;fieldNum<fieldCount;fieldNum++) {
				field=fieldList[fieldNum];
				txt=buf.readChars(field.len);
				row[field.name.toLowerCase()]=(field.type==gis.format.DbfField.Type.NUMBER?+txt:txt.replace(/ +$/,''));
			}
		} else if(mark==26) break;

		buf.skip(last-buf.pos);
	} while(!row);

	return(row);
};

/** @param {gis.io.OctetStream} buf
  * @param {number} len
  * @param {Array.<string>=} fieldNameList */
gis.format.Dbf.prototype.importStream=function(buf,len,fieldNameList) {
	this.buf=buf;
	this.readHeader(len);
};
