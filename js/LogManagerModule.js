/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam:true*/
/*global error:true, ATT:true, define:true */
if (!exports) {
  var exports = {};
}
(function (app) {
  'use strict';
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
    //console logger implementation
    consoleLogger = {
      level : '',
      logLevel: function (logLevel) {
        this.level = logLevel;
      },
      logDebug: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (this.level >= module.LOG_LEVEL.DEBUG) {
          console.log('[DEBUG]' + msg);
        }
      },
      logWarning: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (this.level >= module.LOG_LEVEL.WARNING) {
          console.log('[WARN]' + msg);
        }
      },
      logError: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (this.level >= module.LOG_LEVEL.ERROR) {
          console.log('[ERROR]' + msg);
        }
      },
      logTrace: function (msg) {
        if (msg === undefined || msg.length === 0) {return; }
        if (this.level >= module.LOG_LEVEL.TRACE) {
          console.log('[TRACE]' + msg);
        }
      }
    },
    newConsoleLogger = function () {
      return app.utils.extend(Object.create(LoggerProtoType), consoleLogger);
    },
    //todo file logger
    configureLogger = function (moduleName, type, level) {
      var clogger = loggersCollection[moduleName];
      if (clogger !== 'undefined' && clogger.level === level) {
        throw new Error('Logger exists, Can not create the logger specified');
      }
      if (type === module.LOGGER_TYPE.CONSOLE) {
        clogger = newConsoleLogger();
        clogger.logLevel(level);
      }
      loggersCollection[moduleName] = clogger;
      return true;
    },
    getLogger = function (moduleName) {
      var clogger = loggersCollection[moduleName];
      if (!clogger) {
        throw new Error('Logger not found');
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
    ERROR: 0,
    WARNING: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
  };

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  app.logManager = module;

  //exports for nodejs, derived from underscore.js
  if (exports !== 'undefined') {
    if (module !== 'undefined' && module.exports) {
      exports = module.exports = app.logManager;
    }
    exports['ATT.logManager'] = app.logManager;
  }

}(ATT || {}));