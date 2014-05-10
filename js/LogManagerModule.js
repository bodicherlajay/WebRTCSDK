/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam:true*/
/*global error:true, ATT:true, define:true */

(function () {
  'use strict';

  var typeofWindow,
    logManager = {},
    instance,
    loggersCollection = [];

  // types of loggers
  logManager.LOGGER_TYPE = {
    CONSOLE: 'Console',
    FILE: 'File'
  };
  // levels for logging
  logManager.LOG_LEVEL = {
    ERROR: 0,
    WARNING: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
  };

  function createConsoleLogger(spec) {
    var level = spec.level, type = spec.type;
    return {
      type: function () {
        return type;
      },
      level: function () {
        return level;
      },
      logInfo: function (msg) {
        if (msg === undefined || msg.length === 0) { return; }
        if (level >= logManager.LOG_LEVEL.INFO) {
          console.log('[INFO]' + msg);
        }
      },
      logDebug: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (level >= logManager.LOG_LEVEL.DEBUG) {
          console.log('[DEBUG]' + msg);
        }
      },
      logWarning: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (level >= logManager.LOG_LEVEL.WARNING) {
          console.log('[WARN]' + msg);
        }
      },
      logError: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (level >= logManager.LOG_LEVEL.ERROR) {
          console.log('[ERROR]' + msg);
        }
      },
      logTrace: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (level >= logManager.LOG_LEVEL.TRACE) {
          console.log('[TRACE]' + msg);
        }
      },
      setLevel: function (newLevel) {
        level = newLevel;
      },
      setType: function (newType) {
        type = newType;
      }
    };
  }


    //todo file logger
  function configureLogger(moduleName, type, level) {
    var clogger = loggersCollection[moduleName];
    if (clogger) {
      return;
    }
    if (type === logManager.LOGGER_TYPE.CONSOLE) {
      clogger = createConsoleLogger({ level: level, type: type });
    }
    loggersCollection[moduleName] = clogger;
    return true;
  }

  function getLogger(moduleName) {
    var clogger = loggersCollection[moduleName];
    if (!clogger) {
      throw new Error('Logger not found');
    }
    return clogger;
  }

  function init() {
    return {
      getLogger: getLogger,
      configureLogger: configureLogger,
      loggerType: logManager.LOGGER_TYPE,
      logLevel: logManager.LOG_LEVEL
    };
  }

  logManager.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  if (typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = logManager;
  }

  // export to the browser
  typeofWindow = typeof window;
  if ('undefined' !== typeofWindow && ATT) {
    ATT.logManager = logManager;
  }
}());