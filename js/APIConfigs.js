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
			headers: {'Accept': 'application/json'}
		},
		logout: {
			method: 'delete',
			url: 'http://localhost:8080/user/authenticate', // change to the login endpoint on the DHS
			headers: {'Accept': 'application/json'}
		}
	};

	app.APIConfigs = APIConfigs;
}(ATT || {}))