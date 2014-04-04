
describe('SignalingService', function () {

    var apiObj = ATT[ATT.apiNamespaceName],
        requests,
        xhr;

    before(function () {});

    beforeEach(function () {

        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];

        xhr.onCreate = function(xhr) {
            requests.push(xhr);
        };
    });

    afterEach(function () {
        xhr.restore();
    });

    it('should exist and contain send method.', function () {
        expect(ATT.SignalingService).to.be.an('object');
        expect(ATT.SignalingService.send).to.be.a('function');
    });

    it('should call startCall API method with call object passed as data with SDP & calledParty.', function () {
        
        // setup
        
        ATT.WebRTC.Session = {
            accessToken: 'access_token',
            Id: 'webrtc_sessionid'
        };

        // spy on ATT.WebRTC.startCall
        //var startCallSpy = sinon.spy(ATT[apiNamespace], 'startCall');
        var startCallSpy = sinon.spy(apiObj, 'startCall'),
          sdpFilterFuncStub = sinon.stub(ATT.sdpFilter, "getInstance", function () {
            return {
              processChromeSDPOffer: function (sdp) {
                return {
                  sdp: 'sdp'
                };
              }
            };
          });
      
        // stub out ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp)
        //var stub = sinon.stub(object, "method", func)
        
        ATT.SignalingService.send({
            phoneNumber: '123',
            sdp: 'sdp'
        });
        
        expect(startCallSpy.called).to.be.true;

        var configPassedToStartCall = startCallSpy.args[0][0];
        
        expect(configPassedToStartCall).to.be.an('object');
        expect(configPassedToStartCall.data.call).to.be.an('object');
        expect(configPassedToStartCall.data.call.sdp).to.exist;
        expect(configPassedToStartCall.data.call.calledParty).to.exist;

        startCallSpy.restore();
    });

    
    it('should receive 201 and Location url and x-state: invitation-sent in header', function () {
        // setup
        ATT.WebRTC.Session = {
            accessToken: 'access_token',
            Id: 'webrtc_sessionid'
        };
        
        // fake xhr response headers
        var responseHeaders = {
            Location: '/RTC/v1/sessions/0045-ab42-89a2/calls/1234',
            'x-state': 'invitation-sent',
            "Content-Type": "application/json"
            },
            successSpy = sinon.spy(),
            errorSpy = sinon.spy();
    
        // call
        ATT.SignalingService.send({
            phoneNumber: '123',
            sdp: 'sdp',
            success:    successSpy,
            error:      errorSpy
        });

        // Response to startCall (happy path)
        requests[0].respond(201, responseHeaders, "");
        
        // send callback should be called
        expect(successSpy.called).to.be.true;
        
        // send should be called with object with x-state and location.
        sendSuccessArguments = successSpy.args[0][0];
        expect(sendSuccessArguments).to.be.an('object');
        
    });

    xit('should call error callback on any 400.', function () {
        var errorSpy = sinon.spy(),
            successSpy = sinon.spy();
        
        // setup
        ATT.WebRTC.Session = {
            accessToken: 'access_token',
            Id: 'webrtc_sessionid'
        };
        
        // call
        ATT.SignalingService.send({
            phoneNumber: '123',
            sdp: 'sdp',
            success:    successSpy,
            error:      errorSpy
        });
        
        // response
        // Response to startCall (happy path)
        requests[0].respond(400, {}, "");

        // send callback should be called
        expect(errorSpy.called).to.be.true;
    });
});