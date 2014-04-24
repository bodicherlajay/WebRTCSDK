/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam: true*/
/*global ATT:true, logManager, beforeEach, describe, it, assert, expect, done*/

describe('LogManagerModule', function () {
  "use strict";

  describe('Application Object', function () {
    var logManager;
    beforeEach(function () {
      logManager = ATT.logManager.getInstance();
    });

    it('should have factory method', function () {
      expect(ATT.logManager).to.be.a('object');
    });

    it('should configure a logger', function () {
      expect(logManager.configureLogger('Test', logManager.loggerType.CONSOLE, logManager.logLevel.DEBUG)).equals(true);
    });

    it('should return a configured logger', function () {
      if (logManager.configureLogger('Test', logManager.loggerType.CONSOLE, logManager.logLevel.DEBUG)) {
        expect(logManager.getLogger('Test')).to.be.a('object');
      }
    });

    it('should log msg', function () {
      if (logManager.configureLogger('Test', logManager.loggerType.CONSOLE, logManager.logLevel.DEBUG)) {
        var logger = logManager.getLogger('Test');
        logger.logDebug("Test Msg");
      }
    });
  });
});
