goog.provide('reach.task.Fetch');
goog.require('reach.task.FetchResult');
goog.require('reach.task.Task');

/** @constructor
  * @extends {reach.task.Task}
  * @param {string} name
  * @param {string} url
  * @param {string?} encoding */
reach.task.Fetch=function(name,url,encoding) {
	reach.task.Task.call(this,name);

	/** @type {string} */
	this.url=url;

	if(!encoding) encoding='utf8';
	/** @type {string} */
	this.encoding=encoding;

	/** @type {reach.task.FetchResult} */
	this.result=new reach.task.FetchResult();
};

reach.inherit(reach.task.Fetch,reach.task.Task);

reach.task.Fetch.prototype.init=function() {
	/** @type {reach.task.Fetch} */
	var self=this;

	this.advance=function() {
		/** @type {XMLHttpRequest} */
		var http;

		if(typeof(XMLHttpRequest)!='undefined') {
			http=new XMLHttpRequest();
			http.onreadystatechange=function() {
				if(http.readyState==4) {
					if(http.status==200) {
						self.result.data=http.responseText;
						self.success();
					} else {
						// TODO: add more error handling.
						self.result.data=null;
						self.success();
					}
				}
			};

			http.open('GET',self.url,true);
			http.send(null);
		} else if(typeof(fs)!='undefined') {
			/** It's important not to pass encoding to readFile, so it'll return raw bytes for proper charset conversion.
			  * @param {{errno:number,code:string,path:string}} err
			  * @param {string} data */
			fs.readFile(self.url,function(err,data) {
				if(!err) {
					self.state.stepCount=data.length;
					if(typeof(iconv)!='undefined') {
//						self.result.data=new Iconv(self.encoding,'UTF-8//IGNORE').convert(data).toString();
						self.result.data=iconv.decode(data,self.encoding);
					} else {
						self.result.data=data.toString();
					}
					self.success();
				} else if(err.code=='EMFILE') {
					// Out of file handles, should retry on next tick.
					self.unblock();
				}
			});
		}

		return(self.block());
	}
};
