/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam:true*/
/*global error:true, ATT:true, define:true */

(function () {
  'use strict';

  var typeofModule, typeofWindow,
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

  function log(type, toLog) {
    if (typeof toLog === 'object') {
      console.log(type);
      console.log(toLog);
    } else {
      console.log(type + ' ' + toLog);
    }
  }

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
          log('[INFO]', msg);
        }
      },
      logDebug: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (level >= logManager.LOG_LEVEL.DEBUG) {
          log('[DEBUG]', msg);
        }
      },
      logWarning: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (level >= logManager.LOG_LEVEL.WARNING) {
          log('[WARN]', msg);
        }
      },
      logError: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (level >= logManager.LOG_LEVEL.ERROR) {
          log('[ERROR]', msg);
        }
      },
      logTrace: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (level >= logManager.LOG_LEVEL.TRACE) {
          log('[TRACE]', msg);
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

  //exports for nodejs, derived from underscore.js
  typeofModule = typeof module;
  if (typeofModule !== 'undefined' && module.exports) {
    module.exports.logger = logManager;
  }

  // export to the browser
  typeofWindow = typeof window;
  if ('undefined' !== typeofWindow && ATT) {
    ATT.logManager = logManager;
  }
}());