var Firebase = require('firebase'),
	QHConfig = require('../../index.js').QHConfig,
	QHManager = require('../../index.js').QHManager,
	userHandlers = require('./handlers/userHandlers.js'),
	config = require('./creds.json');

var ref = new Firebase('https://' + config.firebaseLink + '.firebaseio.com/');

var QueueManager = new QHManager();

// Creating our queue using the manager
var userQueue = QueueManager.createQueue({
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

		// Tell all the queues we have to start listening
		QueueManager.listenOnAllQueues();
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