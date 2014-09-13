goog.provide('reach.data.Checksum');

/** @constructor */
reach.data.Checksum=function() {
//	var poly=0x82f63b78; (Castagnoli) Btrfs
//	var poly=0xeb31d82e; (Koopman)
//	var poly=0xedb88320; Ethernet, Gzip, PNG
	var poly=0xedb88320;
	var i,j,crc;
	var tbl;

	tbl=/** @type {Array.<number>} */ [];

	for(i=0;i<256;i++) {
		crc=i;
		for(j=8;j--;) {
			crc=((crc>>>1)^(-(crc&1)&poly))>>>0;
		}
		tbl[i]=crc;
	}

	this.tbl=tbl;
	this.crc=0xffffffff;
};

/** @param {string} data
  * @param {number} pos
  * @param {number} len
  * @return {number} */
reach.data.Checksum.prototype.append=function(data,pos,len) {
	var tbl;
	var crc;

	tbl=this.tbl;
	crc=this.crc;
	while(len--) crc=(crc>>>8)^tbl[(crc&255)^data.charCodeAt(pos++)];
	this.crc=crc;

	return((crc^0xffffffff)>>>0);
};
