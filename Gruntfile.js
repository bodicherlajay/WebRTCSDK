module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // you can run `grunt karma` to execute the config file specified
    // equivalent to `karma start <config file>
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        autoWatch: true
      },
      continuous: {
        configFile: 'jenkins-karma.config.js',
        singleRun: true
      }
    },
    jslint: {
      // lint your project's server code
      server: {
        src: ['js/**/*.js'],
        exclude: ['js/adapter.js'],
        options: {
          log: 'jslint.log',
          checkstyle: 'jslint.xml' // write a checkstyle-XML
        }
      }
    },
    jsdoc: {
        dist: {
            src: ['js/**/*.js'],
            options: {
                destination: 'doc'
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('default', ['jslint', 'karma:continuous']);
};
