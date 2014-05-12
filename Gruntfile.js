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
      'js/att.js',
      'js-shared/js/utils.js',
      'js-shared/js/LogManagerModule.js',
      'js/ErrorDictionaryModule.js',
      'js/resourceManagerModule.js',
      'js/adapter.js',
      'js/appConfigModule.js',
      'js-shared/js/utils.js',
      'js-shared/js/restClient.js',
      'js/APIConfigs.js',
      'js-shared/js/eventEmitter.js',
      'js/userMediaServiceModule.js',
      'js/peerConnectionServiceModule.js',
      'js/CallManagementModule.js',
      'js/eventChannel.js',
      'js/RTCEventModule.js',
      'js/eventDispatcher.js',
      'js/signalingServiceModule.js',
      'js/attEnum.js',
      'js/SDPFilterModule.js',
      'js/RTCEventModule.js',
      'js/webRTC.js',
      'js/DHSModule.js',
      'js/ATTMain.js',
      'js/sdkErrors.js',
      'test/**/*.js'],
    logLevel: 'DEBUG',
    port: 9876,
    browsers: ['Chrome'],
    captureTimeout: 60000
  },
    karmaConfigUnit = {
      preprocessors: {
        'js/**/*.js': 'coverage'
      },
      reporters: ['spec', 'coverage'],
      colors: true,
      singleRun: false,
      usePolling: true,  // This is required on linux/mac. See bug: https://github.com/karma-runner/karma/issues/895
      coverageReporter : {
        type : 'html',
        dir : 'coverage/'
      }
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
      autoWatch: false,
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
    }
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // you can run `grunt karma` to execute the config file specified
    // equivalent to `karma start <config file>
    karma: {
      unit: { options: karmaConfigUnit },
      jenkins: { options: karmaConfigJenkins }
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

  grunt.registerTask('default', ['karma:jenkins', 'jslint']);
};
