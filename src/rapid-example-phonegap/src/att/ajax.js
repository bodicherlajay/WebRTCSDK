
/*
 * TODO
 * 1. Make it so that filePath can use the 'file://' protocol in android
 */

/**
 * @description The ajax function is designed to take in the specified ajax parameters and make the
 * 	the HTTP request.  If a platform cannot handle an ajax parameter specified in the ajax API then
 * 	this function will thrown an error.
 * 
 * @method ajax(ajaxParams, success, fail) {Function} - Takes ajaxParams which describe the request
 * @param ajaxParams.url {String} - a string of the URL to send
 * @param ajaxParams.method {String} - the HTTP Method
 * @param [ajaxParams.headers] {Object} - A flat object of header titles to header values
 * @param [ajaxParams.query] {Object/String} - Either a flat object of query string keys to values a query string to append
 * @param [ajaxParams.body] {Object/String} - value to send in the request
 * @param [ajaxParams.filePath] {String} - file to send in the request, can't be used with body
 * @param [ajaxParams.attachments] {Array} - attachments to be sent in a multipart post, if ajaxParams.body is defined then posts multipart/related
 * @param [ajaxParams.options] {Object} - This is an object holding additional config parameters
 * @param [ajaxParams.options.isMultipart] {Boolean} - If attachments are present, this is true, if only body is specified 
 *                                         then the body is POSTed as the main part of multipart/related
 * @param success {Function} - success(response, attXHR) callback function on success
 * @param fail {Function} - fail(response, attXHR) callback function on success
 * @param [ajaxParams.responseFilePath] {String} - path where to save the response data, success response Object describes the filePathResponse
 * 
 * @param [attachmentObject.body] {String} - A string that will printed as multipart content, cannont be specified with filePath
 * @param [attachmentObject.filePath] {String} - File path that will be used as content, cannont be specified with body
 * @param attachmentObject.mimeType {String} - the Content-Type of the content
 * @param [attachmentObject.name] {String} - Name of the file/body.  Required if POSTing multipart/related
 * @param [attachmentObject.encoding="binary"] {String} - String encoding
 * 
 * The following are settings used by the ajax method to set for each platform
 * @attribute ajax.settings.getXHR {Function} - returns either a real or simulated XML HTTP Request object for the given platform
 * @attribute ajax.settings.timeout {Number} - number of milliseconds for the HTTP request to timeout
 * @attribute ajax.settings.isBridgeFunction {Function} - returns boolean of whether to use bridge function if the parameters can't be
 * 				handled in JavaScript by this platform.  Throws an error if there are parameters that can't be handled by bridge either
 * @attribute ajax.settings.bridgeFunction {Function} - makes the HTTP request if there are parameters that can't be handled in JavaScript
 */


