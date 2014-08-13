/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager

(function () {
  'use strict';

  var factories = ATT.private.factories,
    logManager = ATT.logManager.getInstance(),
    sdpFilter = ATT.sdpFilter.getInstance();

  /** 
    Creates a new WebRTC Session.
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
      calls = {},
      logger;

    logger = logManager.getLoggerByName("Session");

    // instantiate event emitter
    emitter = factories.createEventEmitter();

    // get the RTC Manager
    rtcManager = ATT.private.rtcManager.getRTCManager();

    rtcManager.on('invitation-received', function (callInfo) {
      var eventName,
        sendRecvSdp,
        call;

      call = session.createCall({
        breed: callInfo.type,
        id: callInfo.id,
        peer: callInfo.from,
        type: ATT.CallTypes.INCOMING,
        mediaType: callInfo.mediaType
      });

      if (undefined !== call) {
        if (callInfo.sdp) {
          sendRecvSdp = sdpFilter.replaceSendOnlyWithSendRecv(callInfo.sdp);
          call.setRemoteSdp(sendRecvSdp);
        }

        if (call.breed() === 'call') {
          eventName = 'call-incoming';
        } else {
          eventName = 'conference-invite';
        }

        emitter.publish(eventName, {
          from: call.peer(),
          mediaType: call.mediaType(),
          codec: call.codec(),
          timestamp: new Date()
        });
      }
    });

    rtcManager.on('call-disconnected', function (callInfo) {
      var eventName;
      if ('call' === callInfo.type) {
        eventName = 'call-disconnected';
      } else {
        eventName = 'conference-disconnected';
      }
      emitter.publish(eventName, {
        from: callInfo.from,
        mediaType: session.currentCall.mediaType(),
        codec: session.currentCall.codec(),
        timestamp: new Date()
      });
    });

    rtcManager.on('media-mod-terminations', function (callInfo) {
      if (undefined !== callInfo.reason
        && 'success' !== callInfo.reason
        && 'Call rejected' !== callInfo.reason) {
        emitter.publish('network-notification', {
          message: callInfo.reason,
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
        'network-notification' !== event &&
        'call-incoming' !== event &&
        'conference-invite' !== event &&
        'call-disconnected' !== event &&
        'conference-disconnected' !== event &&
        'disconnecting' !== event &&
        'disconnected' !== event &&
        'address-updated' !== event &&
        'allcallsterminated' !== event &&
        'error' !== event) {
        throw new Error('Event ' + event + ' not defined');
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
    this.backgroundCall = null;
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
          error : function (error) {
            emitter.publish('error', {
              error: error
            });
          }
        });
      }, this.timeout);
    };

    this.connect = function connect(options) {
	     var session = this;
      try {
        if (undefined === options) {
          throw ATT.errorDictionary.getSDKError('2002');
        }
        if (undefined === options.token) {
          throw ATT.errorDictionary.getSDKError('2001');
        }

        try {

          logger.logDebug('Session.connect');

		      token = options.token;
          this.e911Id = options.e911Id;

          emitter.publish('connecting');

          session = this;

          rtcManager.connectSession({
            token: options.token,
            e911Id: options.e911Id,
            onSessionConnected: function (sessionInfo) {
              try {
                logger.logDebug('connectSession.onSessionConnected');

                session.setId(sessionInfo.sessionId);
                session.update({
                  timeout: sessionInfo.timeout
                });
              } catch (err) {
                logger.logError(err);

                emitter.publish('error', {
                  error: ATT.errorDictionary.getSDKError('2004')
                });
              }
            },
            onSessionReady: function (data) {
              emitter.publish('ready', data);
            },
            onError: function (error) {
              emitter.publish('error', {
                error: error
              });
            }
          });

        } catch (err) {
          throw ATT.errorDictionary.getSDKError('2004');
        }

      } catch (err) {
        logger.logError(err);

        emitter.publish('error', {
          error: err
        });
      }
    };

    this.disconnect = function () {
      try {
        emitter.publish('disconnecting');

        var session = this;

        rtcManager.disconnectSession({
          sessionId: session.getId(),
          token: session.getToken(),
          e911Id: session.e911Id,
          onSessionDisconnected: function () {
            try {
              session.setId(null);
            } catch (err) {
              emitter.publish('error', {
                error: err
              });
            }
          },
          onError: function (error) {
            emitter.publish('error', {
              error: error
            });
          }
        });

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
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

    this.addCall = function (call) {
      calls[call.id()] = call;
    };

    this.getCall = function (callId) {
      return calls[callId];
    };

    this.moveToBackground = function (call) {
      console.log('moving!!!!');
    };

    this.switchCall = function () {
      var call = this.currentCall;
      this.currentCall = this.backgroundCall;
      this.backgroundCall = call;
    };

    this.deleteCurrentCall = function () {
      if (this.currentCall) {
        this.currentCall = null;
      }
    };

    this.deleteCall =   function deleteCall(callId) {

      if (calls[callId] === undefined) {
        throw new Error("Call not found");
      }

      delete calls[callId];

      if (0 === Object.keys(calls).length) {
        emitter.publish('allcallsterminated');
      }
    };

    this.updateE911Id = function (options) {

      ATT.utils.extend(options, {
        sessionId: this.getId(),
        token: this.getToken(),
        onSuccess : function () {
          emitter.publish('address-updated');
        },
        onError : function (error) {
          emitter.publish('error', {
            error: error
          });
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
