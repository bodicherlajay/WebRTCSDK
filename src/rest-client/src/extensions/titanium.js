'use strict';
/*global tiRequire, Ti*/

require(['att/main', 'att/util', 'att/ajax', 'att/constants', 'att/ajax.mime'], function(ATT, util, ajax, constants, mime) {
	//This function modifies the ATT, util, and ajax objects for the appropriate environment
	var isAndroid = (Ti.Platform.osname === 'android');
	
	util.log = function() {
		util.apply(Ti.API, 'log', arguments);
	};
	
	ajax.settings.getXHR = function() {
		var options = {};
		if(has('DEBUG')) options.validatesSecureCertificate = false;
		
		try {
			return Ti.Network.createHTTPClient(options);
		} catch( e ) {}
	};
	
	//TODO Remove unformatIOSParams as soon as the iOS bridge can handle 2.0 raw interface
	var unformatAttachments = function(attachments) {
			if(!attachments || !attachments.length) return [{}];
			
			return attachments.map(function(attachment) {
				return {
					fileObject : attachment.body || undefined,
					filePath   : attachment.filePath || undefined,
					fileType   : attachment.mimeType || undefined,
					fileName   : attachment.name || undefined
				};
			});
		}
	,	convertMessageParams = function(params) {
			return {
				"body"		  : params.body || '',
				"contentType" : params.headers['Content-Type'],
				"accept"	  : params.headers.Accept || '',
				"accessToken" : params.headers.Authorization,
				"url"		  : params.url,
				"attachments" : unformatAttachments(params.attachments)
			};
		};
	
	var unformatIOSParams = {
		'sendMMS': convertMessageParams,
		'sendMessage': convertMessageParams
	};
	
	var attBridge = tiRequire('ti.api.att');
	ajax.settings.bridgeFunction = function bridgeFunction(params, successCB, failCB) {
		var methodName = params.methodName;
		
		//TEMPORARY TO GET STTC TO WORK:
		if(!isAndroid && methodName === 'speechToTextCustom') {
			var mimeBody = mime.AttMimeBody.buildFromJSON(params);
			
			params.body = mimeBody.getContentBuffer().toBlob();
			params.headers = mimeBody.headers;
			delete params.useBridge; //Needed to prevent infinite loop
			
			return ajax(params, successCB, failCB);
		}
		
		
		
		var mySuccess = function(resp) {
			//TODO create a common interface for return values from the bridge
			var data = resp.success || resp;
			try { data = JSON.parse(data); } catch(e) {}
			
			successCB.call(this, { data: data });
		};
		
		//TODO Remove this once the iOS module can handle the new raw interface
		if(!isAndroid) {
			params = unformatIOSParams[methodName](params);
		}
		
		attBridge[methodName](params, mySuccess, failCB);
	};
	ajax.settings.isBridgeFunction = function(params) {
		return params.useBridge;
		//return ((Ti.Platform.osname !== 'android' && params.filePath) || params.attachments) ? true : false;
	};
	
	//Persist tokens
	['accessToken', 'userAuthToken'].forEach(function(tokenName) {
		var tokenObj = ATT[tokenName]
		,	key = 'att.token.' + tokenName //Use a single key because these objects are singletons
		,	myTokenObjectProto = tokenObj.constructor.prototype
		,	prevRemove = tokenObj.remove
		,	prevSave = tokenObj.save;
		
		myTokenObjectProto.remove = function() {
			prevRemove.apply(this, arguments);
			Titanium.App.Properties.removeProperty(key);
		};
		
		myTokenObjectProto.save = function(tokenData) {
			Titanium.App.Properties.setObject(key, tokenData);
			prevSave.apply(this, arguments);
		};
		
		myTokenObjectProto.load = function() {
			var tokenData = Titanium.App.Properties.getObject(key);
			if(!tokenData) return;
			
			this.cache(tokenData);
		};
		
		tokenObj.load();
	});
	
	
	
	if(has('ADS')) {
		//Allow the user to set the User-Agent in Titanium
		ATT.Ads.getAds.headerConfig['User-Agent'] = true;
	}
	
	if(has('SPEECH')) {
		//Use Titanium to read the file if not on android
		if(Ti.Platform.osname !== 'android') {
			var speechFunction = ATT.Speech.speechToText;
			
			speechFunction.useBridge = false;
			
			speechFunction.executor = function(formattedParams, params, successCB, failCB) {
				try {
					var audioFile = Ti.Filesystem.getFile(params.filePath);
					formattedParams.body = audioFile.read();
				} catch(e) {
					return e;
				}
				
				return formattedParams;
			};
			
			speechFunction.headerConfig['Content-Length'] = {
				backup: function(params) {
					try {
						var audioFile = Ti.Filesystem.getFile(params.filePath);
						return audioFile.length;
					} catch(e) {}
				}
			};
		}
	}
	
	if(has('TTS')) {
		//TODO Move the recommended extensions to the 2.0 wrapper layer
		
		var recommendedExtensions = {
			'audio/x-wav': 'wav',
			'audio/amr': 'amr',
			'audio/amr-wb': 'awb'
		};
		var defaultFileExtension = recommendedExtensions['audio/amr-wb'];  //defaults to audio/amr-wb
		
		function saveRespToFile(xhr, filePath, cbOnSave) {
			var respContentType = xhr.getResponseHeader('Content-Type'),
			    predictedExtension = recommendedExtensions[respContentType],
			 	fileExt = '.' + (predictedExtension || defaultFileExtension);
			
			if(predictedExtension && filePath.indexOf(fileExt) !== (filePath.length - fileExt.length)) {
				filePath += fileExt; //If file extension isn't provided in filePath, then add it
			}
			
		    var file = Ti.Filesystem.getFile(filePath);
			
		    file.write(xhr.responseData);
		    
		    cbOnSave({
		    	file: file,
		    	data: xhr.responseData,
		    	filePath: filePath,
		    	contentType: respContentType,
		    	xhr: xhr
		    });
		}
		
		var ttsFunc = ATT.Speech.textToSpeech;
		
		ttsFunc.executor = function(formattedParams, params, successCB, failCB) {
			formattedParams.success = function() {
				var args = Array.prototype.slice.call(arguments, 0), xhr = this;
				saveRespToFile(xhr, params.responseFilePath, function(data) {
					args[0] = { data: data };
					if(successCB) successCB.apply(xhr, args);
				});
			};
			
			return formattedParams;
		};
		
		ttsFunc.useBridge = false;
	}
	
	return ATT;
});
