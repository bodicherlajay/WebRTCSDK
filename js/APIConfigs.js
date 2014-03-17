/**
	WebRTC API REST configuration file.
	All configured methods will be placed in the ATT.WebRTCAPI namespace.
*/
var ATT = ATT || {};
(function (app) {

	var APIConfigs = {
		// Configuration for the DHS endpoint
		login: {
			method: 'post',
			url: 'http://localhost:8080/user/authenticate', // change to the login endpoint on the DHS
			headers: {'Content-type': 'application/json','Accept' : 'application/json'}
		},
		logout: {
			method: 'delete',
			url: 'http://localhost:8080/user/logout', // change to the logout endpoint on the DHS
			headers: {'Content-type': 'application/json','Accept' : 'application/json'}
		},
		getSession: {
			method: 'get',
			url: 'http://localhost:8080/user/session',
			headers: {'Content-type': 'application/json','Accept' : 'application/json'}
		}
	};

	app.APIConfigs = APIConfigs;
}(ATT || {}));
