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
      'js/att.config.api.js',
      'js/att.resource-manager.js',
      'js/att.config.app.js',
      'js/att.enum.js',
      'js/att.event-manager.js',
      'js/att.rtc-manager.js',
      'js/att.call.js',
      'js/att.session.js',
      'js/eventDispatcher.js',
      'js/att.rtc.event.js',
      'js/adapter.js',
//      'js/att.user-media-service.js',
      'js/att.utils.sdp-filter.js',
      'js/att.signaling-service.js',
      'js/att.error.js',
      'js/att.peer-connection-service.js',
      'js/att.rtc.dhs.js',
      'js/att.utils.event-channel.js',
      'js/att.rtc.phone.js',
//      'js/att.main.js',
      'js/att.phonenumber.js',
      'js/att.special-numbers.js',
      // TESTS
//      'test/test.att.utils.sdk-error-store.js',
//      'test/test.att.config.api.js',
//      'test/test.att.resource-manager.js',
//      'test/test.att.enum.js',
      'test/test.att.event-manager.js',
      'test/test.att.call.js',
      'test/test.att.session.js',
//      'test/test.att.rtc-manager.js',
//      'test/test.att.utils.error-dictionary.js',
//      'test/test.att.utils.event-channel.js',
//      'test/test.att.peer-connection-service.js',
//      'test/test.att.rtc.event.js',
//      'test/test.att.signaling.service.js',
//      'test/test.att.utils.sdp-filter.js',
//      'test/test.att.user-media-service.js',
      'test/test.att.rtc.phone.js'
//      'test/test.att.rtc.dhs.js',
//      'test/test.att.main.js',
//      'test/test.att.phonenumber.js'
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
      exclude: ['js/adapter.js'], // google's code.
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
          failOnError: false,
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
