var ATT = ATT || {};
(function (app) {

	var APIConfigs = {
		// Configuration for the DHS endpoint
		login: {
			method: 'post',
			url: 'http://localhost:8080/user/authenticate', // change to the login endpoint on the DHS
			headers: {'Accept': 'application/json'}
		}
	};

	app.APIConfigs = APIConfigs;
}(ATT || {}))