/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam: true*/
/*global ATT:true, logManager, beforeEach, describe, it, assert, expect, done, sinon, before*/

describe.only('LogManagerModule', function () {
  "use strict";

  var logManager;

  before(function () {
    logManager = ATT.logManager.getInstance();
  });

  describe('Application Object', function () {
    it('should have a logManager', function () {
      expect(ATT.logManager).to.be.a('object');
    });
  });

  describe('Log Manager Singleton', function () {

    describe('Methods', function () {

      it('addLoggerForModule', function () {
        expect(logManager.addLoggerForModule).to.be.a('function');
      });

      it('getLoggerByName', function () {
        expect(logManager.getLoggerByName).to.be.a('function');
      });
      it('updateLogLevel', function () {
        expect(logManager.updateLogLevel).to.be.a('function');
      });
    });
    it('should configure a new logger', function () {
      var result = logManager.configureLogger('NewLogger',
        logManager.loggerType.CONSOLE, logManager.logLevel.DEBUG);
      expect(result).to.equal(true);
    });

    it('should throw an error if trying to configure an exising logger?');
    it('should return true if the logger already exists for a given module');

    it('should return a previously configured logger', function () {
      var logger;
      // configure a logger
      logManager.configureLogger('moduleZ',
          logManager.loggerType.CONSOLE,
          logManager.logLevel.DEBUG);
      // try to get the logger just configured
      logger = logManager.getLogger('moduleZ');
      expect(logger).to.be.a('object');
      expect(logger.level()).to.equal(logManager.logLevel.DEBUG);
      expect(logger.type()).to.equal(logManager.loggerType.CONSOLE);
    });
    it('should throw error? if the logger not found');
    it('should return undefined if the logger not found');
    it('should allow changing the global log level');

    describe('Logger', function () {
      var logger, theMessage;

      beforeEach(function () {
        logManager.configureLogger('Test',
            logManager.loggerType.CONSOLE, logManager.logLevel.DEBUG);
        logger = logManager.getLogger('Test');
        theMessage = 'Test Msg';
      });

      it('should log a DEBUG message', function () {
        var spy = sinon.spy(console, 'log');

        logger.logDebug(theMessage);
        expect(spy.calledWithMatch('[DEBUG] ' + theMessage)).to.equal(true);
        console.log.restore();
      });

      it('should log a DEBUG message with filename and line number', function () {
        var spy = sinon.spy(console, 'log');

        logger.logDebug(theMessage);
        //check the line number of the logger.logdebug in previous line
        expect(spy.calledWithMatch('LogManagerModuleTest.js:80')).to.equal(true);
        console.log.restore();
      });

      it('should use the global level instead of it\'s own');
      it('should not log messages in a different level than it\'s own');
    });
  });
});
