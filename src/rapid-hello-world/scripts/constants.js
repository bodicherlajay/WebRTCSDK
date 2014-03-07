
define(function(require, exports, module) {
	var copyObjTo = require('util').copyObjTo;
	
	exports.header = {
		'accept': {
			JSON: 'application/json',
			XML: 'application/xml',
			URL_ENCODED: 'application/x-www-form-urlencoded'
		}
	};
	
	exports.paramKey = {
		HEADERS: 'headers',
		QUERY: 'query',
		URL_PARAMS: 'urlParams',
		FILE_PATH: 'filePath',
		BODY: 'body',
		ATTACHMENTS: 'attachments',
		OPTIONS: 'options'
	};
	
	exports.attachmentKeys = {
		BODY      : "body",
		FILE_PATH : "filePath",
		MIME_TYPE : "mimeType",
		NAME      : "name",
		ENCODING  : "fileEncoding"
	};
	
	exports.header.contentType = copyObjTo({}, exports.header.accept);
});