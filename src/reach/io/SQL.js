goog.provide('reach.io.SQL');
goog.require('reach.io.Query');

/** @constructor
  * @param {string} name */
reach.io.SQL=function(name) {
	this.db=new sqlite3.Database(name,sqlite3.OPEN_READONLY);
};

/** @param {string} sql
  * @return {reach.io.Query} */
reach.io.SQL.prototype.query=function(sql) {
	var query;
	var i,l;
	var arg;

	query=new reach.io.Query();

	/** @param {string} err
	  * @param {Object.<string,*>} row */
	function rowHandler(err,row) {
		(/** @type {reach.io.Query} */ query).addRow(row);
	}

	l=arguments.length;
	arg=[];
	for(i=0;i<l;i++) arg.push(arguments[i]);
	arg.push(rowHandler);
	arg.push(function() {(/** @type {reach.io.Query} */ query).finish();});

	this.db.each.apply(this.db,arg);

	return(query);
};
