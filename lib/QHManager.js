var	QHQueue = require('./QHQueue.js'),
	QHConfig = require('./QHConfig.js');

var queues = [];
var queuesMap = {};

function QHManager() {

}

// TODO: Create queues from a file or array

QHManager.prototype.createQueue = function(_options) {
	if(queuesMap[_options.name] === undefined) {
		queues.push(new QHQueue(_options));

		queuesMap[_options.name] = queues.length - 1;

		return queues[queues.length - 1];
	}else{
		return false;
	}
};

// TODO: Make this a promise that can be wtached
QHManager.prototype.listenOnAllQueues = function() {
	queues.forEach(function(queue) {
		if(!queue.isListening()) {
			queue.listen();
		}
	})
};

QHManager.prototype.getQueue = function(name) {
	if(queuesMap[name] !== undefined) {
		return queues[queuesMap[name]];
	}else{
		return false;
	}
};

// TODO: Make this a promsie that can be watched
QHManager.prototype.getAllQueues = function() {
	var queuesObj = {};

	Object.keys(queuesMap).forEach(function(key) {
		queuesObj[key] = queues[queuesMap[key]];
	});

	return queuesObj;
};

// TODO: Make this a promise that can be watched 
QHManager.prototype.shutdownAllQueues = function() {
	queues.forEach(function(queue) {
		if(queue.isListening()) {
			queue.shutdown();
		}
	})
};

module.exports = QHManager;