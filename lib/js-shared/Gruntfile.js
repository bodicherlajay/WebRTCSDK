/*jslint indent:2, todo:true*/
/*global module*/
module.exports = function (grunt) {
  'use strict';
  var karmaConfig = {
    basePath: '.',
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      'test/init.js',
      'js/**/*.js',
      'test/**/*.js'
    ],
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
      usePolling: true,
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
      unit: {
        options: karmaConfigUnit,
        autoWatch: true
      },
      jenkins: {
        options: karmaConfigJenkins
      }
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
    // Concatenate all source files into a single JS file.
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['js/**/*.js'],
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
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-jslint');
  // grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  //TODO: uglify
  grunt.registerTask('default', ['jslint', 'karma:jenkins', 'concat']);//, 'uglify']);
};