/*jslint indent: 2*/
/*global module*/
module.exports = function (grunt) {
  'use strict';

  var karmaConfig = {
    basePath: '.',
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      {
        pattern: 'fixtures/**/*.html',
        included: true
      },
      'js/att.init.js',
      'lib/js-shared/js/*.js',
/*
      'js/att.utils.sdk-error-store.js',
      'js/adapter.js',
      'js/error.js',
      'js/resourceManagerModule.js',
      'js/CallManagementModule.js',
      'js/DHSModule.js',
      'js/userMediaServiceModule.js',
      'js/signalingServiceModule.js',
      'js/peerConnectionServiceModule.js',
      'js/webRTC.js',
      'js/eventChannel.js',
      'js/attEnum.js',
      'js/SDPFilterModule.js',
      'js/SDPParser.js',
      'js/eventDispatcher.js',
      'js/RTCEventModule.js',
      'js/appConfigModule.js',
      'js/APIConfigs.js',
      'js/ErrorDictionaryModule.js',
      'js/ATTMain.js',
*/
      'js/att.utils.sdk-error-store.js',
      'js/ErrorDictionaryModule.js',
      'js/ATTMain.js',
      'js/APIConfigs.js',
      'js/resourceManagerModule.js',
      'js/appConfigModule.js',
      'js/attEnum.js',
      'js/appConfigModule.js',
      'js/CallManagementModule.js',
      'js/eventDispatcher.js',
      'lib/vendor/SDPParser.js',
      'js/RTCEventModule.js',
      'js/adapter.js',
      'js/userMediaServiceModule.js',
      'js/SDPFilterModule.js',
      'js/signalingServiceModule.js',
      'js/peerConnectionServiceModule.js',
      'js/error.js',
      'js/DHSModule.js',
      'js/eventChannel.js',
      'js/webRTC.js',
      //test load order
      'test/test.att.utils.sdk-error-store.js',
      'test/attEnumTest.js',
      'test/APIConfigTest.js',
      'test/ATTMainTest.js',
      'test/resourceManagerTest.js',
      'test/RTCEventModuleTest.js',
      'test/eventDispatcherTest.js',
      'test/SDPParserTest.js',
      'test/SDPFilterModuleTest.js',
      'test/signalingServiceModuleTest.js',
      'test/userMediaServiceModuletest.js',
      //'test/peerConnectionServiceModuleUnitTest.js',
      'test/webRTCTest.js'
    ],
    logLevel: 'INFO',
    port: 9876,
    browsers: ['Chrome'],
    captureTimeout: 60000
  },
    karmaConfigCoverage = {
      preprocessors: {
        'js/**/*.js': 'coverage'
      },
      reporters: [ 'coverage' ],
      singleRun: false,
      usePolling: true,  // This is required on linux/mac. See bug: https://github.com/karma-runner/karma/issues/895
      coverageReporter : {
        type : 'html',
        dir : 'coverage/'
      }
    },
    karmaConfigUnit = {
      reporters: ['spec'],
      colors: true,
      singleRun: false,
      usePolling: true,  // This is required on linux/mac. See bug: https://github.com/karma-runner/karma/issues/895
    },
    karmaConfigJenkins = {
      preprocessors: {
        'js/**/*.js': 'coverage'
      },
      junitReporter: {
        outputFile: 'out/junit/results.xml'
      },
      reporters: ['junit', 'coverage'],
      coverageReporter: {
        type : 'cobertura',
        dir : 'coverage/',
        file: 'coverage.xml'
      },
      colors: false,
      autoWatch: true,
      singleRun: true
    },
    attrname;

  // little utility to merge options
  for (attrname in karmaConfig) {
    if (karmaConfig.hasOwnProperty(attrname)) {
      // copy all properties from the Global config to the Jenkins config
      karmaConfigJenkins[attrname] = karmaConfig[attrname];
      // copy all properties from the Global config to the Unit Testing config
      karmaConfigUnit[attrname] = karmaConfig[attrname];
      // copy all properties from the Global config to the Coverage config
      karmaConfigCoverage[attrname] = karmaConfig[attrname];
    }
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // you can run `grunt karma` to execute the config file specified
    // equivalent to `karma start <config file>
    karma: {
      unit: { options: karmaConfigUnit },
      jenkins: { options: karmaConfigJenkins },
      coverage: { options: karmaConfigCoverage }
    },
    jslint: {
      // lint your project's server code
      server: {
        src: ['js/**/*.js', 'test/**/*.js'],
        options: {
          log: 'out/jslint/jslint.log',
          checkstyle: 'out/jslint/jslint.xml' // write a checkstyle-XML
        }
      }
    },
    jsdoc: {
      dist: {
        src: ['js/**/*.js', 'README.md'],
        options: {
          destination: 'doc'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('default', ['jslint', 'karma:jenkins']);
};