define(function(require, exports, module) {
	var util = require('att/util')
	,	QS = util.qs
	,	constants = require('att/constants')
	,	functionsToExpose = ['abort', 'getResponseHeader', 'getAllResponseHeaders']
	,	valuesToExpose = ['readyState', 'responseText', 'responseData', 'responseType']
	,	valuesAfterHeaders = ['status', 'statusText'];
	
	var ajax;
	
	function generateErrorObj(type, message, errorProps) {
		var errorObj = {
			error: {
				type: type,
				message: message
			}
		};
		util.copyObjTo(errorObj.error, errorProps);
		return errorObj;
	}
	
	function formatError(e) {
		return generateErrorObj(e.constructor.name, e.message, { source: e });
	}
	
	function AttXHR(params, successCB, failCB) {
		if(has('DEBUG')) util.log('Request: ' + JSON.stringify(params,null,3));
		
		if(params.isBridgeFunction || ajax.settings.isBridgeFunction(params)) {
			ajax.settings.bridgeFunction.call(this, params, successCB, failCB);
			return;
		}
		
		var attXHR = this
		,	xhr = ajax.settings.getXHR(params);
		
		if(!xhr) return;
		
		this.xhr = xhr;
		
		function exposeValues(name) {
			var val = xhr[name];
			if(typeof val !== undefined) attXHR[name] = val;
		}
		
		//Copy values from xhr to AttXHR
		var onreadystatechange = function() {
			valuesToExpose.forEach(exposeValues);
			
			//Accessing status before HEADERS_RECEIVED throws an error in chrome
			if(xhr.readyState >= xhr.HEADERS_RECEIVED) valuesAfterHeaders.forEach(exposeValues);
		};
		onreadystatechange();
		
		//Set up headers
		var headers = util.copyObjTo({}, params.headers), replied = false, timeoutHandle;
		
		//Set up listeners
		//Common reply pass through
		function onReply(replyFunc, data) {
			if(!replied) {
				onreadystatechange(); //Ensure the attAjax is in the right state
				
				//Note: Titanium on Android throws if timeoutHandle is not defined (and a number)
				if(timeoutHandle) clearTimeout(timeoutHandle);
				replied = true;
				replyFunc.call(attXHR, data, attXHR);
			}
		}
		
		function processResponseData() {
			var contentType = attXHR.getResponseHeader('Content-Type');
			return (contentType && contentType.indexOf(constants.header.contentType.JSON) >= 0) ?
				JSON.parse(xhr.responseText) :
				xhr.responseText;
		}
		
		var successFunc = function(evt) {
			if(has('DEBUG')) util.log('Success: ' + xhr.responseText);
			
			if(xhr.status >= 400) {
				errorFunc.call(this, evt);
				return;
			}
			
			var data;
			try {
				data = processResponseData();
			} catch (e) {
				var errorObj = formatError(e);
				errorObj.error.type = 'AttXHRParseError';
				
				onReply(failCB, errorObj);
				return;
			}
			
			onReply(successCB, { data: data });
		};
		var errorFunc = function(evt) {
			var data;
			
			if(has('DEBUG')) util.log('Error: ' + xhr.responseText);
			
			try { 
				data = processResponseData(); 
			} catch(e){}
			
			if(!data) data = xhr.responseText;
			
			var msg = evt.error || xhr.statusText || 'Connection Error';
			
			var errorObj = generateErrorObj('AttXHRRequestError', msg, {
				status: xhr.status
			});
			if(data) errorObj.data = data;
			
			onReply(failCB, errorObj);
		};
		function abortFunc() {
			if(timeoutHandle) {
				onReply(failCB, generateErrorObj('AttXHRAbortError', 'Request aborted'));
			}
		}
		
		if(has('XMLHttpRequest') && xhr.addEventListener) {
			xhr.addEventListener('load', successFunc, false);
			xhr.addEventListener('error', errorFunc, false);
			xhr.addEventListener('abort', abortFunc, false);
			xhr.addEventListener('readystatechange', onreadystatechange);
		} else {
			xhr.onload = successFunc;
			xhr.onerror = errorFunc;
			xhr.onabort = abortFunc;
			xhr.readystatechange = onreadystatechange;
		}
		
		//Set up query string on the url
		var url = params.url;
		if(params.query) {
			var query = params.query, queryType = typeof query;
			query = (queryType === 'object') ? QS.stringify(query) :
					(queryType === 'string') ? query :
					false;
			
			if(query) url += '?' + query;
		}
		
		xhr.open(params.method, url, true);
		
		if(has('XMLHttpRequest')) {
			headers["X-Requested-With"] = "XMLHttpRequest";
		}
		
		//Add headers
		
		
		//Set up the timeout
		var timeout = xhr.timeout = (params.timeout !== undefined) ? params.timeout : ajax.settings.timeout;
		if(has('XMLHttpRequest') && timeout > 0) {
			//XMLHttpRequest doesn't have timeout built in on all browsers
			timeoutHandle = setTimeout(function() {
				timeoutHandle = null;
				xhr.abort();
				onReply(failCB, generateErrorObj('AttXHRTimeoutError', 'Request timed out after '+timeout+'ms'));
			}, timeout);
		}
		
		var body = params.body;
		if(typeof body === 'object') {
			switch(headers['Content-Type']) {
			case constants.header.contentType.JSON:
				body = JSON.stringify(params.body);
				break;
			case constants.header.contentType.URL_ENCODED:
				body = QS.stringify(params.body);
				break;
			default:
			}
			
			//TODO: Add Content-Length header of the stringified body:
			//headers['Content-Length'] = body.length + '';
		}
		
		util.forEach(headers, function(val, title) {
			if(val) xhr.setRequestHeader(title, val);
		});
		
		
		xhr.send(body);
	}
	
	functionsToExpose.forEach(function(funcName) {
		AttXHR.prototype[funcName] = function() {
			var xhr = this.xhr, method = xhr[funcName];
			return util.apply(xhr, method, arguments); //This is needed for Titanium on iPhone
		};
	});
	
	/*
	AttXHR.prototype.addEventListener = function(key, func) {
		var attXHR = this;
		this.xhr.addEventListener(key, function() {
			func.apply(attXHR, arguments);
		});
	};
	*/
	
	
	ajax = function ajax(params, successCB, failCB) {
		return new AttXHR(params, successCB, failCB);
	};
	
	
	//These are configurable global ajax settings that can be modified for each platform
	ajax.settings = {
		getXHR: (has('XMLHttpRequest')) ? 
			function() {
				try {
					return new XMLHttpRequest();
				} catch(e) {}
			} : 
			function() {
				throw new Error('XMLHttpRequest is not defined. Override ajax.settings.getXHR to use the ajax function for this platform');
			}
		,
		timeout: 90000,
		isBridgeFunction: function(params) {
			return false;
		},
		bridgeFunction: function(){
			throw new Error('This method is not supported in this platform');
		}
	};
	
	module.exports = ajax;
});