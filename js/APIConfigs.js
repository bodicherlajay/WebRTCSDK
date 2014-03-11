var ATT = ATT || {};
(function (ATT) {

	var APIConfigs = {
		// Configuration for the DHS endpoint
		login: {
			method: 'post',
			url: 'http://localhost:3000' // change to the login endpoint on the DHS
		}
	};

	ATT.APIConfigs = APIConfigs;
}(ATT || {}))