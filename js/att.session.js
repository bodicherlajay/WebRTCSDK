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

    function onInvitationReceived(callInfo) {
      var eventName,
        sendRecvSdp,
        call;

      if (null !== session.pendingCall) {
        emitter.publish('notification', {
          from: callInfo.from,
          mediaType: callInfo.mediaType,
          type: callInfo.type,
          timestamp: new Date(),
          message: 'A pending call exist. Will ignore incoming call'
        });
        return;
      }

      if (Object.keys(calls).length >= 2) {
        emitter.publish('notification', {
          from: callInfo.from,
          mediaType: callInfo.mediaType,
          type: callInfo.type,
          timestamp: new Date(),
          message: 'There are two existing calls in progress. Unable to handle a third incoming call'
        });
        return;
      }

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
    }

    function off(event, handler) {
      emitter.unsubscribe(event, handler);
    }

    function on(event, handler) {

      if ('ready' !== event &&
          'connecting' !== event &&
          'connected' !== event &&
          'updating' !== event &&
          'needs-refresh' !== event &&
          'notification' !== event &&
          'call-incoming' !== event &&
          'conference-invite' !== event &&
          'call-disconnected' !== event &&
          'call-canceled' !== event &&
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

    // public attributes
    this.timeout = null;
    this.e911Id = null;
    this.pendingCall = null;
    this.currentCall = null;
    this.timer = null;

    // public methods
    this.on = on.bind(this);

    this.off = off.bind(this);

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

        rtcManager.refreshSession({
          sessionId : id,
          token : token,
          success : function () { return; },
          error : function (error) {
            emitter.publish('error', {
              error: error
            });
          }
        });
      }, this.timeout);
    };

    this.connect = function connect(options) {
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

              rtcManager.on('invitation-received:' + id, onInvitationReceived);
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

    this.addCall = function (call) {
      logger.logInfo('session:addCall');
      calls[call.id()] = call;
    };

    this.createCall = function (options) {

      var call = new ATT.rtc.Call(ATT.utils.extend(options, {
        sessionInfo: {
          sessionId: this.getId(),
          token: token
        }
      }));

      call.on('connected', function () {
        session.currentCall = session.pendingCall;
        session.pendingCall = null;
        session.addCall(session.currentCall);
      });

      this.pendingCall = call;

      return call;
    };

    this.getCall = function (callId) {
      return calls[callId];
    };

    this.getCalls = function () {
      return calls;
    };

    this.terminateCalls = function () {
      var callId;
      for (callId in calls) {
        if (calls.hasOwnProperty(callId)) {
          calls[callId].disconnect();
        }
      }
    };

    this.deleteCall = function (callId) {

      if (calls[callId] === undefined) {
        throw new Error("Call not found");
      }

      delete calls[callId];

      if (0 === Object.keys(calls).length) {
        emitter.publish('allcallsterminated');
      }
    };

    this.deletePendingCall = function () {
      this.pendingCall = null;
    };

    this.deleteCurrentCall = function () {
      if (this.currentCall) {
        this.deleteCall(this.currentCall.id());
        this.currentCall = null;
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
