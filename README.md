# WebRTC JavaScript SDK

[![Build Status](http://ec2-54-85-119-205.compute-1.amazonaws.com:8080/buildStatus/icon?job=webrtc-sdk develop)](http://ec2-54-85-119-205.compute-1.amazonaws.com:8080/job/webrtc-sdk%20develop/)

This is the main repo for the AT&T's WebRTC SDK.

# Quickstart

* Install dependencies: `$ npm install`

# Using the SDK in your app

For examples on how to use the SDK go to: [attdevsupport/webrtc-sample-aps](https://github.com/attdevsupport/webrtc-sample-apps).


## Grunt Tasks

Before being able to use the tasks you must:

* Install Grunt CLI globally: `$ npm install -g grunt-cli`
* Install dependencies: `$ npm install`

### Available tasks

* Lint your file with JSLint: `$ grunt jslint`
* Generate API Documentation (JSDoc): `$ grunt jsdoc`
* Unit Tests the whole sources in separate files: `$ grunt test`
* Unit Tests Concatenated file: `$ grunt test:concat`
* Unit Tests Minified file: `$ grunt test:min`
* Unit Tests Minified file (only for Jenkins): `$ grunt karma:jenkins`
* Create new release: `$ grunt release`

See the `Gruntfile.js` for more details.

## Directory structure

* `/js`: Sources for the SDK components
* `/test`: Test for the SDK components
