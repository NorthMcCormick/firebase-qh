# ![Logo](https://github.com/northmccormick/firebase-qh/blob/master/logo.png?raw=true)

A light weight wrapper for Firebase Queue to give you a slightly opinionated but fast way to use the queue.

## How Is Firebase Queue Handler (FQH) Opinionated?

FQH started with the idea that you can let the client write to a queue node without read access, process the request in node, and then write the results to a resolved node in the database. FQH eliminates/minimizes/bypasses the need to set up a REST API server to process requests and instead has the client interfacing with the database the entire time. 

It might not be for everybody.

## Install

```
$ npm install --save firebase-qh
```

## Usage

```js
const QHQueue = require('firebase-qh');

var userQueue = new QHQueue({
	debug: true,
	firebaseRef: ref,
	name: 'users',
	handlers: userHandlers,
	resolveKey: 'usersResolve'
});

//
// Authenticate your server or do any set up here
//

userQueue.listen();

// Your queue is now ready to process incoming requests!

```

## API

### QHQueue([options])

#### options

##### firebaseRef

*Required*

Type: `Firebase Database Ref`

The firebase database reference to use.

This typically should be the root reference (such as `admin.database()` or `new Firebase('https://my-firebase-db.firebaseio.com/')`) since this will be an object passed to the rest of the queue handler. If you specify it as child of the root, everything will be relative to that child.

##### name

*Required*

Type: `string`

This is the name of node/key to use. FQH will create the queue listening from `queue/your-name-here/tasks`

Example: If the name is `users`, the queue will listen on `queue/users/tasks`

##### handlers

*Required*

Type: `Object`

This is where the magic happens in the queue handler. Define your functions that the queue will execute based on the action you send it. The action and the name of the function need to match. (Note: add a link to that section here) 

Example: Lets say we need to send an email once the user is signed up. The client will write to the queue node, and then the queue will take over. We used the action 'createUser', which we have defined below.

```js
var handlers = {
	createUser: function(res) {
		// Do your creating, validating, emailing, etc

		res.resolve();

		return false;
	}
}
```

The queue will get this request, process it, and then resolve the queue item. Now if we send a request with the action `removeUser` the queue will gracefully refuse the request, log a message, and then resolve the item so it doesn't linger in the queue. (Todo: make this a setting later on)

##### resolveKey

Type: `string`<br>
Default: `""`

FQH has a mechanism to take data from the handler and post it to a node with a specified name using the key created by the queue. This is how a client can listen for and retrieve data coming from the queue if needs be. More details later in this readme.

##### debug

Type: `boolean`<br>
Default: `false`

Set debug logs to be on/off from the start for the queue.

















