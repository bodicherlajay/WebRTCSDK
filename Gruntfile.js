/*jslint indent: 2*/
/*global module*/
module.exports = function (grunt) {
  'use strict';

  var unitTestFiles = [
      'test/test.att.utils.sdk-errors.js',
      'test/test.att.config.api.js',
      'test/test.att.config.app.js',
      'test/test.att.resource-manager.js',
      'test/test.att.enum.js',
      'test/test.att.utils.error-dictionary.js',
      'test/test.att.event-manager.js',
      'test/test.att.rtc-manager.js',
      'test/test.att.rtc-manager.conference.js',
      'test/test.att.peer-connection.js',
      'test/test.att.call.js',
      'test/test.att.call.pcv2.js',
      'test/test.att.call.conference.js',
      'test/test.att.session.js',
      'test/test.att.utils.event-channel.js',
//      'test/test.att.peer-connection-service.js',
//      'test/test.att.signaling.service.js',
//      'test/test.att.utils.sdp-filter.js',
//      'test/test.att.user-media-service.js',
      'test/test.att.rtc.js',
      'test/test.att.rtc.phone.conference.js',
      'test/test.att.rtc.phone.js',
      'test/test.att.rtc.phone.pcv2.js',
      'test/test.att.rtc.phone.addcall.js',
      'test/test.att.rtc.phone.answer.secondcall.js',
//      'test/test.att.rtc.dhs.js',
      // 'test/test.att.main.js',
      'test/test.att.phonenumber.js'
    ],
    srcFiles = [
      'js/att.init.js',
      'lib/vendor/SDPParser.js',
      'lib/js-shared/js/*.js',
      'js/att.utils.sdp-filter.js',
      'js/att.phonenumber.js',
      'js/att.special-numbers.js',
      'js/att.enum.js',
      'js/att.config.api.js',
      'js/att.config.app.js',
      'js/att.utils.sdk-errors.js',
      'js/att.utils.api-errors.js',
      'js/att.utils.error-dictionary.js',
      'js/att.error.js',
      'js/att.rtc.js',
      'js/att.resource-manager.js',
      'js/att.utils.event-channel.js',
      'js/att.event-manager.js',
      'js/att.rtc-manager.js',
      'js/adapter.js',
      'js/att.signaling-service.js',
      'js/att.user-media-service.js',
      'js/att.peer-connection-service.js',
      'js/att.peer-connection.js',
      'js/att.call.js',
      'js/att.session.js',
      'js/att.rtc.dhs.js',
      'js/att.rtc.phone.js',
      'js/att.main.js'
    ],
    karmaConfig = {
      basePath: '.',
      frameworks: ['mocha', 'chai', 'sinon'],
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
    karmaConfigConcat = Object.create(karmaConfigUnit),
    karmaConfigMin = Object.create(karmaConfigUnit),
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

  // Copy generic options to all other configurations
  for (attrname in karmaConfig) {
    if (karmaConfig.hasOwnProperty(attrname)) {
      // copy all properties from the Global config to the Jenkins config
      karmaConfigJenkins[attrname] = karmaConfig[attrname];
      // copy all properties from the Global config to the Unit Testing config
      karmaConfigUnit[attrname] = karmaConfig[attrname];
      karmaConfigConcat[attrname] = karmaConfig[attrname]; // tests concatenated file
      karmaConfigMin[attrname] = karmaConfig[attrname]; // test minified file
      // copy all properties from the Global config to the Coverage config
      karmaConfigCoverage[attrname] = karmaConfig[attrname];
    }
  }

  // Karma Tests for Jenkins
  karmaConfigJenkins.files = srcFiles.concat(unitTestFiles);

  // Karma tests for all files
  karmaConfigUnit.files = srcFiles.concat(unitTestFiles);

  // Karma tests for concatenated single file
  karmaConfigConcat.files = ([ 'dist/<%= pkg.name %>.js' ]).concat(unitTestFiles);

  // Karma tests for minified single file
  karmaConfigMin.files = ([ 'dist/<%= pkg.name %>.min.js' ]).concat(unitTestFiles);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      jsdoc: {
        files: [
          '../../../README.md',
          'js/att.rtc.phone.js',
          'js/att.session.js',
          'js/att.rtc.dhs.js'],
        tasks: ['jsdoc']
      }
    },
    jslint: {
      // lint your project's server code
      server: {
        src: ['js/**/*.js', 'test/**/*.js'],
        exclude: ['test/qunit*.js'],
        options: {
          failOnError: false,
          log: 'out/jslint/jslint.log',
          checkstyle: 'out/jslint/jslint.xml' // write a checkstyle-XML
        }
      }
    },
    jsdoc: {
      dist: {
        src: [
          '../../../README.md',
          'js/att.rtc.phone.js',
          'js/att.rtc.dhs.js'],
        options: {
          destination: 'doc',
          template : 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template',
          configure : 'jsdoc.conf.json'
        }
      }
    },
    // Concatenate all source files into a single JS file.
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: srcFiles,
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    // Minify concatenated file.
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %>_<%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          // IN = concat:dist:dest, OUT = dis/pkg.name.min.js
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    compress: {
      main: {
        options: {
          mode: 'gzip'
        },
        files: [
          {
            expand: true,
            src: ['dist/<%= pkg.name %>.min.js']
          }
        ]
      }
    },
    // you can run `grunt karma` to execute the config file specified
    // equivalent to `karma start <config file>
    karma: {
      unit: { options: karmaConfigUnit },
      concat: { options: karmaConfigConcat },
      min: { options: karmaConfigMin },
      jenkins: { options: karmaConfigJenkins },
      coverage: { options: karmaConfigCoverage }
    }
  });

  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['karma:jenkins', 'jslint']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('test:concat', ['concat', 'karma:concat']);
  grunt.registerTask('test:min', ['concat', 'uglify', 'karma:min']);
  grunt.registerTask('release', ['concat', 'uglify']);
};
