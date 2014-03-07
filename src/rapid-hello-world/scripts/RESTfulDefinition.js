'use strict';

/** @class RESTfulDefinition
 *  @description This Object is core of the API Layer.  It is designed to take API configurations
 *  	and perform common operations/validations/setup for each API to prepare the parameters for the 
 *  	Ajax Layer.  It uses a tree like structure to organize common APIs
 *  
 *  @method addDefinition {function(name, newObject)} - Attaches a new child RESTfulDefinition/ATTMethod to the current RESTfulDefinition.
 *  @method addMethod {function(name, method, params)} - Attaches a new child ATTMethod to the current RESTfulDefinition.
 *  @method getRoot {function(): RESTfulDefinition} - returns the root of the RESTfulDefinition tree
 *  @method forEachToRoot {function(func, scope)} - Simulates a Array.forEach function running from child to the root object
 *
 *  @method getHeaderConfig {function(): Object} - builds and returns config objects for headers for the given RESTfulDefinition
 *  @method getQueryStringConfig {function(): Object} - builds and returns config objects for query strings for the given RESTfulDefinition
 *	@method getUrlParamsConfig {function(): Object} - builds and returns config objects for URL parameters for the given RESTfulDefinition
 *	
 *	@method getHeaders {function(ajaxParams) : String} - Given ajax params, this returns a header object based on the total headerConfig
 *  			of the given RESTfulDefinition
 *  @method getQueryString {function(ajaxParams) : String} - Given ajax params, this returns a query string based on the total queryStringConfig
 *  			of the given RESTfulDefinition
 *  @method getUrl {function(ajaxParams) : String} - Given ajax params, this returns a URL string based on the total urlParamsConfig's
 *  			and total inferUrlParamsConfig which is generated from appendUrl's of the given RESTfulDefinition
 *  
 *  @method executor {function(attMethod, params, successCB, failCB) : result } - This is a pass-through method that is used
 *  			to run common operations based on the attMethod and params.  By default, it calls the parent executor but it
 *  			can be used to intercept and handle the request itself.
 *
 *  @param [appendUrl] {String} - URL fragment that is appended to the parent's appendUrl in getUrl
 *  @param [headerConfig] {Object} - Configuration object for the headers.
 *  @param [queryStringConfig] {Object} - Configuration object for the query string.
 *	@param [urlParamsConfig] {Object} - Configuration object for parameters in the URL.
 *  @param [methods] {Object} - temporary config object that sets up the ATTMethod branches on this object, deleted after setup
 *  
 */
/** Function ATTMethod extends RESTfulDefinition
 *  Branches of the ATT module tree, used create HTTP method calls.  The functions are defined
 *  by function([paramsObj], successCBFunc, failCBfunc)
 *  
 *  @method executor {Function} - This method can hold unique commands for the method but must be called by parent executors
 *  @param method - the HTTP method to be used, e.g. 'GET' or 'POST'
 *  @param authType - Determines what type of token is fetched and used for the request
 *  
 *  @returns Object
 *  @params active - active xhr or jqXHR request
 *  @params data - if executor returns data, it can be fetched here
 *  @params error - if an error occured, The object will be displayed here
 */

