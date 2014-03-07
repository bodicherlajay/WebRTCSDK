
define('abstract', ['att'], function(att) {
	att.foo = 'blah';
	
	var ATT = {
		SMS: {
			sendSMS: function(params, success, fail) {
				rawParams = {};
				
				function handleRawSuccess(data, response, ajax) {
					structuredResp = {};
					
					success.call(this, structuredResp);
					
				}
				
				att.SMS.sendSMS(rawParams, handleRawSuccess, fail);
			}
		}
	};
	
	return ATT;
});