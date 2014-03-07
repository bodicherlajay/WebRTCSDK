
define(['att/main', 'att/constants', 'att/util'], function(attBase, constants, util) {
	var ATT = {};
	
	function getCommonHeaders(params, withContentType) {
		var headers = {};
		if(!params) return headers;
		
		if(withContentType) headers['Content-Type'] = params.contentType;
		headers.Accept = params.accept;
		
		return headers;
	}
	
	function convertAttachment(oldAttachment) {
		var fileName = oldAttachment.fileName || undefined;
		if(!fileName && oldAttachment.filePath) {
			fileName = oldAttachment.filePath.match(/.*\/(.*)/)[1];
		}
		
		return {
			body: oldAttachment.fileObject || undefined,
			filePath: oldAttachment.filePath || undefined,
			fileName: fileName,
			mimeType: oldAttachment.fileType || undefined,
			name: fileName,
			encoding: oldAttachment.fileObject ? 'base64' : undefined
		};
	}
	
	function convertAttachments(oldAttachments) {
		if(!oldAttachments) return;
		return oldAttachments.map(convertAttachment);
	}
	
	ATT.authorize = function(accessKeyId, secretKey, scope, grantType, oAuthCode) {
		attBase.setKeys(accessKeyId, secretKey, scope);
		if(oAuthCode) attBase.setOAuthCode(oAuthCode);
	};
	
	ATT.setAccessToken = function(token, refreshToken, expiration) {
		attBase.accessToken.token = token;
		attBase.accessToken.refresh = refreshToken;
		attBase.accessToken.expiration = expiration;
	};
	
	if(has('DEBUG')) {
		ATT.accessToken = attBase.accessToken;
		ATT.userAuthToken = attBase.userAuthToken;
	}
	
	ATT.getCachedAccessToken = function() { return attBase.accessToken.token; };
	ATT.getCachedUserAuthToken = function() { return attBase.userAuthToken.token; };
	

	if(has('IMMNv2')) {
		ATT.IMMN = {
			'sendMessage': function(params, success, fail) {
				attBase.IMMNv2.sendMessage({
					headers: getCommonHeaders(params, true),
					body: params.body,
					attachment: convertAttachments(params.attachments)
				}, success, fail);
			},
			//Method for backwards compatibility
			'getMessageHeaders': function(params, success, fail) {
				var qsObj = {
					//Backwards compatible
					limit: params.headerCount,
					offset: params.indexCursor
				};

				['messageIds', 'isFavorite', 'isUnread', 'type', 'IsIncoming'].forEach(function(key) {
					qsObj[key] = params[key];
				});
				
				console.warn('IMMN.getMessageHeaders is deprecated.  Use IMMN.getMessageList');
				
				attBase.IMMNv2.getMessageList({
					headers: getCommonHeaders(params),
					query: qsObj
				}, success, fail);
			},
			'getMessageList': function(params, success, fail) {
				var qsObj = {};

				['limit', 'offset', 'messageIds', 'isFavorite', 'isUnread', 'type', 'IsIncoming'].forEach(function(key) {
					qsObj[key] = params[key];
				});

				attBase.IMMNv2.getMessageList({
					headers: getCommonHeaders(params),
					query: qsObj
				}, success, fail);
			},
			'getMessage': function(params, success, fail) {
				attBase.IMMNv2.getMessage({
					headers: getCommonHeaders(params),
					urlParams: {
						messageId: params.messageId
					}
				}, success, fail);
			},
			'getMessageContent': function(params, success, fail) {
				attBase.IMMNv2.getMessageContent({
					headers: getCommonHeaders(params),
					urlParams: {
						messageId: params.messageId,
						partId: params.partNumber
					}
				}, success, fail);
			},
			'getDelta': function(params, success, fail) {
				
				attBase.IMMNv2.getDelta({
					headers: getCommonHeaders(params),
					query: { state: params.state}
				}, success, fail);
			},
			'updateMessages': function(params, success, fail) {				
				if(typeof params.body !== 'string') {
					fail({error: '"body" parameter must be a String'});
					return;
				}
				
				var headerObj = getCommonHeaders(params, true);
				
				// Change in input suggestion.
				//var bodyString = (typeof params.body === 'object') ? JSON.stringify({messages: params.body}) : (params.body + '');
				headerObj['Content-Length'] = params.contentLength; //bodyString.length;
				
				attBase.IMMNv2.updateMessages({
					headers: headerObj,
					body: params.body //Assumption: typeof params.body === 'string'
				}, success, fail);
			},
			'updateMessage': function(params, success, fail) {
				if(typeof params.body !== 'string') {
					fail({error: '"body" parameter must be a String'});
					return;
				}
				
				var headerObj = getCommonHeaders(params, true);

				headerObj['Content-Length'] = params.contentLength;
				
				attBase.IMMNv2.updateMessage({
					headers: headerObj,
					urlParams: {
						messageId: params.messageId
					},
					body: params.body
				}, success, fail);
			},
			'deleteMessages': function(params, success, fail) {
				attBase.IMMNv2.deleteMessages({
					headers: getCommonHeaders(params),
					query: { messageIds: params.messageIds}
				}, success, fail);
			},
			'deleteMessage': function(params, success, fail) {
				attBase.IMMNv2.deleteMessage({
					headers: getCommonHeaders(params),
					urlParams: {
						messageId: params.messageId
					}
				}, success, fail);
			},
			'createMessageIndex': function(params, success, fail) {
				attBase.IMMNv2.createMessageIndex({
					headers: getCommonHeaders(params),
				}, success, fail);
			},
			'getMessageIndexInfo': function(params, success, fail) {
				attBase.IMMNv2.getMessageIndexInfo({
					headers: getCommonHeaders(params),
				}, success, fail);
			},
			'getNotificationConnectionDetails': function(params, success, fail) {
				var headerObj = getCommonHeaders(params);
				var qsObj = { queues: params.queues};
				
				attBase.IMMNv2.getNotificationConnectionInfo({
					headers: headerObj,
					query: qsObj
				}, success, fail);
			}
		};
	}
	
	ATT.OAuth = {
		'obtainEndUserAuthorization': function(params, success, fail) {
			attBase.OAuth.obtainEndUserAuthorization({
				headers: getCommonHeaders(params),
				query: {
					'client_id'    : params.clientId,
					'scope'        : params.scope,
					'redirect_uri' : params.redirectUrl
				}
			}, success, fail);
		}
	};
	
	
	function stringifyResp(cb) {
		return function(data) {
			arguments[0] = JSON.stringify(data);
			
			cb.apply(this, arguments);
		};
	}
	
	var skipStringify = function(methodName) {
		return ['newTransaction', 'newSubscription'].indexOf(methodName) >= 0 //Non stringified functions responses
				//Simulate a bug from from PhoneGap 1.0 versions
				|| (has('phonegap') && ['sendMMS', 'sendMessage', 'speechToText', 'textToSpeech'].indexOf(methodName) >= 0);
	};
	
	function formatMethodInput(customHandler, methodPath) {
		return function(params, success, fail) {
			var formattedSuccess = function(resp) {
				if(resp) arguments[0] = resp.data;
				
				if(skipStringify(methodPath[1])) {
					success.apply(this, arguments);
				} else {
					stringifyResp(success).apply(this, arguments);
				}
			};
			
			var formattedFail = stringifyResp(fail);
			
			customHandler(params, formattedSuccess, formattedFail);
		};
	}
	
	//NOTE: This is a list of new methods added later that will match the 2.0 Layer style
	var excludeMethods = {
		speechToTextCustom: true
	},
	excludeScopes = {
		accessToken: true, 
		userAuthToken: true
	};
	
	util.forEach(ATT, function(methods, scope) {
		if(typeof methods !== 'object' || excludeScopes[scope]) return;
		util.forEach(methods, function(method, methodName) {
			if(typeof method !== 'function' || excludeMethods[methodName]) return;
			methods[methodName] = formatMethodInput(method, [scope, methodName]);
		});
	});
	
	return ATT;
});