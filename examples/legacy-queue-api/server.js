var Firebase = require('firebase'),
	QHQueue = require('../../index.js').QHQueue,
	QHConfig = require('../../index.js').QHConfig,
	userHandlers = require('./handlers/userHandlers.js'),
	config = require('./creds.json');

var ref = new Firebase('https://' + config.firebaseLink + '.firebaseio.com/');

// Creating our queue
var userQueue = new QHQueue({
	firebaseRef: ref,
	name: 'users',
	handlers: userHandlers,
	responseKey: 'users'
});

ref.authWithCustomToken(config.firebaseKey, function(error, authData) {
	if(error) {
		console.log('Error');
		console.log(error);
	}else{
		console.log('Authed');

		// Tell the queue to start listening for requests
		userQueue.listen();
	}
});

/*	To make this work use the Firebase CLI and login to your account
 *	and then run a command like this
 * 	firebase database:push /queue/users/tasks
 *
 *	And use this data as the input
 *
 * 	{
 *		"action": "createUser",
 *		"data": {
 *			"foo": "bar"
 *		}
 *	}
 */