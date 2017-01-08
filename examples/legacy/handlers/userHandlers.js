var QHResponse = require('firebase-qh').QHResponse;

module.exports = {
	sampleAction: function(res) {
		/* 	res: {
				data: data.data,
				progress: progress,
				resolve: resolve,
				reject: reject,
				ref: ref,
				meta: {
					responseKey: responseKey
				}
			}*/

		// Return 'false', 'null', or 'undefined' to not write to any response paths
		// Return an instance of QHResponse to post a response back to the client
	},
	createUser: function(res) { // Handle creating our users
		console.log('Do our user creation stuff here with this data: ' + JSON.stringify(res.data));

		var fakeReferralCode = 'US80KW';

		res.resolve();

		return new QHResponse({
			referralCode: fakeReferralCode
		});
	}
}