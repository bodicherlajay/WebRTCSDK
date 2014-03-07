// This is all client code included in index.html

require(['RESTfulDefinition', 'ajax'], 
	function(RESTfulDefinition, ajax) {

	// define the executor
    function baseExecutor(attMethod, params, successCB, failCB) {
		console.log('My executor');

		ajax.settings= {
			getXHR: function() {
				try {
					return new XMLHttpRequest();
				} catch(e) {}
			} 
		};

		// return false for web apps, true is only necessary for 
		// hybrid apps (Phonegap, Titanium, etc)
		ajax.settings.isBridgeFunction = function(params) {
										 	 return false;
										 };

		// do the actual ajax call
		ajax(params,successCB,failCB);
	}
	
	// configuration for the RESTful definition
	var ATT = new RESTfulDefinition({
		executor: baseExecutor
	});

	// utils
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

	ATT.setProtocol('http://');
	ATT.setDomain('localhost:7070'); 

	// This is the actual API REST specification
	ATT.addDefinition('MyHelloAPI', new RESTfulDefinition({
		appendUrl: '', 
		methods: {
			'helloJSMethod': {
				appendUrl: '/hello', // this is being ignored somehow
				method: 'GET' // this is being ignored
			}
		}
	}));

	// call method
	ATT.MyHelloAPI.helloJSMethod(
		{'url' : 'hello', method: 'GET'}, // this doesn't belong here but it works
		function(data) { // success callback
				var responseString= JSON.stringify(data);
				console.log('Response : ' + responseString);
				alert('Got \n' + responseString + '\nfrom: GET /hello');
			}, function(error) { // failure callback
				console.log('Error : ' + error);
			});

    return { main: 'This is the main module' };// random object, never used
});