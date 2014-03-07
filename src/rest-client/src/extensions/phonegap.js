'use strict';


define(['att/ajax', 'att/main'], function(ajax, ATT) {
	
	var attCordovaProviderName = 'AttPlugin'
	//TODO Remove unformatIOSParams as soon as the iOS bridge can handle 2.0 raw interface
	,	unformatAttachments = function(attachments) {
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
				url 		: params.url,
				accessToken : params.headers.Authorization,
				accept 		: params.headers.Accept || '',
				contentType : params.headers['Content-Type'],
				body 		: params.body || '',
				attachments : unformatAttachments(params.attachments)
			};
		}
	,	unformatIOSParams = {
			'sendMMS'		: convertMessageParams,
			'sendMessage'	: convertMessageParams,
			'speechToText'  : function(params) {
				return {
					url 			: params.url,
					token 			: params.headers.Authorization,
					accept			: params.headers.Accept || '',
					contentType		: params.headers['Content-Type'],
					contentLanguage	: params.headers['Content-Language'] || '',
					contentLength	: params.headers['Content-Length'] || '',
					XSpeechContext	: params.headers['X-SpeechContext'] || 'Generic',
					transferEncoding: params.headers['Transfer-Encoding'] || '',
					xarg 			: params.headers['X-Arg'] || '',
					filePath 		: params.filePath
				};
			},
			'textToSpeech'  : function(params) {
				return {
					url 		: params.url,
					token 		: params.headers.Authorization,
					accept		: params.headers.Accept || '',
					contentType	: params.headers['Content-Type'],
					xarg 		: params.headers['X-Arg'] || '',
					body		: params.body,
					data		: '', //TODO What is data used for?
					filePath 	: params.responseFilePath
				};
			}
		};
	
	
	ajax.settings.isBridgeFunction = function(params) {
		//return (params.filePath || params.responseFilePath || params.attachments) ? true : false;
		return params.useBridge;
	};
	ajax.settings.bridgeFunction = function bridgeFunction(params, successCB, failCB) {
		var methodName = params.methodName;
		
		//TODO: Remove this once the iOS plugin can handle the raw interface
		if(device.platform.match(/iOS/)) {
			params = unformatIOSParams[methodName](params);
		}
		
		var mySuccess = function(resp) {
			successCB({ data: (resp.success || resp) });
		};
		
		//TODO in the future: Intercept successCB and format the response;
		
		Cordova.exec(mySuccess, failCB, attCordovaProviderName, methodName, [params]);
	};
	
	['accessToken', 'userAuthToken'].forEach(function(tokenName) {
		var tokenObj = ATT[tokenName]
		,	key = 'att.token.' + tokenName //Use a single key because these objects are singletons
		,	MyTokenObjectProto = tokenObj.constructor.prototype
		,	prevRemove = tokenObj.remove
		,	prevSave = tokenObj.save;
		
		MyTokenObjectProto.remove = function() {
			prevRemove.apply(this, arguments);
			localStorage.removeItem(key);
		};
		
		MyTokenObjectProto.save = function(tokenData) {
			localStorage.setItem(key, JSON.stringify(tokenData));
			prevSave.apply(this, arguments);
		};
		
		MyTokenObjectProto.load = function() {
			var tokenDataString = localStorage.getItem(key);
			if(!tokenDataString) return;
			if(has('DEBUG')) console.log('Loading token from storage: ' + tokenDataString);
			
			this.cache(JSON.parse(tokenDataString));
		};
		
		tokenObj.load();
	});
	
	return ATT;
});
