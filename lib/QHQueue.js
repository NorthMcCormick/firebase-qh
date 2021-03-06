var Queue = require('firebase-queue');
var QHConfig = require('./QHConfig.js');

var ref = null;
var queue = null;
var queueName = null;
var queueOptions = {
	sanitize: false
};

var responseKey = null;
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
			var response = handlers[data.action]({
				data: data.data,
				progress: progress,
				resolve: resolve,
				reject: reject,
				ref: ref,
				meta: {
					responseKey: responseKey
				}
			});

			if(!response.then) {
				logDebug('Not a promise');

				if(response) {
					// Should be an instance of QHResponse;
					logDebug('Handling Response');
					logDebug(response);
					ref.child(QHConfig.queueResponsePath).child(responseKey).child(data._id).set(response.data);
				}

			}else{
				response.then(function(_response) {
					if(responseKey !== null) {
						if(_response) {
							// Should be an instance of QHResponse;
							logDebug('Handling Response');
							logDebug(_response);
							ref.child(QHConfig.queueResponsePath).child(responseKey).child(data._id).set(_response.data);
						}
					}else{
						logError('Attempted to respond to a request without having a responseKey set');
					}
				});
			}
		} catch(e) {
			logError('Could not handle due to an unexpected error in the handler');
			logError(e);
		}
	}else{
		logError('Could not handle action: ' + data.action);

		resolve();
	}
};

function logError(error) {
	console.error(error);
}

function logDebug(message) {
	if(debugMode) {
		console.log(message);
	}
}

function QHQueue(_queueOptions) {

	if(_queueOptions.debug !== undefined) {
		debugMode = _queueOptions.debug;
	}

	logDebug('Creating queue');
	logDebug(_queueOptions);

	if(_queueOptions.firebaseRef !== undefined) {
		ref = _queueOptions.firebaseRef;
	}else{
		if(QHConfig.firebaseRef !== null) {
			ref = QHConfig.firebaseRef;
		}else{
			throw 'QHQueue options or QHConfig is missing a value for "firebaseRef"';
		}
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
	if(_queueOptions.responseKey !== undefined) {
		responseKey = _queueOptions.responseKey;
	}else{
		responseKey = queueName;
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

QHQueue.prototype.isListening = function() {
	if(queue === null) {
		return false;
	}

	return true;
};

QHQueue.prototype.getQueue = function() {
	return queue;
};

QHQueue.prototype.setDebugMode = function(shouldDebug) {
	debugMode = shouldDebug;
};

QHQueue.prototype.shutdown = function() {
	queue.shutdown().then(function() {
		logDebug('Queue ' + queueName + ' has been shut down');
		queue = null;
	});
};

module.exports = QHQueue;