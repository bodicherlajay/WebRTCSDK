
/* Changes still needed TODO
1. Create methods that aren't hard coded to Titanium
	a. Create a way to easily plugin to any platform
2. Implement adding the main part for multipart related methods
3. Add this as part of the ajax.js method
*/

define(['att/util'], function(util) {
	
	
	var forEach = util.forEach
	,	copyObjTo = util.copyObjTo
	,	capitalize = util.capitalize
	,	HeaderTitles = {
	    CONTENT_TYPE: 'Content-Type',
	    CONTENT_DISPOSITION: 'Content-Disposition',
	    CONTENT_ID: 'Content-ID',
	    CONTENT_TRANSFER_ENCODING: 'Content-Transfer-Encoding'
	};
	
	var commonFunctions = {
	    setHeader: function(title, val) {
	        this.headers[title] = val;
	    },
	    getHeaderString: function() {
	        var headerStr = '';
	        forEach(this.headers, function(val, title) {
	            headerStr += title + ': ' + val + AttBodyPart.CRLF;
	        });
	        return headerStr + AttBodyPart.CRLF;
	    },
	    getHeaderBuffer: function() {
	        return Ti.createBuffer({ value: this.getHeaderString() });
	    },
	    toString: function() {
	        return this.getHeaderString() + this.getContentString() + AttBodyPart.CRLF;
	    },
	    toBuffer: function() {
	    	var buf = this.getHeaderBuffer();
	    	buf.append(this.getContentBuffer());
	    	return buf;
	    }
	};

	
	/**
	 * @class AttBodyPart Used to create the contents of a MIME message
	 */
	
	//AttBodyPart Constructor
	function AttBodyPart(name, content, headers) {
	    this.content = content;
	    this.headers = copyObjTo({}, headers);
	    
	    if(!this.headers[HeaderTitles.CONTENT_DISPOSITION]) {
	        this.headers[HeaderTitles.CONTENT_DISPOSITION] = 'form-data';
	    }
	    
	    this.setName(name);
	}
	
	//Static AttBodyPart Properties
	AttBodyPart.CRLF = '\r\n';
	
	/**
	 * @method AttBodyPart.buildFromJSON Creates an AttBodyPart object from a generic JavaScript Object
	 * 
	 * @param attachment JSONable object with the following properties:
	 * @param [attachment.body] {String} Content to be included as the body of this body part
	 * @param [attachment.filePath] {String} File to be loaded as the body of this body part
	 * @param [attachment.fileName] {String} File name to be used for this body part. This will override the file name in filePath
	 * @param [attachment.mimeType] {String} Set as the Content-Type header for the body of this mime body part
	 * @param [attachment.name] {String} Name used to for this body part
	 * @param [attachment.encoding] {String} Set as the Content-Transfer-Encoding of this body part, used if the body parameter is defined
	 */
	AttBodyPart.buildFromJSON = function(attachment) {
		var fileName = attachment.fileName || (attachment.filePath && attachment.filePath.replace(/.*\/(.*)/, function(fullPath, fileName) { return fileName; }));
		var name = attachment.name || fileName;
		
		var content;
		if(attachment.body) {
			content = Ti.createBuffer({ value: attachment.body });
		} else if(attachment.filePath) {
			var file = Titanium.Filesystem.getFile(attachment.filePath);
			content = Ti.Stream.readAll(Ti.Stream.createStream({ source: file.read(), mode: Titanium.Stream.MODE_READ}));
		}
		
		var headers = {};
		headers[HeaderTitles.CONTENT_TYPE] = attachment.mimeType;
		if(attachment.encoding) headers[HeaderTitles.CONTENT_TRANSFER_ENCODING] = attachment.encoding;
		
		var bp = new AttBodyPart(name, content, headers);
		bp.fileName = fileName;
		if(fileName) bp.setFilename(fileName);
		
		return bp;
	};

	//Instance AttBodyPart Functions
	copyObjTo(AttBodyPart.prototype, {
	    getContentString: function() {
	        return this.content.toString();
	    },
	    getContentBuffer: function() {
	        return this.content;
	    }
	}, commonFunctions);

	//Set up functions to set/get values on CONTENT_DISPOSITION
	['name', 'filename'].forEach(function(valName) {
		var capName = capitalize(valName)
		,	namePrefix = valName + '="'
		,	regexKey = 'REGEX_' + valName.toUpperCase()
		,	regex = new RegExp(';\\s*' + namePrefix + '([^"]*)"');
		
		AttBodyPart[regexKey] = regex;
		
		AttBodyPart.prototype['set' + capName] = function(nameVal) {
			var disp = this.headers[HeaderTitles.CONTENT_DISPOSITION]
			, 	regex = AttBodyPart[regexKey];
			
	        if(disp.match(regex)) {
	            disp = disp.replace(regex, function(tot, oldName) {
	                return tot.replace(namePrefix + oldName, namePrefix + nameVal);
	            });
	        } else {
	            disp += '; ' + namePrefix + nameVal + '"';
	        }
	        
	        this.headers[HeaderTitles.CONTENT_DISPOSITION] = disp;
		};
		
		AttBodyPart.prototype['get' + capName] = function() {
			var disp = this.headers[HeaderTitles.CONTENT_DISPOSITION]
			,	match = disp && disp.match(AttBodyPart[regexKey]);
			
			return match && match[1];
		};
	});
	
	function AttMimeBody(headers) {
	    this.boundary = 'attboundary' + Math.random().toString().slice(2);
	    
	    headers = this.headers = copyObjTo({}, headers);
	    
	    if(!headers[HeaderTitles.CONTENT_TYPE]) headers[HeaderTitles.CONTENT_TYPE] = 'multipart/form-data';
	    headers[HeaderTitles.CONTENT_TYPE] += '; boundary="' + this.boundary + '"';
	    
	    this.parts = [];
	}
	
	//Static properties
	AttMimeBody.DASHES = '--';
	AttMimeBody.CRLF = AttBodyPart.CRLF;
	
	//TODO: Replace 'headers', 'attachments', 'body' with static parameters
	AttMimeBody.buildFromJSON = function(ajaxParams) {
		var mimeBody = new AttMimeBody(ajaxParams['headers']);
		
		/*
		// TODO Implement this logic
		if(ajaxParams['body']) {
			mimeBody.setMainPart(ajaxParams['body']);
		}
		*/
		
		ajaxParams['attachments'].forEach(function(jsonAttachment) {
			mimeBody.addBodyPartFromJSON(jsonAttachment);
		});
		
		return mimeBody;
	};

	//Instance methods
	copyObjTo(AttMimeBody.prototype, {
	    addBodyPart: function(bodyPart) {
	    	if(this.parts) {
	    		this.parts.push(bodyPart);
	    	} else {
	    		this.parts = [bodyPart];
	    	}
	    },
	    addBodyPartFromJSON: function(jsonBodyPart) {
	    	this.addBodyPart(AttBodyPart.buildFromJSON(jsonBodyPart));
	    },
	    setMainPart: function(mainBodyPart) {
	    	this.mainPart = mainBodyPart;
	    	//TODO Modify the Content-Type to reflect the name of the main part
	    },
		getContentString: function() {
	        var contentStr = '', boundary = this.boundary;
	        
	        function addPart(bodyPart) {
	        	if(!bodyPart) return;
	        	
	        	contentStr += AttMimeBody.DASHES + boundary + AttMimeBody.CRLF;
	            contentStr += bodyPart.toString() + AttMimeBody.CRLF;
	        }
	        
	        addPart(this.mainPart);
	        this.parts && this.parts.forEach(addPart);
	        contentStr += AttMimeBody.DASHES + boundary + AttMimeBody.DASHES + AttMimeBody.CRLF;
	        return contentStr;
	    },
	    getContentBuffer: function() {
	        var contentBuf = Ti.createBuffer(), boundary = this.boundary;
	        function addPart(bodyPart) {
	        	if(!bodyPart) return;
	        	
	        	contentBuf.append(Ti.createBuffer({ value: (AttMimeBody.DASHES + boundary + AttMimeBody.CRLF) }));
	            contentBuf.append(bodyPart.toBuffer());
	            contentBuf.append(Ti.createBuffer({ value: AttMimeBody.CRLF }));
	        }
	        
	        addPart(this.mainPart);
	        this.parts && this.parts.forEach(addPart);
	        contentBuf.append(Ti.createBuffer({ value: (AttMimeBody.DASHES + boundary + AttMimeBody.DASHES + AttMimeBody.CRLF) }));
	        return contentBuf;
	    }
	}, commonFunctions);
	
	
	return {
		AttMimeBody: AttMimeBody,
		AttBodyPart: AttBodyPart
	};
});