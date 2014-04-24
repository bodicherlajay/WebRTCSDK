/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam:true*/
/*global error:true, ATT:true*/
if (!exports) {
  var exports = {};
}
(function (app) {
  "use strict";
  var module = {},
    instance,
    loggersCollection = [],
    //Logger prototype
    LoggerProtoType = {
      logDebug: function (msg) {},
      logWarning: function (msg) {},
      logError: function (msg) {},
      logTrace: function (msg) {},
      logLevel: function (logLevel) {}
    },
    consoleLogger = {
      level : '',
      logLevel: function (logLevel) {
        this.level = logLevel;
      },
      logDebug: function (msg) {
        console.log('level:' + this.level);
        console.log(msg);
        if (this.level === module.LOG_LEVEL.DEBUG) {
          console.log('[DEBUG]' + msg);
        }
      },
      logWarning: function (msg) {
        if (this.level === module.LOG_LEVEL.WARNING) {
          console.log('[WARN]' + msg);
        }
      },
      logError: function (msg) {
        if (this.level === module.LOG_LEVEL.ERROR) {
          console.log('[ERROR]' + msg);
        }
      },
      logTrace: function (msg) {
        if (this.level === module.LOG_LEVEL.TRACE) {
          console.log('[TRACE]' + msg);
        }
      }
    },
    newConsoleLogger = function () {
      return app.utils.extend(Object.create(LoggerProtoType), consoleLogger);
    },
    configureLogger = function (moduleName, type, level) {
      var clogger = loggersCollection[moduleName];
      if (!clogger) {
        if (type === module.LOGGER_TYPE.CONSOLE) {
          clogger = newConsoleLogger();
          clogger.logLevel(level);
        }
        loggersCollection[moduleName] = clogger;
        return true;
      }
      return false;
    },
    getLogger = function (moduleName) {
      var clogger = loggersCollection[moduleName];
      if (!clogger) {
        throw new Error("Logger not found");
      }
      return clogger;
    },
    init = function () {
      return {
        getLogger: getLogger,
        configureLogger: configureLogger,
        loggerType: module.LOGGER_TYPE,
        logLevel: module.LOG_LEVEL
      };
    };

  module.LOGGER_TYPE = {
    CONSOLE: 'Console',
    FILE: 'File'
  };
  module.LOG_LEVEL = {
    INFO: 'Info',
    ERROR: 'Error',
    DEBUG: 'Debug',
    WARNING: 'Warning',
    TRACE: 'Trace'
  };

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  app.logManager = module;
  exports.logManager = module;
}(ATT || {}));