/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam:true*/
/*global error:true, ATT:true, define:true */

(function () {
  'use strict';

  var typeofWindow,
    logManager = {},
    instance,
    loggersCollection = [],
    getLogStatementFilePosition,
    moduleLoggers = []; // list of loggers for SDK modules

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

  function log(type, toLog, obj) {
    if (typeof toLog === 'object') {
      console.log(type, toLog, '[' + getLogStatementFilePosition() + ']');
    } else {
      console.log(type + ' ' + toLog + ' [' + getLogStatementFilePosition() + ']');
      if (obj) {
        console.log(obj);
      }
    }
  }

  /**
   * Private method to return the filename and position as <filename>:<position> of log statement.  Does this by throwing
   * an exception and parsing its stack trace.
   * @returns {string} Returns <filename>:<position>
   */
  getLogStatementFilePosition = function () {
    var fileName = '',
      lineNumber,
      stackLocationString = '',
      splitstr = [],
      rawfile = '',
      splitrawfile = [];

    try {
      throw new Error();
    } catch (err) {
      stackLocationString = err.stack.split('\n')[4];
      splitstr = stackLocationString.split(':');
      rawfile = splitstr[2];
      splitrawfile = rawfile.split('/');
      fileName = splitrawfile[splitrawfile.length - 1];

      // strip off timestamp if it's present.
      if (fileName.indexOf('?') > -1) {
        fileName = fileName.split('?')[0];
      }

      lineNumber = splitstr[3];
      return fileName + ':' + lineNumber;
    }
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
      logTrace: function (msg, obj) {
        if (msg === undefined || msg.length === 0) {return; }
        if (level >= logManager.LOG_LEVEL.TRACE) {
          log('[TRACE]', msg, obj);
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

  function getLogger(moduleName, loggerType, logLevel) {
    var type = loggerType || logManager.LOGGER_TYPE.CONSOLE,
      level = logLevel || logManager.LOG_LEVEL.INFO,
      clogger = loggersCollection[moduleName];
    if (!clogger) {
      if (type === logManager.LOGGER_TYPE.CONSOLE) {
        clogger = createConsoleLogger({level: level, type: type});
        loggersCollection[moduleName] = clogger;
      }
    }
    return clogger;
  }

  function addLoggerForModule(moduleName) {
    var logMgr = ATT.logManager.getInstance(), lgr;
    logMgr.configureLogger(moduleName, logMgr.loggerType.CONSOLE, logMgr.logLevel.INFO);
    lgr = logMgr.getLogger(moduleName);
    moduleLoggers[moduleName] = lgr;
    return moduleLoggers[moduleName];
  }

  /** Find/Create a logger for given `module`
   *
   * @param moduleName The name of the module
   * @returns {object} The logger object
   */
  function getLoggerByName(moduleName) {
    var lgr = moduleLoggers[moduleName];
    if (lgr === undefined) {
      return addLoggerForModule(moduleName);
    }
    return lgr;
  }

  function updateLogLevel(moduleName, level) {
    var lgr = getLogger(moduleName);
    if (!lgr) {
      lgr.setLevel(level);
    }
  }

  function init() {
    return {
      getLogger: getLogger,
      configureLogger: configureLogger,
      loggerType: logManager.LOGGER_TYPE,
      logLevel: logManager.LOG_LEVEL,
      getLoggerByName: getLoggerByName,
      addLoggerForModule: addLoggerForModule,
      updateLogLevel: updateLogLevel
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
