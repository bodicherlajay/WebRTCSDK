/** @namespace ATT */

define('att', ['require', 'exports', 'module'], function(require, exports, module)
{
	var rawAtt = require('att/main'); 
	var ATT = {};
	
	function exists(thing) 
	{
	   return (typeof (thing) !== 'undefined');	
	}
	
	function getCommonHeaders(params, advancedParams)
	{
		var headers = {};
		if(exists(advancedParams) && exists(advancedParams.headers))
		{
			headers = advancedParams.header;
		}
		
		if(!exists(headers.Authorization) && exists(params.accessToken)) 
		{
			headers.Authorization = "Bearer  " + params.accessToken;
		}
		if(!exists(headers.Content-Type))
		{
			headers['Content-Type'] = "application/json";
		}
		if(!exists(headers.Accept))
		{
			headers.Accept = "application/json";
		}
	}
	
	/** @module SMS */
	if(has('SMS'))
	{
		ATT.SMS = {
			/** @function sendSMS 
			 *  @param {object} params An object containing the method parameters
			 *  @param {string} params.accessToken A string containing the access token from OAuth getAccessToken()
			 *  @param {string} params.address A comma separated list of phone numbers that receive the message
			 *  @param {string} params.message A string containing the message to send to all addresses
			 *  @param {boolean} [params.notifyDeliveryStatus] Request delivery status.  @default false 
			 *  @param {method} success A success callback method
			 *  @param {method} fail A failure callback method
			 *  @param {object} advancedParams An object to provide access to any http components in the REST request 
			 * */
			'sendSMS': function(params, success, fail, advancedParams)
			{
				var rawParams = {};
				
				rawParams.headers = getCommonHeaders(params, advancedParams);
				
				if(!exists(rawParams.body))
				{
					rawParams.body = { "outboundSMSRequest" :{}};
					rawParams.body.outboundSMSRequest.address = params.address;
					rawParams.body.outboundSMSRequest.message = params.message;
					if(exits(params.notifyDeliveryStatus)) 
					{
						rawParams.body.outboundSMSRequest.notifyDeliveryStatus = params.notifyDeliveryStatus;
					}
				} else {
					rawParams.body = advancedParams.body;
				}
				
				var localSuccess = function(response)
				{
					var localResp = {};
					localResp.messageId = response.outboundSMSResponse.messageId;
					if(exists(response.outboundSMSResponse.resourceReference)) 
					{
						localResp.resourceURL = response.outboundSMSResponse.resourceReference.resourceURL;
					}
					success(localResp);
				}
				
				var localFail = function(response)
				{
					fail(response);  // TODO: What is the format of ATT failure, not spec defined.
				}
				
				rawAtt.SMS.sendSMS(rawParams, success, fail);
			},
			'getSMSDeliveryStatus': function(params, success, fail)
			{
				var rawParams = {};
				
				rawParams.headers = getCommonHeaders(params, advancedParams);

				// TODO: Sort out specifics 
				
				var localSuccess = function(response)
				{
					success(response);
				}
				
				var localFail = function(response)
				{
					fail(response);  // TODO: What is the format of ATT failure, not spec defined.
				}
				att.SMS.getSMSDeliveryStatus(rawParams, localSuccess, localFail);
			},
			'getSMS': function(params, success, fail)
			{
				var rawParams = {};
				
				rawParams.headers = getCommonHeaders(params, advancedParams);

				// TODO: Sort out specifics 
				var localSuccess = function(response)
				{
					success(response);
				}
				
				var localFail = function(response)
				{
					fail(response);  // TODO: What is the format of ATT failure, not spec defined.
				}				
				att.SMS.getSMSDeliveryStatus(rawParams, success, fail);
			},
		};
	}
});