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
        options: {
          log: 'jslint.log',
          checkstyle: 'jslint.xml' // write a checkstyle-XML
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
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['jslint', 'karma:continuous', 'concat', 'uglify']);
};