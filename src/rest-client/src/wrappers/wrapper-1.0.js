
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
	
	if(has('SMS')) {
		ATT.SMS = {
			'sendSMS': function(params, success, fail) {
				attBase.SMS.sendSMS({
					headers: getCommonHeaders(params, true),
					body: (params.contentType.toLowerCase() === 'application/json' && typeof params.body === 'object') ?
								JSON.stringify({outboundSMSRequest: params.body}) :
								params.body
				}, success, fail);
			},
			'getSMSDeliveryStatus': function(params, success, fail) {
				attBase.SMS.getSMSDeliveryStatus({
					headers: getCommonHeaders(params),
					urlParams: {
						smsId: params.smsId
					}
				}, success, fail);
			},
			'getSMS': function(params, success, fail) {
				attBase.SMS.getSMS({
					headers: getCommonHeaders(params),
					urlParams: {
						registrationId: params.registrationId
					}
				}, success, fail);
			}
		};
	}
	
	if(has('MMS')) {
		ATT.MMS = {
			'sendMMS': function(params, success, fail) {
				var body = (params.contentType === constants.header.contentType.JSON)
						?	'{"outboundMessageRequest":' + ((typeof params.body === 'object') 
							?	JSON.stringify(params.body) : params.body) + '}'
						:	params.body;
				
				attBase.MMS.sendMMS({
					headers: getCommonHeaders(params, true),
					body: body,
					attachments: convertAttachments(params.attachments)
				}, success, fail);
			},
			'getMMSDeliveryStatus': function(params, success, fail) {
				attBase.MMS.getMMSDeliveryStatus({
					headers: getCommonHeaders(params),
					urlParams: {
						mmsId: params.id
					}
				}, success, fail);	
			}
		};
	}
	
	
	if(has('PAYMENT')) {
		(function() {
			var qsKeyMap = {
				'Signature'           : 'signature' ,
				'SignedPaymentDetail' : 'signedDocument',
				'clientid'			  : 'clientId'
			};
			
			function getNotificationFunction(methodName) {
				return function(params, success, fail) {
					attBase.Payment[methodName]({
						headers: getCommonHeaders(params),
						urlParams: {
							notificationId: params.notificationId
						}
					}, success, fail);
				};
			}
			
			ATT.Payment = {
				'newSubscription': function(params, success, fail) {
					var queryObj = {};
					util.forEach(qsKeyMap, function(paramKey, newKey) {
						queryObj[newKey] = params[paramKey];
					});
					
					attBase.Payment.newSubscription({
						query: queryObj
					}, success, fail);
				},
				'getSubscriptionStatus': function(params, success, fail) {
					var urlParams;
					if (params.subscriptionId) {
						urlParams = { idType: 'SubscriptionId', id: params.subscriptionId };
					} else if (params.merchantTransactionId) {
						urlParams = { idType: 'MerchantTransactionId', id: params.merchantTransactionId };
					} else if (params.subscriptionAuthCode) {
						urlParams = { idType: 'SubscriptionAuthCode', id: params.subscriptionAuthCode };
					}
					
					attBase.Payment.getSubscriptionStatus({
						headers: getCommonHeaders(params),
						urlParams: urlParams
					}, success, fail);
				},
				'getSubscriptionDetails': function(params, success, fail) {
					attBase.Payment.getSubscriptionDetails({
						headers: getCommonHeaders(params),
						urlParams: {
							merchantSubscriptionId: params.merchantSubscriptionId,
							consumerId: params.consumerId
						}
					}, success, fail);
				},
				'newTransaction': function(params, success, fail) {
					var queryObj = {};
					util.forEach(qsKeyMap, function(paramKey, newKey) {
						queryObj[newKey] = params[paramKey];
					});
					
					attBase.Payment.newTransaction({
						query: queryObj
					}, success, fail);
				},
				'getTransactionStatus': function(params, success, fail) {
					var urlParams;
					if (params.transactionId) {
						urlParams = { idType: 'TransactionId', id: params.transactionID };
					} else if (params.merchantTransactionId) {
						urlParams = { idType: 'MerchantTransactionId', id: params.merchantTransactionId };
					} else if (params.transactionAuthCode) {
						urlParams = { idType: 'TransactionAuthCode', id: params.transactionAuthCode };
					}
					
					attBase.Payment.getTransactionStatus({
						headers: getCommonHeaders(params),
						urlParams: urlParams
					}, success, fail);
				},
				'refundTransaction': function(params, success, fail) {
					attBase.Payment.refundTransaction({
						headers: getCommonHeaders(params, true),
						query: {
							Action: params.action
						},
						urlParams: {
							transactionId: params.transactionId
						},
						body: params.body
					}, success, fail);
				},
				'getNotification': getNotificationFunction('getNotification'),
				'acknowledgeNotification': getNotificationFunction('acknowledgeNotification')
			};
		})();
	}
	
	if(has('IMMN')) {
		ATT.IMMN = {
			'sendMessage': function(params, success, fail) {
				attBase.IMMN.sendMessage({
					headers: getCommonHeaders(params, true),
					body: params.body,
					attachment: convertAttachments(params.attachments)
				}, success, fail);
			},
			'getMessageHeaders': function(params, success, fail) {
				attBase.IMMN.getMessageHeaders({
					headers: getCommonHeaders(params),
					query: {
						HeaderCount: params.headerCount,
						IndexCursor: params.indexCursor
					}
				}, success, fail);
			},
			'getMessageContent': function(params, success, fail) {
				attBase.IMMN.getMessageContent({
					headers: getCommonHeaders(params),
					urlParams: {
						messageId: params.messageId,
						partNumber: params.partNumber
					}
				}, success, fail);
			}
		};
	}

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
	
	if(has('CMS')) {
		ATT.CMS = {
			'createSession': function(params, success, fail) {
				attBase.CMS.createSession({
					headers: getCommonHeaders(params, true),
					body: params.body
				}, success, fail);
			},
			'sendSignal': function(params, success, fail) {
				attBase.CMS.sendSignal({
					headers: getCommonHeaders(params, true),
					urlParams: { cmsId: params.cmsId },
					body: params.body
				}, success, fail);
			}
		};
	}
	
	if(has('ADS')) {
		ATT.Ads = {
			'getAds': function(params, success, fail) {
				var headers = getCommonHeaders(params);
				headers['Udid'] = params.udid;
				headers['User-Agent'] = params.userAgent;
				
				attBase.Ads.getAds({
					headers: headers,
					query: params.body
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
	
	
	
	if(has('WAP')) {
		ATT.WAPPush = {
			'sendWAPPush': function(params, success, fail) {
				var pushObj = {};
				pushObj[constants.attachmentKeys.BODY] = body.data;
				pushObj[constants.attachmentKeys.NAME] = 'PushContent';
				pushObj[constants.attachmentKeys.MIME_TYPE] = 'text/xml';
				
				attBase.WAPPush.sendWAPPush({
					headers: getCommonHeaders(params, true),
					body: params.body,
					attachments: [pushObj]
				}, success, fail);
			}
		};
	}
	
	if(has('TL')) {
		ATT.Location = {
			'getDeviceLocation': function(params, success, fail) {
				attBase.Location.getDeviceLocation({
					headers: getCommonHeaders(params),
					query: {
						'requestedAccuracy'  : params.requestedAccuracy,
						'Tolerance'			 : params.tolerance,
						'acceptableAccuracy' : params.acceptableAccuracy
					}
				}, success, fail);
			}
		};
	}
	
	if(has('SPEECH')) {
		ATT.Speech = {
			'speechToText': function(params, success, fail) {
				attBase.Speech.speechToText({
					headers: {
						'Accept'             : params.accept,
						'Content-Type'       : params.contentType,
						'Transfer-Encoding'  : params.transferEncoding,
						'X-SpeechContext'    : params.xSpeechContext,
						'X-SpeechSubContext' : params.xSpeechSubContext,
						'Content-Language'   : params.contentLanguage,
						'Content-Length'     : params.contentLength,
						'X-Arg'              : params.xArg || params.xarg
					},
					filePath: params.filePath
				}, success, fail);
			}
		};
	}
	
	if(has('TTS')) {
		var origSpeechObj = ATT.Speech;
		ATT.Speech = origSpeechObj || {};
		
		ATT.Speech.textToSpeech = function(params, success, fail) {
			attBase.Speech.textToSpeech({
				headers: {
					'Accept'           : params.accept,
					'Content-Type'     : params.contentType,
					'Content-Language' : params.contentLanguage,
					'Content-Length'   : params.contentLength,
					'X-Arg'            : has('phonegap') ? params.xarg : params.xArg
				},
				responseFilePath: params.filePath,
				body: params.body
			}, success, fail);
		};
		
		if(has('phonegap')) {
			ATT.tts = { textToSpeech: ATT.Speech.textToSpeech };
			
			if(origSpeechObj) {
				delete origSpeechObj.textToSpeech;
			} else {
				delete ATT.Speech;
			}
		}
	}
	
	if(has('STTC')) {
		var fileExtensionMimeTypes = {
			'wav': 'audio/wav',
			'amr': 'audio/amr',
			'awr': 'audio/amr-wb'
		};
		
		ATT.Speech = ATT.Speech || {};
		
		var textFileTypes = ['dictionary', 'grammar', 'grammar-prefix', 'grammar-altgram']
		,	textFileFunctions = {};
		
		textFileTypes.forEach(function(name) {
			var attName = 'x-' + name
			,	extension = (name === 'dictionary') ? 'pls' : 'srgs'
			,	mimeType = 'application/' + extension + '+xml';
			
			textFileFunctions[name] = function(data) {
				if(!data) return;
				
				var grammarAttachment = { name: attName,  mimeType: mimeType };
				
				if(typeof data === 'string') {
					//If there is no file extension then this must not be a filePath string so it must be the content
					var filePathMatch = data.match(/.*\.(.*)/);
					if(!filePathMatch || filePathMatch[1] !== extension) {
						data = { body: data };
					} else {
						data = { filePath: data };
					}
				}
				
				if(data.body) {
					grammarAttachment.body = data.body;
					if(data.filePath) grammarAttachment.fileName = data.filePath.match(/(.*\/|^)(.*)/)[2];
					if(data.encoding) grammarAttachment.encoding = data.encoding;
				} else {
					grammarAttachment.filePath = data.filePath;
				}
				
				return grammarAttachment;
			};
		});
		
		/*
		 * TODO expose grammar/dictionary Object options
		 */
		/**
		 * @method speechToTextCustom
		 * This method returns a text translation of a specified audio file using a custom set of hints for pronunciation and grammar. The audio file must be created in one of the following formats:
		 *
		 * &bull; 16-bit PCM WAV, single channel, 8 kHz sampling
		 *
		 * &bull; AMR (narrowband), 12.2 kbit/s, 8 kHz sampling.
		 *
		 * @param {Object} params An Object containing the following properties:
		 * @param {String/Object} [params.audioFile] A string with a filePath to the audio file or an object with the following properties:
		 * @param {String} [params.audioFile.filePath] The path to the audio file. If params.audioFile.body is also defined, this will be used as the file name in the request.
		 * @param {String} [params.audioFile.body] The audio file content.
		 * @param {String} [params.audioFile.type] The MIME type of the audio file.
		 * @param {String} [params.audioFile.encoding] The encoding format of the audio file.
		 * @param {String} [params.grammar] String of a file path or a string in Speech Recognition Grammar Specification (SRGS) format.
		 * @param {String} [params.grammarPrefix] Grammar rules for the prefix speech following the same format as params.grammar
		 * @param {String} [params.grammarAltgram] Grammar rules for alternative grammar, following the same format as params.grammar
		 * @param {String} [params.dictionary] String of a file path with pronunciation hints in the Pronunciation Lexicon Specification (PLS) format, or a string containing the pronunciation hints in the PLS format.
		 * @param {String} [params.language] The language of the audio recording, specified as an ISO code language string.
		 * @param {String/Object} [params.xArg] Either a comma-separated URL-encoded string or a flat object consisting of xArg parameter key/value pairs.  Please visit the <a href="https://developer.att.com/developer/basicTemplate.jsp?passedItemId=13100102&api=Speech&version=3">AT&T Restful API</a> for a list of all possible values
		 * @param {Object} [params.options] A set of options for the request.
		 * @param {Boolean} [params.options.emma] The option to callback with the response as a string following the EMMA protocol.
		 * @param {Boolean} [params.options.strict] If set to true, the response will strictly follow the passed in grammar rules
		 * @param {Boolean} [params.options.chunked] If set to true, this will send the audio file to server using a chunked protocol.
		 * 
		 * @param {Function} success This method is called if data is successfully returned.  The first argument will be contain the response in JSON object defined by the <a href="https://developer.att.com/developer/basicTemplate.jsp?passedItemId=13100102&api=Speech&version=3">AT&T Restful API</a>.
		 * @param {Function} fail This method is called if an error occurs.
		 * 
		 */
		
		//TODO Limit values of grammar and pronunciation to strings only, file path or body
		
		var sttc = ATT.Speech.speechToTextCustom = function(params, success, fail) {
			var attachments = [], options = params.options || {}, isEMMA = options.emma;
			
			//Add the text files
			textFileTypes.forEach(function(name) {
				//Converts words with a dash to camelCase, e.g. "grammar-prefix" to "grammarPrefix"
				var paramName = name.replace(/-[a-z]/, function(dashLetter) { return dashLetter[1].toUpperCase(); });
				var attachment = textFileFunctions[name](params[paramName]);
				if(attachment) attachments.push(attachment);
			});
			
			if(!params.audioFile) {
				throw new Error('missing required parameter "audioFile"');
			}
			
			attachments.push(sttc.handleAudioFile(params.audioFile));
			
			var formatSuccessResp = success && function(resp, ajax) {
				var formattedRespObj = resp.data;
				//TODO In the 2.0 wrapper create an interface that interperets the results and creates
				//		a consistant result on the success call
				
				success.call(this, formattedRespObj, ajax);
			};
			
			attBase.Speech.speechToTextCustom({
				headers: {
					'Accept'             : isEMMA ? 'application/emma+xml' : 'application/json',
					//'Transfer-Encoding'  : options.chunked && 'chunked', //TODO Implement this feature
					'X-SpeechContext'    : options.strict ? 'GrammarList' : 'GenericHints',
					'Content-Language'   : params.language,
					'X-Arg'              : params.xArg
				},
				attachments: attachments
			}, formatSuccessResp, fail);
		};
		
		//NOTE: Replace this function in other platforms to allow for passing platform
		//		specific file objects
		sttc.handleAudioFile = function(audioFile) {
			var filePath, mimeType, encoding;
			
			if(typeof audioFile === 'string') {
				filePath = audioFile;
			} else {
				filePath = audioFile.filePath;
				mimeType = audioFile.type;
				encoding = audioFile.encoding;
			}
			
			if(!mimeType && filePath) {
				var fileExtMatch = filePath.match(/.*\.(.*)/);
				var fileExtension = fileExtMatch && fileExtMatch[1];
				mimeType = fileExtensionMimeTypes[fileExtension];
			}
			
			var audioAttachment = {
				mimeType: mimeType,
				name: 'x-voice',
				encoding: encoding
			};
			
			if(audioFile.body) {
				audioAttachment.fileName = filePath && filePath.match(/(.*\/|^)(.*)/)[2];
				audioAttachment.body;
			} else {
				audioAttachment.filePath = filePath;
			}
			
			return audioAttachment;
		};
	}
	
	ATT.Notary = {
		'signedPayload': function(params, success, fail) {
			attBase.Notary.signedPayload({
				headers: {
					'Accept'        : params.accept,
					'Content-Type'  : params.contentType,
					'Client_id'     : params.clientId,
					'Client_secret' : params.clientSecret
				},
				body: params.data
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