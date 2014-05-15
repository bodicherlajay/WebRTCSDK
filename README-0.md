**Optional: Markdown Viewer (Chrome Extension)**

For a **much better reading experience** open this file with a Markdown Viewer.

One option is to use a Chrome Extension like [this one](https://chrome.google.com/webstore/detail/markdown-viewer/ehnambpmkdhopilaccgfmojilolcglhn).

0. Install the Chrome extension from the previous URL
1. Go to `chrome://extensions/` in Chrome
2. Find the _Markdown Viewer_ extension and check the `Allow access to file URLs`
3. Open this file using Chrome (open a new tab and just drag it there)

# JavaScript SDK for AT&T WebRTC API
**WARNING: THIS DOCUMENT IS FOR INTERNAL DISTRIBUTION ONLY**

This package contains software and documentation for **SVT1-MVP1** release of JavaScript SDK for AT&T WebRTC API (_JS SDK_)

# Contents of this package

* `/webrtc-dhs`: Software to run Sample DHS Server in NodeJ
* `/webrtc-dhs/sample-app`: Software to run Sample WebRTC
* `/webrtc-dhs/sample-app/docs/common.html`: Tutorial: How to use the JS SDK.
* `/webrtc-dhs/sample-app/lib/webrtc-sdk`: Core JS SDK
* `/html-docs`: JS SDK API reference documentation


# Using the Sample Application

This is a guide to setup AT&T's WebRTC sample application for developers to use as a reference
implementation so that they may learn from and base their own application implementations on.

## Summary

* Enroll in the [AT&T Developer program (_F6 UAT_)](http://devpgm-app02.eng.mobilephone.net)
* Create your application in the developer portal and generate application key/secret.
* Configure the application using your application key/secret generated above as well as some additional
configuration (see below).
* Run `npm` (Node Package Manager) in the /webrtc-dhs directory.
* Start the DHS (Developer Hosted Server).
* Launch browser to run the sample application.

## 1. Enrolling and Creating your WebRTC Application.

Before you can access the AT&T Platform services, you must enroll in AT&T's Developer Program, then register your
application for the services that you want to access and to get an API key and
secret key. These keys are necessary to call the underlying AT&T RESTful APIs
that access the services.

### 1.1. Enrolling in the Developer Program

1. Create a new developer account on the [AT&T Developer program (_F6 UAT_)](http://devpgm-app02.eng.mobilephone.net), or login to
an existing account.
2. Request _Premium Access_ for your account from the CTS Middleware Data Team.

### 1.2. Creating your own WebRTC application
**Prerequisite**: An AT&T Developer Account with _Premium Access_

Perform the following steps to register an application:

1. Sign In to your AT&T Developer Account created in the previous section.
2. Go to _Manage my Account_
3. Select _My Apps_ from the bar at the top of the page (right-most orange button). You'll be redirected here to [your apps](https://devpgm-apimatrix-f6.mars.bf.sl.attcompute.com/?)
5. Click _Setup a New Application_
6. Chose the scopes you want your application to support:
  * WEBRTCMOBILE
  * WEBRTC
  * E911

After your application is registered, you have an API Key and Secret key. These
keys are necessary to get your applications working with the AT&T Platform
APIs.

## 2. Installing System Requirements

Refer to the online documentation to install these dependencies for your system.

* [Download MongoDB v2.4.10](https://www.mongodb.org/downloads)
* [Download NodeJS v0.10.26](http://nodejs.org/download/)

### Supported Broswers
  * Chrome for OSX (v34.0.1847.131)
  * Firefox for OSX (v28.0)

## 3. Setting up the DHS

### 3.1 Using your Application Key and Secret

* Open file  `/webrtc-dhs/js/config.js`
* Add your application's `ClientID` and `ClientSecret` in the `oAuthServers` variable:

```
oAuthServers.F6UAT.ClientID = 'YOUR ClientID'
oAuthServers.F6UAT.ClientSecret = 'YOUR ClientSecret'
```

### 3.2 Install DHS Dependencies
In a terminal run `npm install` at inside the DHS directory:
```bash
$ cd webrtc-dhs
# Install the NodeJS packages necessary to run the DHS
$ npm install
...
```

## 4. Start MongoDB and the DHS

### 4.1 Start MongoDB
Refer to the MongoDB documentation for your operating system.

**Note**: Be sure to create the temp directory per the installation instructions.

### 4.2 Start the DHS

Make sure to use the sample application using an internet connection that's not restricted.
Change to the `/webrtc-dhs` directory and do:

```bash
cd webrtc-dhs
$ node server.js
```

You should see output similar to the following:

```bash
DHS Starting server in default env configuration
DHS Server is now listening on port 9000
DHS Server mounting sample apps on: /home/.../webrtc-dhs/js./../../webrtc-sample-apps/sdk-sample-apps
DB Server connection is now opens
DB Server connection open to mongodb://localhost/test
```

## 5. Load the Sample Application

### 5.1 Open Chrome with web security disabled

Open your Chrome Browser using the following command:

#### Windows
`chrome.exe --user-data-dir="C:/Chrome dev session" --disable-web-security`
#### Linux
`$ google-chrome --disable-web-security`
#### OSX
`$ open -a Google\ Chrome --args --disable-web-security`

##### Related Links: Disabling Web Security
* [Chrome](http://stackoverflow.com/q/3102819/400544)
* [Firefox](http://stackoverflow.com/a/18495435/400544).

### 5.2 Load the database with users

Go to `http://localhost:9000/setup/load`

If successful, you will see a JSON object displayed in the browser:

```json
{
  result: "Success",
  loadedObjects: {
    ...
  }
}
```

### 5.3 Load the application

Go to `http://localhost:9000` to load the application.

# 6. Acronyms and Terminology

* API: Application Programming Interface
* FVT: Function Verification Test
* GA: General Availability
* DHS: Developer Hosted Server
* ICMN: In-App Calling for Mobile Number
* JS: JavaScript
* MVP: Minimum Viable Product
* SDK: Software Development Kit
* SVT: Service Verification Test
* WebRTC: Web Real-Time Communications, a W3C standard
