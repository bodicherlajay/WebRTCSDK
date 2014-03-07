'use strict';

define(['att/ajax', 'att/main'], function(ajax, ATT) {
	
	//TODO Modify the ajax.settings.bridgeFunction to be the interface 
	
	ajax.settings.bridgeFunction = function bridgeFunction(params, successCB, failCB) {
		/**
		 * TODO Pass the params down into the bridge using the Worklight interface
		 * 
		 * For a good example of how PhoneGap plugin was implemented, See "extensions/phonegap.js" 
		 * in this project and in PhoneGap project "PhoneGap/android/SDKPlugIn/ATT-Android-Phonegap-Adapter".
		 * These files show how the js communicates the params down to the Java Library using
		 * the platform specific interface.
		 * 
		 * Reference:
		 * http://docs.phonegap.com/en/2.5.0/guide_plugin-development_index.md.html#Plugin%20Development%20Guide
		 * http://docs.phonegap.com/en/2.5.0/guide_plugin-development_android_index.md.html#Developing%20a%20Plugin%20on%20Android
		 */
	};
	ajax.settings.isBridgeFunction = function(params) {
		return params.useBridge;
	};
	
	return ATT;
});
