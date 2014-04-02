// Jenkins Karma configuration
// Coppied from karma.config.js 
// Tune and maintain as needed... -GW

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '.',


    // frameworks to use
    frameworks: ['mocha', 'chai', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      'js-shared/js/restClient.js',
      'js/webRTC.js',
      'js/APIConfigs.js',
      'js-shared/js/eventEmitter.js',
      'js/eventChannel.js'
      'js/signalingServiceModule.js',
      // 'js/**/*.js',
      'test/**/*.js'
    ],


    // list of files to exclude
    exclude: [
      
    ],
   
    //Preprocessors for code coverage 
    preprocessors: {
      'js/**/*.js': 'coverage'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['junit', 'coverage'],


    //JUnit report args
    junitReporter: {
      outputFile: 'results.xml'
    },

    //Coverage report    
    coverageReporter: {
      type : 'cobertura',
      dir : 'coverage/',
      file: 'coverage.xml'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: false,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Firefox','Chrome'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};