define(function(require, exports, module) {
	var util = require('util')
	,   copyObjTo = util.copyObjTo
	,   forEach = util.forEach
	,   buildParams = util.buildParams
	,   qs = util.qs
	,   constants = require('constants');
	
	
	//Sets up a basic ATT Object used for constructing our ATT method tree
	function RESTfulDefinition(props) {
		copyObjTo(this, props);
	}
	copyObjTo(RESTfulDefinition.prototype, {
		addDefinition: function(name, newObject) {
			if(!(newObject instanceof RESTfulDefinition) && typeof newObject !== 'function') {
				throw new Error('Only RESTfulDefinition or ATTMethod can be added with this method');
			}
			
			var objPath = name.split('.'),
				objName = objPath.pop(),
				target = this;
			
			objPath.forEach(function(pathObjName) {
				if(!target[pathObjName]) target[pathObjName] = new RESTfulDefinition();
				target = target[pathObjName];
			});
			
			forEach(newObject.methods, function(methodConfig, methodName) {
				newObject.addMethod(methodName, methodConfig.executor, methodConfig);
			});
			delete newObject.methods;
			
			target[objName] = newObject;
			newObject.parent = this;
		},
		addMethod: function(methodName, newMethod, props) {
			if(arguments.length < 3 && typeof newMethod === 'object') {
				var tmpMethod = props; //Ensure we use the correct undefined
				props = newMethod;
				newMethod = tmpMethod;
			}
			
			function ATTMethod(params, successCB, failCB) {
				if(arguments.length < 3) {
					failCB = successCB;
					successCB = params;
					params = {};
				}
				
				return ATTMethod.parent.executor(ATTMethod, params, successCB, failCB);
			}
			copyObjTo(ATTMethod, props, RESTfulDefinition.prototype, RESTfulDefinition.defaultMethodParams);
			ATTMethod.executor = newMethod;
			ATTMethod.methodName = methodName && methodName.match(/\.?([^.]*)$/)[1];
			
			this.addDefinition(methodName, ATTMethod); //This method adds the parent reference
		},
		forEachToRoot: function(func, scope) {
			var currentNode = this, depth = 0, myScope = scope || this;
			do {
				func.call(myScope, currentNode, depth++);
				currentNode = currentNode.parent;
			} while(currentNode);
		},
		getUrl: function(params) {
			var url = (this.parent ? this.parent.getUrl() : '') + (this.appendUrl || '');
			
			if(params) {
				var regex = this.getUrl.paramsRegex
				,	urlParams = buildParams(this.inferUrlParamsConfig(), params[constants.paramKey.URL_PARAMS], params);
				
				url = url.replace(regex, function(p, $1, $2, $3, i, w) {
					var urlParam = urlParams[$2];
					return ($3 && !urlParam) ? '' : $1 + urlParam;
				});
			}
			
			return url;
		},
		getHeaders: function(params) {
			return buildParams(this.getHeaderConfig(), params[constants.paramKey.HEADERS], params);
		},
		getQueryString: function(params) {
			return qs.buildFromConfig(this.getQueryStringConfig(), params[constants.paramKey.QUERY], params);
		},
		getRoot: function() {
			var root;
			this.forEachToRoot(function(currentNode) {
				root = currentNode;
			});
			return root;
		},
		executor: function() { //Default executor
			if(this.parent) return this.parent.executor.apply(this.parent, arguments);
		},
		inferUrlParamsConfig: function() {
			var regex = this.getUrl.paramsRegex;
			
			//Infers a urlParamConfig based on the url string
			var inferredUrlParamConfig = {};
			this.getUrl().replace(regex, function(p, $1, $2, $3, i, w) {
				inferredUrlParamConfig[$2] = !$3;
				return '';
			});
			
			return copyObjTo(inferredUrlParamConfig, this.getUrlParamsConfig());
		}
	});
	
	['headerConfig', 'queryStringConfig', 'urlParamsConfig'].forEach(function(configType) {
		var getMethodName = 'get' + configType[0].toUpperCase() + configType.substr(1);
		RESTfulDefinition.prototype[getMethodName] = function() {
			if(!this.parent) return this[configType];
			return copyObjTo({}, this.parent[getMethodName].apply(this.parent, arguments), this[configType]);
		};
	});
	
	//Expects the following format: '/path/:param1/:param2/:param3?'
	RESTfulDefinition.prototype.getUrl.paramsRegex = /(\/):([^\/?]*)(\?$)?/g;
	
	RESTfulDefinition.defaultMethodParams = {};
	
	module.exports = RESTfulDefinition;
});