'use strict';

define(function(require, exports, module) {
	var ajax = require('att/ajax')
	,   util = require('att/util')
	,   copyObjTo = util.copyObjTo
	,   forEach = util.forEach
	,   QS = util.qs
	,   constants = require('att/constants')
	,	RESTfulDefinition = require('att/RESTfulDefinition');
	
	/**
	 * @class ATT (at the root only)
	 * @method getProtocol {function() : String} - getter for protocol
	 * @method setProtocol {function(newProtocol)} - setter for protocol. Updates appendUrl
	 * @method getDomain {function() : String} - getter for domain
	 * @method setDomain {function(newDomain)} - setter for domain. Updates appendUrl
	 * 
	 * @class ATTMethod
	 * @method executor {function(formattedParams, params, successCB, failCB): Object} expected to be called by the root
	 * 		executor with formatted parameters, original parameters and callbacks.  Modify and return formattedParams
	 * 		to send to the formattedParams to the Ajax Layer.
	 */
	
	/*
	 * TODO Create a single callback. In wrapper, check if error parameter is set and reroute 
	 * to error callback in wrappers
	 */
	
	function formatError(err) {
		return {
			type: err.constructor.name,
			message: err.message,
			source: err
		};
	}
	
	function sendError(err, errorCB) {
		var errObj = { error: formatError(err) };
		errorCB(errObj);
		return errObj;
	}
	
	/*
	function sendSuccess(data, successCB) {
		var successObj = {
			data: data
		};
		successCB.call(this, successObj);
		return successObj;
	}
	*/
	
	function isValidBody(attachment, isAttachment) {
		var body = attachment[constants.attachmentKeys.BODY]
		,	fName = attachment[constants.attachmentKeys.FILE_PATH];
		
		if(body && fName) {
			var errString = 'Both "' + constants.attachmentKeys.BODY + '" and "' + 
					constants.attachmentKeys.FILE_PATH + '" cannot both be defined '+
					isAttachment ? 'in an attachment' : 'in the parameters';
			
			throw new Error(errString);
		} else if(isAttachment && !body && !fName) {
			throw new Error('Either "' + constants.attachmentKeys.BODY + '" or "' + 
					constants.attachmentKeys.FILE_PATH + '" must be defined in all attachments');
		}
	}
	
	function baseExecutor(attMethod, params, successCB, failCB) {
		
		var req = {}, attRoot = this.getRoot(); //Note: This should be true: attRoot === this
		
		function handleResponse(cb) {
			return function() {
				if(cb) cb.apply(this, arguments);
				delete req.active;
			};
		}
		
		function handleError(e) {
			req.error = formatError(e);
			failCB(req.error);
		}
		
		//get access token, setup headers from params, get url
		var buildRequest = function(tokenInfo) {
			
			var headers, qs, url;
			try {
				var queryString = params[constants.paramKey.QUERY];
				
				headers = attMethod.getHeaders(params);
				qs = (typeof queryString === 'string') ? queryString : attMethod.getQueryString(params);
				url = attMethod.getUrl(params);
				
				var attachments = params[constants.paramKey.ATTACHMENTS];
				attachments && attachments.forEach(function(att) {
					isValidBody(att, true);
				});
				
				isValidBody(params);
			} catch(e) {
				//headerConfig', 'queryStringConfig', 'urlParamsConfig
				e.message += '. Check inputted ' + 
							 (headers === undefined) ? 'header ' :
							 (qs === undefined) ? 'query string ' :
							 (url === undefined) ? 'url parameters ' : ''
						  +  'values for method "' + attMethod.methodName + '"';
				
				handleError(e);
				return;
			}
			
			if(tokenInfo) headers.Authorization = 'Bearer ' + tokenInfo.data.token;
			else if(!attMethod.tokenType === ATT.TokenType.NONE) {
				handleError(new Error('Missing access token for this request, fetch a new one'));
				return;
			}
			
			var formattedParams = copyObjTo({method: attMethod.method, url: url}, params);
			if(qs) formattedParams.query = qs;
			formattedParams.headers = headers;
			
			//allow modules to modify the ajax config
			var returnValue = attMethod.executor ? 
					attMethod.executor(formattedParams, params, successCB, failCB) :
					formattedParams;
			
			if(returnValue === formattedParams) { //then send the request
				formattedParams.methodName = attMethod.methodName;
				formattedParams.useBridge = attMethod.useBridge; //Temporary
				
				req.active = ajax(
					formattedParams,
					handleResponse(formattedParams.success || successCB),
					handleResponse(formattedParams.fail || failCB)
				);
				
			} else {
				if(returnValue instanceof Error) {
					handleError(returnValue);
					return;
				}
				
				//If a the return value is an object, copy keys to the request object
				if(returnValue && returnValue.constructor.toString() === '[object Object]') {
					copyObjTo(req, returnValue);
				} else {
					//Otherwise, make the returnValue accessable through data of the req obj
					req.data = returnValue;
				}
				
				successCB({data: returnValue});
			}
		};
		
		switch(attMethod.tokenType) {
		case ATT.TokenType.NONE:
			buildRequest();
			break;
		case ATT.TokenType.USER:
			attRoot.userAuthToken.fetch(
				handleResponse(buildRequest), 
				handleResponse(failCB)
			);
			break;
		case ATT.TokenType.ACCESS:
		default:
			attRoot.accessToken.fetch(
				handleResponse(buildRequest), 
				handleResponse(failCB)
			);
		}
			
		return req;
	}
	
	var ATT = module.exports = new RESTfulDefinition({
		executor: baseExecutor
	});
	
	(function() {
		var protocol, domain;
		function createAppendUrl() {
			return (protocol || '') + (domain || '');
		}
		
		ATT.setProtocol = function(newProtocol) {
			protocol = newProtocol;
			ATT.appendUrl = createAppendUrl();
		};
		ATT.getProtocol = function() {
			return protocol;
		};
		
		ATT.setDomain = function(newDomain) {
			domain = newDomain;
			ATT.appendUrl = createAppendUrl();
		};
		ATT.getDomain = function() {
			return domain;
		};
	})();
	
	//NOTE: When changing protocol or domain, make sure to change the PROTOCOL and DOMAIN
	//		in AttRequest.java to ensure bridge functions work properly.
	ATT.setProtocol('https://');
	ATT.setDomain('api.att.com'); //DEBUG: 'api-uat.pacer.bf.sl.attcompute.com'
	
	
	//Access token definitions and fetching wrappers
	
	ATT.TokenType = {
		NONE: 'noToken',
		ACCESS: 'accessToken',
		USER: 'userAuthToken'
	};
	
	RESTfulDefinition.defaultMethodParams.tokenType = ATT.TokenType.ACCESS;
	
	var appKey, secret, accessScopeStr, authScopeStr, oAuthCode
	,	possibleAuthScope = { IMMN: true, MIM: true, TL: true };
	
	
	ATT.addDefinition('OAuth', new RESTfulDefinition({
		appendUrl: '/oauth',
		methods: {
			'getAccessToken': {
				appendUrl: '/access_token',
				method: 'POST',
				tokenType: ATT.TokenType.NONE,
				headerConfig: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Accept': 'application/json'
				},
				executor: function(formattedParams, params, successCB, failCB) {
					var body = formattedParams.body;
					if(typeof body === 'string') body = QS.parse(body);
					
					if((!appKey && !body.client_id) || (!secret && !body.client_secret)) {
						var error = new Error('App Key or Secret are undefined. Set the keys recieved from developer.att.com');
						return sendError(error, failCB);
					}
					
					body.client_id = appKey;
					body.client_secret = secret;
					
					formattedParams.body = QS.stringify(body);
					return formattedParams;
				}
			},
			'obtainEndUserAuthorization': {
				method: 'GET',
				appendUrl: '/authorize',
				tokenType: ATT.TokenType.NONE,
				queryStringConfig: {
					'client_id'    : { required: true, backup: function() { return appKey; } },
					'scope'        : { required: true, backup: function() { return authScopeStr; } },
					'redirect_uri' : false
				},
				executor: function(formattedParams, params, successCB, failCB) {
					return {
						uri: (formattedParams.url + '?' + formattedParams.query)
					};
				}
			}
		}
	}));
	
	//Wrappers used to make getAccessToken and getUserAuthorization more convenient
	function TokenObject(props) {
		copyObjTo(this, props);
	}
	tokenObjProto = TokenObject.prototype;
	
	copyObjTo(tokenObjProto, {
		fetch: function(data, success, fail) {
			if(arguments.length === 2) {
				var tmpData = fail; //Should be undefined
				fail = success;
				success = data;
				data = tmpData;
			}
			
			var accessParams = {}, self = this;
			
			if(this.isExpired()) {
				//Set up for a refresh if the token has expired
				if(has('DEBUG')) util.log('Refreshing the token in memory');
				
				accessParams.grant_type = 'refresh_token';
				accessParams.refresh_token = this.refreshToken;
			} else if(this.token) {
				//Return the token if we have one cached
				if(has('DEBUG')) util.log('Used token from memory: ' + this.token);
				var tokenInfo = {
					data: this.getCache()
				};
				
				success.call(this, tokenInfo);
				return tokenInfo;
			} else {
				//Uniquely format the accessParams for this accessToken fetch
				if(has('DEBUG')) util.log('Fetching a new token');
				try {
					this.formatParameters(accessParams, data);
				} catch(e) {
					return sendError(e, fail);
				}
			}
			
			var reqState = {
				appKey: appKey,
				accessTokenScope: accessScopeStr,
				userAuthScope: authScopeStr
			};
			
			var mySuccess = function(resp, ajax) {
				delete self.fetching;
				
				if(resp.data.error) {
					failCB.call(this, {error: {
						type: 'AuthorizationError',
						message: resp.data.error
					}});
					return;
				}
				
				var formattedResp = self.formatResponse(reqState, resp.data);
				self.save(formattedResp);
				
				if(success) success.call(self, { data: self.getCache() }, ajax);
			};
			
			var myFail = function(error, ajax) {
				delete self.fetching;
				if(fail) fail.apply(self, arguments);
			};
			
			var currentResp = ATT.OAuth.getAccessToken({body: accessParams}, mySuccess, myFail);
			
			//Set the "fetching" parameter to the AttXHR so that other requests can queue up
			//for the return of a new access token.
			if(currentResp.active) this.fetching = currentResp.active;
			
			return currentResp;
		},
		refresh: function(success, fail) {
			if(!this.refreshToken) {
				return sendError(new Error('Fetch a token before you can refresh it'), fail);
			}
			this.expiration = Date.now() - 10; //Expire the token to force a refresh
			return this.fetch(success, fail);
		},
		formatResponse: function(reqState, tokenResp) {
			//alert('tokenResp = ' + JSON.stringify(tokenResp, null, 3));
			
			var expiresIn = parseInt(tokenResp.expires_in);
			return {
				t: tokenResp.access_token, 						//token
				r: tokenResp.refresh_token, 					//refresh
				e: expiresIn && Date.now() + (1000 * expiresIn),//expiration
				k: reqState.appKey								//The app key associated with token
			};
		},
		keys: ['token', 'refreshToken', 'expiration', 'key', 'scope'],
		clearCache: function() {
			this.keys.forEach(function(key) {
				delete this[key];
			}, this);
		},
		getCache: function() {
			var tokenInfo = {};
			this.keys.forEach(function(key) {
				tokenInfo[key] = this[key];
			}, this);
			return tokenInfo;
		},
		cache: function(tokenData) {
			if(!tokenData.s || !tokenData.k) return;
			
			this.token = tokenData.t;
			this.refreshToken = tokenData.r;
			this.expiration = tokenData.e;
			this.key = tokenData.k;
			this.scope = tokenData.s;
		},
		isExpired: function() {
			return this.refreshToken && this.expiration !== 0 && this.expiration < Date.now();
		},
		//Delete the persisted token
		remove: function() {
			this.clearCache(); //If there is no persistence, just clear memory
		},
		//Persist the token
		save: function(tokenData) {
			this.cache(tokenData); //If there is no persistence, just cache in memory
		},   
		//load the persisted token into memory
		load: function() {
			
		}
	});
	
	function AccessToken(props) {
		copyObjTo(this, props);
	}
	
	//Extend TokenObject
	util.inherits(AccessToken, TokenObject, {
		formatParameters: function(accessParams, data) {
			if(!accessScopeStr) {
				throw new Error('Missing scope');
			}
			
			accessParams.scope = accessScopeStr;
			accessParams.grant_type = 'client_credentials';
		},
		formatResponse: function(reqState, tokenResp) {
			var formattedData = tokenObjProto.formatResponse.apply(this, arguments);
			formattedData.s = reqState.accessTokenScope;
			
			return formattedData;
		},
		cache: function(tokenData) {
			if(!accessScopeStr || tokenData.s === accessScopeStr) tokenObjProto.cache.apply(this, arguments);
		}
	});
	
	ATT.accessToken = new AccessToken();
	
	function UserAuthToken(props) {
		copyObjTo(this, props);
	}
	//Extend TokenObject
	util.inherits(UserAuthToken, TokenObject, {
		formatParameters: function(accessParams, localOAuthToken) {
			accessParams.code = (typeof localOAuthToken === 'string' && localOAuthToken) || oAuthCode;
			
			if(!accessParams.code) {
				var errMsg = 'oAuthCode is ' +
						((oAuthCode === null) ? 'no longer valid' : 'undefined');
				
				throw new Error(errMsg);
			}
			
			accessParams.grant_type = 'authorization_code';
		},
		formatResponse: function(reqState, tokenResp) {
			var formattedData = tokenObjProto.formatResponse.apply(this, arguments);
			formattedData.s = reqState.userAuthScope;
			return formattedData;
		},
		cache: function(tokenData) {
			if(!authScopeStr || tokenData.s === authScopeStr) tokenObjProto.cache.apply(this, arguments);
		}
	});
	ATT.userAuthToken = new UserAuthToken();
	
	function separateScope(newScope) {
		var accessScope = {}
		,	authScope = {};
		
		newScope.split(',').forEach(function(scopeVal) {
			if(possibleAuthScope[scopeVal]) {
				authScope[scopeVal] = true;
			} else {
				accessScope[scopeVal] = true;
			}
		});
		
		return {
			accessTokenScope: Object.keys(accessScope).sort().join(','),
			userAuthTokenScope: Object.keys(authScope).sort().join(',')
		};
	}
	
	ATT.setKeys = function(newAppKey, newSecret, newScope) {
		var newScopes = separateScope(newScope)
		,	newAccessScope = (newScopes.accessTokenScope && ATT.accessToken.scope !== newScopes.accessTokenScope)
		,	newAuthScope = (newScopes.userAuthTokenScope && ATT.userAuthToken.scope !== newScopes.userAuthTokenScope);
		
		if(appKey === newAppKey && secret === newSecret && !newAccessScope && !newAuthScope) {
			return; //Nothing changed so do nothing
		}
		
		if(ATT.accessToken.key !== newAppKey || newAccessScope) {
			ATT.accessToken.clearCache();
		}
		if(ATT.userAuthToken.key !== newAppKey || newAuthScope) {
			ATT.userAuthToken.clearCache();
		}
		
		appKey = newAppKey;
		secret = newSecret;
		if(newAccessScope) {
			accessScopeStr = newScopes.accessTokenScope;
		}
		if(newAuthScope) {
			authScopeStr = newScopes.userAuthTokenScope;
		}
	};
	
	ATT.setOAuthCode = function(newCode) {
		ATT.userAuthToken.clearCache();
		oAuthCode = newCode;
	};
	
	if(has('SMS')) {
		ATT.addDefinition('SMS', new RESTfulDefinition({
			appendUrl: '/sms/v3/messaging',
			headerConfig: { 'Accept': false },
			methods: {
				'sendSMS': {
					appendUrl: '/outbox',
					method: 'POST',
					headerConfig: { 'Content-Type': true }
				},
				'getSMSDeliveryStatus': {
					appendUrl: '/outbox/:smsId',
					method: 'GET'
				},
				'getSMS': {
					appendUrl: '/inbox/:registrationId',
					method: 'GET'
				}
			}
		}));
	}
	
	if(has('MMS')) {
		ATT.addDefinition('MMS', new RESTfulDefinition({
			appendUrl: '/mms/v3/messaging/outbox',
			headerConfig: { 'Accept': false },
			methods: {
				'sendMMS': {
					method: 'POST',
					headerConfig: { 'Content-Type': true },
					useBridge: true
				},
				'getMMSDeliveryStatus': {
					method: 'GET',
					appendUrl: '/:mmsId'
				}
			}
		}));
	}
	
	
	if(has('PAYMENT')) {
		(function() {
			var paymentQSConfig = {
				'Signature'           : true,
				'SignedPaymentDetail' : true,
				'clientid'			  : { backup: function() { return appKey; }, required: true }
			};
			
			function newInteraction(formattedParams, params, successCB, failCB) {
				return formattedParams.url + '?' + formattedParams.query;
			}
			
			ATT.addDefinition('Payment', new RESTfulDefinition({
				appendUrl: '/rest/3/Commerce/Payment',
				methods: {
					'newSubscription': {
						appendUrl: '/Subscriptions',
						method: 'GET',
						tokenType: ATT.TokenType.NONE,
						executor: newInteraction,
						queryStringConfig: paymentQSConfig
					},
					'getSubscriptionStatus': {
						appendUrl: '/Subscriptions/:idType/:id',
						method: 'GET',
						headerConfig: { 'Accept': false }
					},
					'getSubscriptionDetails': {
						appendUrl: '/Subscriptions/:merchantSubscriptionId/Detail/:consumerId',
						method: 'GET',
						headerConfig: { 'Accept': false }
					},
					'newTransaction': {
						appendUrl: '/Transactions',
						method: 'GET',
						tokenType: ATT.TokenType.NONE,
						executor: newInteraction,
						queryStringConfig: paymentQSConfig
					},
					'getTransactionStatus': {
						method: 'GET',
						headerConfig: { 'Accept': false },
						appendUrl: '/Transactions/:idType/:id'
					},
					'refundTransaction': {
						appendUrl: '/Transactions/:transactionId',
						method: 'PUT',
						headerConfig: {
							'Content-Type': true,
							'Accept': false
						},
						queryStringConfig: {
							'Action': true
						}
					},
					'getNotification': {
						appendUrl: '/Notifications/:notificationId',
						method: 'GET',
						headerConfig: { 'Accept': false }
					},
					'acknowledgeNotification': {
						appendUrl: '/Notifications/:notificationId',
						method: 'PUT',
						headerConfig: { 'Accept': false }
					}
				}
			}));
		})();
	}
	
	// IMMN - This is IMMNv1
	if(has('IMMN')) {
		ATT.addDefinition('IMMN', new RESTfulDefinition({
			appendUrl: '/rest/1/MyMessages',
			headerConfig: { 'Accept': false },
			methods: {
				'sendMessage': {
					method: 'POST',
					headerConfig: {
						'Content-Type': true
					},
					tokenType: ATT.TokenType.USER,
					useBridge: true
				},
				'getMessageHeaders': {
					method: 'GET',
					tokenType: ATT.TokenType.USER,
					queryStringConfig: {
						HeaderCount: true,
						IndexCursor: false
					}
				},
				'getMessageContent': {
					method: 'GET',
					tokenType: ATT.TokenType.USER,
					appendUrl: '/:messageId/:partNumber?'
				}
			}
		}));
	}
	
	if(has('IMMNv2')) {
		ATT.addDefinition('IMMNv2', new RESTfulDefinition({
			appendUrl: '/myMessages/v2/',
			headerConfig: { 'Accept': false },
			methods: {
				'sendMessage': {
					method: 'POST',
					appendUrl:'messages',
					tokenType: ATT.TokenType.USER,
					headerConfig: {
						'Content-Type': true,
						'Content-Length': false
					},
					useBridge: true
				},
				'getMessageList': {
					method: 'GET',
					appendUrl:'messages',
					tokenType: ATT.TokenType.USER,
					queryStringConfig: {
						messageIds: false,
						isFavorite: false,
						limit: {
							backup : '500',
							required : true
						},
						offset: {
							backup: '0',
							required: true
						},
						isUnread: false,
						type: {
							backup: 'SMS,MMS'
						},
						isIncoming: false
					}
				},
				'getMessage': {
					method: 'GET',
					appendUrl:'messages/:messageId',
					tokenType: ATT.TokenType.USER,

				},
				'getMessageContent': {
					method: 'GET',
					appendUrl:'messages/:messageId/parts/:partId',
					tokenType: ATT.TokenType.USER,
				},
				'getMessagesDelta': {
					method: 'GET',
					appendUrl:'delta',
					tokenType: ATT.TokenType.USER,
					queryStringConfig: {
						state: true
					},
				},
				'updateMessages': {
					method: 'PUT',
					appendUrl:'messages',
					tokenType: ATT.TokenType.USER,
					headerConfig: {
						'Content-Type': true,
						'Content-Length': { 
							backup: function(params) {
								return params.body.length;
							},
						},

					}
				},
				'updateMessage': {
					method: 'PUT',
					appendUrl:'messages/:messageId',
					tokenType: ATT.TokenType.USER,
					headerConfig: {
						'Content-Type': true,
						'Content-Length': { 
							backup: function(params) {
								return params.body.length;
							}
						}
					}
				},
				'deleteMessages': {
					method: 'DELETE',
					appendUrl:'messages',
					tokenType: ATT.TokenType.USER,
					queryStringConfig: {
						messageIds: true
					}
				},
				'deleteMessage': {
					method: 'DELETE',
					appendUrl:'messages/:messageId',
					tokenType: ATT.TokenType.USER,
				},
				'createMessageIndex': {
					method: 'POST',
					appendUrl:'messages/index',
					tokenType: ATT.TokenType.USER
				},
				'getMessageIndexInfo': {
					method: 'GET',
					appendUrl:'messages/index/info',
					tokenType: ATT.TokenType.USER
				},
				'getNotificationConnectionDetails': {
					method: 'GET',
					appendUrl:'notificationConnectionDetails',
					tokenType: ATT.TokenType.USER,
					queryStringConfig: {
						queues: true
					}
				},
			}
		}));
	}
	
	if(has('CMS')) {
		ATT.addDefinition('CMS', new RESTfulDefinition({
			appendUrl: '/rest/1/Sessions',
			headerConfig: {
				'Content-Type': true,
				'Accept': false
			},
			methods: {
				'createSession': {
					method: 'POST'
				},
				'sendSignal': {
					method: 'POST',
					appendUrl: '/:cmsId/Signals'
				}
			}
		}));
	}
	
	if(has('ADS')) {
		ATT.addDefinition('Ads', new RESTfulDefinition({
			appendUrl: '/rest/1/ads',
			methods: {
				'getAds': {
					method: 'GET',
					headerConfig: {
						'Accept': false,
						'Udid': true
					},
					queryStringConfig: {
						Category: true,
						Gender: false,
						ZipCode: false,
						AreaCode: false,
						City: false,
						Country: false,
						Longitude: false,
						Latitude: false,
						MaxHeight: false,
						MaxWidth: false,
						MinHeight: false,
						MinWidth: false,
						Type: false,
						Timeout: false,
						AgeGroup: false,
						Over18: false,
						KeyWords: false,
						IsSizeRequired: false,
						Premium: false
					}
				}
			}
		}));
	}
	
	if(has('WAP')) {
		ATT.addDefinition('WAPPush', new RESTfulDefinition({
			appendUrl: '/1/messages/outbox/wapPush',
			methods: {
				'sendWAPPush': {
					method: 'POST',
					headerConfig: {
						'Content-Type': true,
						'Accept': false
					},
					useBridge: true
				}
			}
		}));
	}
	
	if(has('TL')) {
		ATT.addDefinition('Location', new RESTfulDefinition({
			appendUrl: '/2/devices/location',
			methods: {
				'getDeviceLocation': {
					method: 'GET',
					tokenType: ATT.TokenType.USER,
					headerConfig: {
						'Accept': false
					},
					queryStringConfig: {
						'requestedAccuracy'  : false,
						'Tolerance'			 : false,
						'acceptableAccuracy' : false
					}
				}
			}
		}));
	}
	
	function processXArgs(val, params) {
		return (typeof val === 'string') ? val : QS.stringify(val, ',');
	}
	
	if(has('SPEECH') || has('TTS') || has('STTC')) {
		ATT.addDefinition('Speech', new RESTfulDefinition({
			appendUrl: '/speech/v3/'
		}));
	}
	
	if(has('SPEECH')) {
		ATT.Speech.addMethod('speechToText', null, {
			appendUrl: 'speechToText',
			method: 'POST',
			headerConfig: {
				'Accept': false,
				'Content-Type': true,
				'Transfer-Encoding': false,
				'X-SpeechContext': false,
				'X-SpeechSubContext': false,
				'Content-Language': false,
				'Content-Length': false,
				'X-Arg': {
					postProcess: processXArgs
				}
			},
			useBridge: true
		});
		
		/*
		ATT.addDefinition('Speech', new RESTfulDefinition({
			appendUrl: '/speech/v3/speechToText',
			methods: {
				'speechToText': {
					method: 'POST',
					headerConfig: {
						'Accept': false,
						'Content-Type': true,
						'Transfer-Encoding': false,
						'X-SpeechContext': false,
						'X-SpeechSubContext': false,
						'Content-Language': false,
						'Content-Length': false,
						'X-Arg': {
							postProcess: processXArgs
						}
					},
					useBridge: true
				}
			}
		}));
		*/
	}
	
	if(has('TTS')) {
		ATT.Speech.addMethod('textToSpeech', null, {
			appendUrl: 'textToSpeech',
			method: 'POST',
			headerConfig: {
				'Accept': false,
				'Content-Type': true,
				'Content-Language': false,
				'Content-Length': { 
					backup: function(params) {
						return params.body.length;
					}
				},
				'X-Arg': {
					postProcess: processXArgs
				}
			},
			useBridge: true
		});
		
		/*
		ATT.addDefinition('TTS', new RESTfulDefinition({
			appendUrl: '/speech/v3/textToSpeech',
			methods: {
				'textToSpeech': {
					method: 'POST',
					headerConfig: {
						'Accept': false,
						'Content-Type': true,
						'Content-Language': false,
						'Content-Length': { 
							backup: function(params) {
								return params.body.length;
							}
						},
						'X-Arg': {
							postProcess: processXArgs
						}
					},
					useBridge: true
				}
			}
		}));
		*/
	}
	
	if(has('STTC')) {
		ATT.Speech.addMethod('speechToTextCustom', null, {
			appendUrl: 'speechToTextCustom',
			method: 'POST',
			headerConfig: {
				'Accept': false,
				'Content-Type': 'multipart/x-srgs-audio',
				'Transfer-Encoding': false,
				'X-SpeechContext': false,
				'Content-Language': false,
				'Content-Length': false,
				'X-Arg': {
					postProcess: processXArgs
				}
			},
			useBridge: true
		});
	}
	
	ATT.addDefinition('Notary', new RESTfulDefinition({
		appendUrl: '/Security/Notary/Rest/1/SignedPayload',
		methods: {
			'signedPayload': {
				method: 'POST',
				headerConfig: {
					'Accept': false,
					'Content-Type': true,
					'Client_id': true, 
					'Client_secret': true
				},
				//TODO: Verify that this logic is correct...
				executor: function(formattedParams, params) {
					var token = ATT.accessToken.token;
					
					if(token && params.headers['Content-Type'] === constants.header.contentType.JSON
							&& util.getFromObject(params, 'body.MerchantPaymentRedirectUrl'))
					{
						params.body.MerchantPaymentRedirectUrl += "?token=" + token;
					}
					
					return formattedParams;
				}
			}
		}
	}));
	
	return ATT;
});