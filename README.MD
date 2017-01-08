# ![Logo](https://github.com/northmccormick/firebase-qh/blob/master/logo.png?raw=true)

A light weight wrapper for Firebase Queue to give you a slightly opinionated but fast way to use the queue.

[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](http://forthebadge.com)

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

var handlers = {
	someAction: function(res) {
		res.resolve();
		return false;
	}
};

var userQueue = new QHQueue({
	firebaseRef: ref,
	name: 'users',
	handlers: userHandlers,
	resolveKey: 'usersResolve',
	debug: true
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

| Property | Type | Brief Description | Required |
| ------------- | ------- | ------------- | -----:|
| firebaseRef | Object | The firebase database reference object | Yes |
| name | String | The name of the key to use for the queue | Yes |
| handlers | Object | The object with functions for each action the queue can process as the key | Yes |
| resolveKey | String | The key to use when writing data for the client to read | No |
| debug | Boolean | Whether to show the debug logs in the console or not | No |

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

### Wiring Up The Client

So you're probably wondering by now "how the heck do I make this work?", well lets dive in.

Remember, the idea of this tool is to mitigate the need for a REST interface and make the developer's life much easier. 

*Note, the rest of this guide assumes that you are using the root database object, if you are using a child of that, you will need to refactor any examples here for your needs. The examples are also using the web SDK, if you're using java or swift for your clients, adjust your code accordingly*

Firebase Queues by default listen to the `tasks` child of the queue path chosen. FQH will create your queue off of the `queue` node. In this example our queue name is `users`. The path to push a request to the queue will be `/queue/users/tasks`.

The request object has two pieces: `data` and `action`. The `action` is what we want the queue to do when it gets the request, and the `data` is any necessary information such as the user id, meta data you might need, user input, etc. Here's an example of a request to set up our user's profile.

```js
var requestData = {
	action: 'createUser',
	data: {
		username: 'NorthMcCormick',
		uid: '2gq9VYiWBKS57WPJsv3sahgKs9v1',
		profilePicture: 'data:image/png,TG9sIGknbSBpbXByZXNzZWQgeW91IHRvb2sgdGhlIHRpbWUgdG8gZGVjb2RlIHRoaXM='
	}
}

var refRequest = ref.child('queue/users/tasks').push();
refRequest.set(requestData);

```

And that's all you have to do on the clients end to write to the queue. 

### More about handlers

Handlers are the actual logic you write to get your queue to process a request. In the example above we sent a request with the action `createUser`. We will now define a handler object, that has a property with that same name that can process the request. Here's our starting point:

```js
var handlers = {
	createUser: function(res) {
		res.resolve();

		return false;
	}
}
```

As you might notice, we already have something we can use: `res`! I have chosen to use `res` as shorthand for `resources`. You can use whatever you would like. This `res` object contains some vital pieces. It will be how we send progress updates, resolve, reject, get the queue settings, and most importantly get our data from the request!

Here is what it looks like:

```js
{
	data: { // The data from our request
		username: 'NorthMcCormick',
		uid: '2gq9VYiWBKS57WPJsv3sahgKs9v1',
		profilePicture: 'data:image/png,TG9sIGknbSBpbXByZXNzZWQgeW91IHRvb2sgdGhlIHRpbWUgdG8gZGVjb2RlIHRoaXM='
	},
	progress: function(){}, // This is how we update the request's progress
	resolve: function(){}, // This is how we resolve, or finish, the request
	reject: function(){}, // This is how we reject the request
	ref: new Firebase(), // This is our Firebase database reference that we set when we created the queue
	meta: { // This will hold other bits of data we may need
		resolveKey: 'usersResolve' 
	}
}
```

Right now our handler doesn't do anything but resolve itself. We want our handler to create a new object in our database that stores this user's information in a secure place where not even they can edit it so that when we send push notifications (for example) we know that we are using the client's real username and not something they may have tampered with.

```js
var handlers = {
	createUser: function(res) {
		res.ref.child('usersPrivate').child(res.data.uid).set({
			username: res.data.username,
			profilePicture: res.data.profilePicture
		}).then(function() {
			res.resolve();

			return false;
		}, function(error) {
			res.reject(error);
			return false;
		});
	}
}
```

Excellent! Because this node has no client read/write access we know that the data can't be maliciously changed. This is also the place where you could write in more complex validation. 

We keep returning false, though... Why?

### Queue Resolving

So we set the username and profile picture for this user, but did you see that hidden piece of code that generates them a referral code?

```js
var handlers = {
	createUser: function(res) {
		res.ref.child('usersPrivate').child(res.data.uid).set({
			username: res.data.username,
			profilePicture: res.data.profilePicture
		}).then(function() {

			var referralCode = Utils.generateReferralCode();

			res.resolve();

			return false;
		}, function(error) {
			res.reject(error);
			return false;
		});
	}
}
```

We need a way to get this referral code back to the client. They're expecting it:

```js
var requestData = {
	action: 'createUser',
	data: {
		username: 'NorthMcCormick',
		uid: '2gq9VYiWBKS57WPJsv3sahgKs9v1',
		profilePicture: 'data:image/png,TG9sIGknbSBpbXByZXNzZWQgeW91IHRvb2sgdGhlIHRpbWUgdG8gZGVjb2RlIHRoaXM='
	}
}

var refRequest = ref.child('queue/users/tasks').push();
refRequest.set(requestData);

// Listen on the resolve node for the referral code to show the user!

var referralRef = ref.child('queueResolves/usersResolve/' + refRequest.key);
referralRef.on('value', function(snapshot) {
	console.log('We got the referral code: ' + snapshot.val());

	referralRef.off();
});

```

*Note that path for the resolve. By default FQH will use `queueResolves` as the root for all the resolves. Earlier we set the option `resolveKey` to `usersResolve`, so as a user that is where we will want to look. If you leave `resolveKey` blank, you should not resolve any data.*

Returning `false`, `null`, or `undefined` here will tell FQH to not write to the resolve path, up to this point we have been doing just that. Lets change it.

```js
var handlers = {
	createUser: function(res) {
		res.ref.child('usersPrivate').child(res.data.uid).set({
			username: res.data.username,
			profilePicture: res.data.profilePicture
		}).then(function() {

			var referralCode = Utils.generateReferralCode();

			res.resolve();

			return {
				referralCode: referralCode
			};
		}, function(error) {
			res.reject(error);
			return false;
		});
	}
}
```

Now FQH will resolve the queue item and then write the referral code to the path. We are still returning `false` for the error handler, here you could create an object with a pattern that your app follows to define errors in case the username is taken, profile picture is in an incorrect format, etc. 

## Roadmap

What I'm looking at implementing for my own software and that will probably translate into this tool. Issue requests might land here too, who knows!

### Planned

##### Automatic queue item expiration/cleanup

Have the tool automatically clean up or retry requests in the queues

##### Adding more options

A lot of this stuff can be refactored to be options, so that will probably happen as people request it






























