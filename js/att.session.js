/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager

(function () {
  'use strict';

  var factories = ATT.private.factories,
    logManager = ATT.logManager.getInstance();

  /** 
    Creates a new WebRTC Session.
    @global
    @class Represents a WebRTC Session.
    @constructor
  */
  function Session() {

    var session = this,

      // dependencies
      emitter,
      rtcManager,

      // private attributes
      id = null,
      token = null,
      calls = {};

    // instantiate event emitter
    emitter = factories.createEventEmitter();

    // get the RTC Manager
    rtcManager = ATT.private.rtcManager.getRTCManager();

    rtcManager.on('call-incoming', function (callInfo) {
      var call = session.createCall({
        id: callInfo.id,
        peer: callInfo.from,
        type: ATT.CallTypes.INCOMING,
        mediaType: callInfo.mediaType
      });

      if (undefined !== call) {
        if (callInfo.remoteSdp) {
          call.setRemoteSdp(callInfo.remoteSdp);
        }

        emitter.publish('call-incoming', {
          from: call.peer,
          mediaType: call.mediaType,
          codec: call.codec,
          timestamp: new Date()
        });
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
          'address-updated' !== event &&
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
        rtcManager.stopUserMedia();
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
        rtcManager.refreshSession({
          sessionId : id,
          token : token,
          success : function () {},
          error : function () {return; }
        });
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
      var call;
      ATT.utils.extend(options, {
        sessionInfo: {
          sessionId: this.getId(),
          token: token
        }
      });
      call = new ATT.rtc.Call(options);
      session.currentCall = call;
      return call;
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
      if (this.currentCall) {
        this.currentCall = null;
      }
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

    this.updateE911Id = function (options) {
      if (undefined === options) {
        throw new Error('options not defined');
      }
      if (undefined === options.e911Id) {
        throw new Error('e911Id not defined');
      }
      ATT.utils.extend(options, {
        sessionId: this.getId(),
        token: this.getToken(),
        onSuccess : function () {
          emitter.publish('address-updated');
        },
        onError : function () {

        }
      });
      rtcManager.updateSessionE911Id(options);
    };

  }

  if (undefined === ATT.rtc) {
    throw new Error('Cannot export Session. ATT.rtc is undefined');
  }
  ATT.rtc.Session = Session;

}());
