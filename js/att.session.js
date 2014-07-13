/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function () {
  'use strict';

  var factories = ATT.private.factories,
    errMgr,
    logManager = ATT.logManager.getInstance();

  /**
  * Session prototype
  */
  function Session() {

    // dependencies
    var emitter,
      self = this,
      rtcManager,
      // private attributes
      id = null,
      token = null,
      calls = {},
      logger;

    logger = logManager.getLoggerByName('Session');

    // instantiate event emitter
    emitter = factories.createEventEmitter();

    // get the RTC Manager
    rtcManager = ATT.private.rtcManager.getRTCManager();

    rtcManager.on('call-incoming', function (callInfo) {
      var call = self.createCall({
        id: callInfo.id,
        peer: callInfo.from,
        type: ATT.CallTypes.INCOMING,
        mediaType: callInfo.mediaType,
        remoteSdp: callInfo.remoteSdp
      });
      if (undefined !== call) {
        emitter.publish('call-incoming');
      }
    });

    function on(event, handler) {

      if ('ready' !== event &&
          'connecting' !== event &&
          'connected' !== event &&
          'updating' !== event &&
          'needs-refresh' !== event &&
          'call-incoming' !== event &&
          'call-disconnected' !== event &&
          'disconnecting' !== event &&
          'disconnected' !== event &&
          'updateE911Id' !== event &&
          'allcallsterminated' !== event) {
        throw new Error('Event not defined');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler, this);
    }

//    function refreshWebRTCSession() {
//      var dataForRefreshWebRTCSession = {
//        params: {
//          url: [self.sessionId],
//          headers: {
//            'Authorization': self.token
//          }
//        },
//        success: function () {
//          logger.logInfo('Successfully refreshed web rtc session on blackflag');
//          //this.onWebRTCSessionRefreshed();
//        },
//        //error: this.onError
//      };

      // Call BF to refresh WebRTC Session.
//      resourceManager.doOperation('refreshWebRTCSession', {});
//    }

    // public attributes
    this.timeout = null;
    this.e911Id = null;
    this.currentCall = null;
    this.timer = null;

    // public methods
    this.on = on.bind(this);

    this.getToken = function () {
      return token;
    };

    this.getId = function () {
      return id;
    };

    this.setId = function (sessionId) {
      id = sessionId;

      if (null === sessionId) {
        emitter.publish('disconnected');
        return;
      }

      emitter.publish('connected');
    };

    this.update = function update(options) {
      if (options === undefined) {
        throw new Error('No options provided');
      }

      if (undefined !== options.timeout
          && 'number' !== typeof options.timeout) {
        throw new Error('Timeout is not a number.');
      }

      if (options.timeout < 60000) {
        this.timeout = options.timeout;
      } else {
        this.timeout = options.timeout - 60000;
      }
      token = options.token || token;
      this.e911Id = options.e911Id || this.e911Id;

      emitter.publish('updating', options);

      if (this.timer !== null) {
        clearInterval(this.timer);
      }

      this.timer = setInterval(function () {
        emitter.publish('needs-refresh');
        console.log('needs-refresh');
        // rtcManager.refreshSession({
        //   sessionId : id,
        //   token : token,
        //   success : function () {},
        //   error : function () {return; }
        // });
      }, this.timeout);
    };

    this.connect =   function connect(options) {
      if (!options) {
        throw 'No input provided';
      }
      if (!options.token) {
        throw 'No access token provided';
      }
      token = options.token;
      this.e911Id = options.e911Id;

      emitter.publish('connecting');

      var session = this;

      rtcManager.connectSession({
        token: options.token,
        e911Id: options.e911Id,
        onSessionConnected: function (sessionInfo) {
          session.setId(sessionInfo.sessionId);
          session.update({
            timeout: sessionInfo.timeout
          });
        },
        onSessionReady: function (data) {
          emitter.publish('ready', data);
        }
      });
    };

    this.disconnect =   function () {
      emitter.publish('disconnecting');

      var session = this;

      rtcManager.disconnectSession({
        sessionId: session.getId(),
        token: session.getToken(),
        e911Id: session.e911Id,
        onSessionDisconnected: function () {
          session.setId(null);
        }
      });
    };

    this.createCall = function (options) {
      ATT.utils.extend(options, {
        sessionInfo: {
          sessionId: this.getId(),
          token: token
        }
      });
      this.currentCall = new ATT.rtc.Call(options);
      return this.currentCall;
    };

    this.terminateCalls = function () {
      var callId;
      for (callId in calls) {
        if (calls.hasOwnProperty(callId)) {
          calls[callId].disconnect();
        }
      }
    };

    this.addCall = function (callObj) {
      calls[callObj.id] = callObj;
    };

    this.getCall = function (callId) {
      return calls[callId];
    };

    this.deleteCurrentCall = function () {
      if (!this.currentCall) {
        throw new Error('Call not found');
      }
      this.currentCall = null;
    };

    this.deleteCall =   function deleteCall(callId) {
      var call = this.getCall(callId);
      if (call === undefined) {
        throw new Error("Call not found");
      }
      delete calls[call.id];
      call = null;

      if (Object.keys(calls).length === 0) {
        emitter.publish('allcallsterminated');
      }
    };

    this.updateE911Id = function () {};

  }

  if (undefined === ATT.rtc) {
    throw new Error('Cannot export Session. ATT.rtc is undefined');
  }
  ATT.rtc.Session = Session;

}());
