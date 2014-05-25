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
      'lib/vendor/SDPParser.js',
      'lib/js-shared/js/*.js',
      'js/att.utils.sdk-error-store.js',
      'js/att.utils.error-dictionary.js',
      'js/att.main.js',
      'js/att.config.api.js',
      'js/att.resource-manager.js',
      'js/att.config.app.js',
      'js/att.enum.js',
      'js/att.call-manager.js',
      'js/eventDispatcher.js',
      'js/RTCEventModule.js',
      'js/adapter.js',
      'js/att.user-media-service.js',
      'js/SDPFilterModule.js',
      'js/signalingServiceModule.js',
      'js/att.error.js',
      'js/att.peer-connection-service.js',
      'js/att.rtc.dhs.js',
      'js/att.utils.event-channel.js',
      'js/att.rtc.phone.js',
      // TESTS
      'test/test.att.utils.sdk-error-store.js',
      'test/APIConfigTest.js',
      'test/resourceManagerTest.js',
      'test/attEnumTest.js',
      'test/ATTMainTest.js',
      'test/CallManagementModuleTest.js',
      'test/ErrorDictionaryModuleTest.js',
      'test/eventChannelTest.js',
      'test/eventDispatcherTest.js',
      'test/test.att.peer-connection-service.js',
      'test/RTCEventModuleTest.js',
      'test/signalingServiceModuleTest.js',
      'test/SDPFilterModuleTest.js',
      'test/userMediaServiceModuletest.js',
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
      usePolling: true  // This is required on linux/mac. See bug: https://github.com/karma-runner/karma/issues/895
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

  grunt.registerTask('default', ['karma:jenkins', 'jslint']);
};
