'use strict';

//This module provides basic utility functions that att uses.

define(function(require, exports, module) {
	
	var slice = Array.prototype.slice;
	var apply = Function.prototype.apply;
	var call = Function.prototype.call;
	
	function forEach(obj, func, scope) {
		if(typeof obj === 'object' && obj !== null) {
			var myScope = scope || obj;
			if(obj.forEach) {
	            if(obj.every) { //implements an alternative forEach with stop
	            	var stop;
	            	obj.every(function() {
	            		stop = func.apply(this, arguments);
	                    return stop !== undefined;
	            	}, myScope);
	            	return stop;
	            } else {
	            	obj.forEach.call(obj, func, scope);
	            }
	        } else {
	            for(var key in obj) {
	                if(obj.hasOwnProperty(key)) {
	                    var stop = func.call(myScope, obj[key], key, obj);
	                    if(stop) return stop;
	                }
	            }
	        }
	    }
	};
	exports.forEach = forEach;

	//Copies properties of the following objects to the toObj
	function copyObjTo(toObj) {
	    var copyObjs = slice.call(arguments, 1).reverse();
	    copyObjs.forEach(function(fromObj) {
	        forEach(fromObj, function(val, key){
	            toObj[key] = val;
	        });
	    });
	    return toObj;
	};
	exports.copyObjTo = copyObjTo;
	
	function isEmptyString(s) {
		return s === null || s === undefined || s === '';
	}
	
	function buildParams(paramConfigs, values, data) {
		var newParams = {};
		if(!values) values = {};
		
		forEach(paramConfigs, function(paramConfig, paramKey) {
			if(paramConfig === undefined) return;
			
			var paramVal = generateParamVal(values[paramKey], paramKey, paramConfig, data);
			if(!isEmptyString(paramVal)) {
				newParams[paramKey] = paramVal;
			}
		});
		
		return newParams;
	}
	exports.buildParams = buildParams;
	
	/**
	 * Parameter Config Object
	 * @param paramConfig {String/Object} - If a string is passed, the string is assumed to be the backup value
	 * @param paramConfig.paramKey {String} - key in the supplied params object
	 * @param paramConfig.backup {String/function(params, paramConfig)} - backup value if not in params, 
	 *        if it's a function, passes the params and paramConfig to generate the params
	 * @param paramConfig.required - {Boolean} if true, returns an error if not defined
	 * @param paramConfig.postProccess {function(val, params, paramConfig)} - method to run on the method value
	 * @param paramConfig.suffix {String} - text to add on the end of the header value
	 * @param paramConfig.prefix {String} - text to add to the beginning of the header value
	 * @param paramConfig.validate {function(val, params, paramConfig)} - should return an error if not valid
	 */
	
	function generateParamVal(val, key, paramConfig, data) {
		var paramConfigType = typeof paramConfig;
		if(paramConfigType === 'string' || paramConfigType === 'function') paramConfig = { backup: paramConfig };
		else if(paramConfigType === 'boolean') paramConfig = { required: paramConfig };
		
		if(!val && paramConfig.backup) {
			var backupType = typeof paramConfig.backup;
			if(backupType === 'function') {
				val = paramConfig.backup(data, paramConfig);
			} else if(backupType === 'string') {
				val = paramConfig.backup;
			}
		}
		
		if(paramConfig.postProcess) val = paramConfig.postProcess(val, data, paramConfig);
		
		val = val || '';
		if(paramConfig.prefix) val = paramConfig.prefix + val;
		if(paramConfig.suffix) val += paramConfig.suffix;
		
		if(!val && paramConfig.required) {
			var paramString = key ? ' "' + key + '"' : '';
			throw new Error('Required parameter' + paramString + ' is undefined');
		}
		
		if(paramConfig.validate) {
			//validate should throw if it fails
			paramConfig.validate(val, data, paramConfig);
		}
		
		return val;
	}
	
	var qs = exports.queryString = exports.qs = {};
	
	function addKeyValToArray(arr, key, val, assignmentVal) {
		arr.push(encodeURIComponent(key) + assignmentVal + encodeURIComponent(val));
	}
	
	//Stringify an object into a queryString
	function queryStringStringify(flatObj, delimiter, assignment) {
		if(typeof flatObj !== 'object') {
			return '';
		}
		
		var qsArr = [], assignmentVal = (typeof assignment === 'string') ? assignment : queryStringStringify.defaultAssignment;
        forEach(flatObj, function(val, key) {
        	if(isEmptyString(val)) return;
        	
        	if(Array.isArray(val)) {
        		qsArr.push(queryStringStringify.stringifyArray(key, val, delimiter, assignmentVal));
        	} else {
        		addKeyValToArray(qsArr, key, val, assignmentVal);
        	}
        });
        
        if(qsArr.length === 0) return '';
        
        return qsArr.join((typeof delimiter === 'string') ? delimiter : queryStringStringify.defaultDelimiter);
	};
	
	//Stringifies an array for a given key
	queryStringStringify.stringifyArray = function(key, arr, delimiter, assignment) {
		//The method ATT restful calls handles arrays
		var qsArr = [], assignmentVal = (typeof assignment === 'string') ? assignment : queryStringStringify.defaultAssignment;;
		arr.forEach(function(val, i) {
			addKeyValToArray(qsArr, key, val, assignmentVal);
		});
		return qsArr.join((typeof delimiter === 'string') ? delimiter : queryStringStringify.defaultDelimiter);
	};
	
	queryStringStringify.defaultDelimiter = '&';
	queryStringStringify.defaultAssignment = '=';
	
	qs.stringify = queryStringStringify;
	
	
	//Parses a queryString into a flat object
	function queryStringParse(qsString, delimiter, assignment) {
		var qsObj = {}, 
			assignmentVal = (typeof assignment === 'string') ? assignment : queryStringStringify.defaultAssignment,
			qsArr = qsString.split((typeof delimiter === 'string') ? delimiter : queryStringStringify.defaultDelimiter);
		
		qsArr.forEach(function(qsPart) {
			var components = qsPart.split(assignmentVal);
			if(components.length !== 2) return;
			
			var key = decodeURIComponent(components[0]),
				val = decodeURIComponent(components[1]),
				currentVal = qsObj[key];
			
			//Note: duplicates represent an array of values
			if(currentVal) {
				if(Array.isArray(currentVal)) {
					currentVal.push(val);
				} else {
					qsObj[key] = [currentVal, val];
				}
			} else {
				qsObj[key] = val;
			}
		});
		
		return qsObj;
	}
	queryStringParse.defaultDelimiter = '&';
	queryStringParse.defaultAssignment = '=';
	qs.parse = queryStringParse;
	
	
	function buildQueryString(allQSConfig, params, data) {
		return qs.stringify(buildParams(allQSConfig, params, data));
	}
	qs.buildFromConfig = buildQueryString;
	
	
	function getFromObject(obj, keyPath) {
		if(obj == null) return obj;
		
		var keyParts = keyPath.match(/(.*?)\.(.*)/);
		if(!keyParts) {
			return obj[keyPath];
		}
		
		var currentKey = keyParts[1];
		var otherKeys = keyParts[2];
		
		return getFromObject(obj[currentKey], otherKeys);
	}
	
	exports.getFromObject = function(obj, keyPath) {
		return getFromObject(obj, keyPath + '');
	};
	
	exports.arrayToHash = function() {
		return slice.call(arguments).reduce(function(totalHash, arr) {
			return arr.reduce(function(h, k) { h[k] = true; return h; }, totalHash);
		}, {});
	};
	
	//Needed to call functions on Titanium objects
	exports.apply = function(scope, method, args) {
		var myMethod = (typeof method === 'string') ? scope[method] : method;
		return apply.call(myMethod, scope, args);
	};
	
	var camelCase = exports.camelCase = function(str) {
		if(typeof str !== 'string') str += '';
		
		return str[0].toLowerCase() + str.slice(1);
	};
	
	var keysToCamelCase = exports.keysToCamelCase = function(obj) {
		if(Array.isArray(obj)) {
			return obj.map(keysToCamelCase);
		} else if(typeof obj !== 'object' || obj.toString() !== '[object Object]') {
			return obj;
		}
		
		var newObj = {};
		forEach(obj, function(val, key) {
			newObj[camelCase(key)] = keysToCamelCase(val);
			return false;
		});
		return newObj;
	};
	
	var capitalize = exports.capitalize = function(word) {
		return word[0].toUpperCase() + word.slice(1);
	};
	
	var log = exports.log = function() {
		console.log.apply(console, arguments);
	};
	
	var inherits = exports.inherits = function(NewClass, SuperClass, props) {
		NewClass.prototype = new SuperClass();
		NewClass.prototype.constructor = NewClass;
		SuperClass.prototype.super_ = SuperClass; //Similar to node.js
		copyObjTo(NewClass.prototype, props);
	};
});
