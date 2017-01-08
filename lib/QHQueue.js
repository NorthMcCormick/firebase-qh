var Queue = require('firebase-queue');

var ref = null;
var queue = null;
var queueName = null;
var queueOptions = {};

var resolveKey = null;
var debugMode = false;

var handlers = {};

var handleRequest = function(data, progress, resolve, reject) {
	// 	Object Structure
	// 	{
	// 		"action": "action-to-perform",
	//   	"data": "any meta data including user information"
	// 	}
		
	logDebug('Handling request');

	logDebug(data);

	if(handlers[data.action] !== undefined) {
		try {
			var shouldResolve = handlers[data.action]({
				data: data.data,
				progress: progress,
				resolve: resolve,
				reject: reject,
				ref: ref,
				meta: {
					resolveKey: resolveKey
				}
			});
		} catch(e) {
			logError('Could not handle due to an unexpected error in the handler');
			logError(e);
		}

		if(shouldResolve !== false) {
			// TODO: Handle a custom resolve, post data to the resolve endpoint for the client to consume, maybe handle a timeout here?
		}
	}else{
		logError('Could not handle action: ' + data.action);

		resolve();
	}
};

function logError(error) {
	if(debugMode) {
		console.error(error);
	}
}

function logDebug(error) {
	if(debugMode) {
		console.log(error);
	}
}

function QHQueue(_queueOptions) {

	if(_queueOptions.debug !== undefined) {
		debugMode = _queueOptions.debug;
	}

	logDebug('Creating queue');
	logDebug(_queueOptions);

	// Required
	if(_queueOptions.firebaseRef !== undefined) {
		ref = _queueOptions.firebaseRef;
	}else{
		throw 'QHQueue options is missing a value for "firebaseRef"';
	}

	if(_queueOptions.name !== undefined) {
		queueName = _queueOptions.name;
	}else{
		throw 'QHQueue options is missing a value for "name"';
	}

	if(_queueOptions.handlers !== undefined) {
		handlers = _queueOptions.handlers;
	}else{
		throw 'QHQueue options is missing a value for "handlers"';
	}

	// Optional
	if(_queueOptions.resolveKey !== undefined) {
		resolveKey = _queueOptions.resolveKey;
	}

	if(_queueOptions.options !== undefined) {
		queueOptions = _queueOptions.options;
	}

	logDebug('Queue created');
}

QHQueue.prototype.listen = function() {
	queue = new Queue(ref.child('queue').child(queueName), queueOptions, function(data, progress, resolve, reject) {
		// TODO: CHECK FOR MALFORMED TASK AND RESOLVES
		handleRequest(data, progress, resolve, reject);
	});
};

QHQueue.prototype.getQueue = function() {
	return queue;
};

QHQueue.prototype.setDebugMode = function(shouldDebug) {
	debugMode = shouldDebug;
};

module.exports = QHQueue;