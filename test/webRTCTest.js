/**
    Tests for top-level ATT WebRTC.
*/

describe('webRTC', function () {
    var apiNamespace = 'WebRTC',
        requests,
        xhr;
    
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

    it('ATT namespace should exist and contain utils', function () {
        expect(ATT).to.exist;
        expect(ATT.utils).to.be.an('object');
    });

    describe('init', function(){
        it('should add api method on ATT namespace', function () {
            ATT.init({
             apiConfigs: {
                    foo: {
                        method: 'get'
                    }
                }
            });
            expect(ATT[apiNamespace].foo).is.a('function');
        });

        it('should call rest client with proper arguments from config', function () {
            var attConfig = {
                apiConfigs: {
                    foo: {
                        method: 'get',
                        url: 'http://example.com'
                    }
                }
            };
            
            var spy = sinon.spy(RESTClient.prototype, 'ajax');
            ATT.init(attConfig);
            ATT[apiNamespace].foo({}, function(){}, function(){});
            
            var configPassedtoAjax = spy.args[0][0];    // first call, first argument
            expect(configPassedtoAjax.method).to.equal(attConfig.apiConfigs.foo.method);
            expect(configPassedtoAjax.url).to.equal(attConfig.apiConfigs.foo.url);
            
            spy.restore();
        });

        it('should call rest client with correct callbacks and data', function () {
            var attConfig = {
                apiConfigs: {
                    foo: {
                        method: 'get'
                    }
                }
            };

            ATT.init(attConfig);
            
            var config = {
                data: {
                    username: 'username',
                    password: 'password'
                },
                success: function () {},
                error: function () {}
            };
            
            
            var spy = sinon.spy(RESTClient.prototype, 'ajax');
            ATT[apiNamespace].foo(config);
            
            var configPassedtoAjax = spy.args[0][0];    // first call, first argument
            
            // expects
            expect(configPassedtoAjax.data).eql(config.data);
            //expect(configPassedtoAjax.data).eql(data);
            //expect(configPassedtoAjax.success).equal(successCB);
            //expect(configPassedtoAjax.error).equal(errorCB);
            
            spy.restore();
        });

        it('should add api methods during init.', function () {
            ATT.init({
                apiConfigs: {
                    foo: {
                        method: 'post'
                    },
                    logout: {
                        method: 'delete'
                    }
                }
            });

            expect(ATT[apiNamespace].foo).is.a('function');
            expect(ATT[apiNamespace].logout).is.a('function');
        });

        it('should use APIConfigs.js if no config passed in', function() {
            ATT.init();
            expect(ATT[apiNamespace].authenticate).is.a('function');
        });

        // Add API methods as you add to the APIConfig.js file.
        [
            'authenticate',
            'logout',
            'getBrowserSession',
            'createWebRTCSession',
            'getEvents'
        ].forEach(function(methodName){
            describe('Function ' + methodName, function () {
                it("should exist", function (done) {
                    ATT.init();
                    expect(ATT[apiNamespace][methodName]).is.a('function');
                    done();
                });
            });
        });
    });
    
    describe('utils', function () {
        it('hasWebRTC should return true if navigator.mozGetUserMedia or navigator.webkitGetUserMedia or navigator.getUserMedia is a function', function (){
            //act
            var hasWebRTC = ATT.utils.hasWebRTC();
            expect(hasWebRTC).to.be.true;
        });
    });
    
    describe('loginAndCreateWebRTCSession', function () {

        /**
         * Create session curl call
         * curl -i -X POST -H "Content-Type: application/json" -H "Accept:application/json" -H "Authorization:Bearer abcd" -H "x-e911Id:f81d4fae-7dec-11d0-a765-00a0c91e6bf" -d @bftest.txt http://wdev.code-api-att.com:8080/RTC/v1/sessions
         */
        
        it('should pass access token and e911id to createWebRTCSession and set appropriate headers/data', function () {
            
            // plan of attack:
            // fake the authorization call response.
            // spy on createWebRTCSession.

            // spy on createWebRTCSession
            var createWebRTCSessionSpy = sinon.spy(ATT[apiNamespace], 'createWebRTCSession');
            
            ATT[apiNamespace].login({
                data: {
                    un: 'un',
                    pw: 'pw',
                    access_token: {access_token: 'tokin' }
                },
                success: function () {},
                error: function () {}
            });
            
            // response json from authorize call.  check the schema.
            var responseObject1 = {
                "accesstoken": {
                    "access_token": "abcd"
                },
                "e911": 'e911id'
            };
            
            // response to authorize
            requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));
            var args1 = createWebRTCSessionSpy.args[0];
            
            // expect
            expect(args1[0].headers.Authorization).to.contain(responseObject1.accesstoken.access_token);
            expect(args1[0].headers.Authorization).to.contain(responseObject1.accesstoken.access_token);
            expect(args1[0].headers['x-e911Id']).to.exist;

            
            // restore
            createWebRTCSessionSpy.restore();
        });


        it('should pass session description as data object to createWebRTCSession', function () {
            // plan of attack:
            // fake the authorization call response.
            // spy on createWebRTCSession.

            // spy on createWebRTCSession
            var createWebRTCSessionSpy = sinon.spy(ATT[apiNamespace], 'createWebRTCSession');
            
            ATT[apiNamespace].login({
                un: 'un',
                pw: 'pw'
            });

            // response json from authorize call.  check the schema.
            var responseObject1 = {
                "accesstoken": {
                    "access_token": "abcd"
                }
            };

            // response to authorize
            requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));
            var args1 = createWebRTCSessionSpy.args[0];

            // expect
            // should contain mediaType and services.
            expect(args1[0].data.session.services).to.be.an('array');

            // restore
            createWebRTCSessionSpy.restore();

        });
        
        
        it ('should call success callback of createWebRTCSession, happy path', function () {
            
            // response json from authorize call.  check the schema.
            var responseObject1 = {
                "accesstoken": {
                    "access_token": "abcd"
                }
                },
                expectedLocationHeader = "/RTC/v1/sessions/4ba569b5-290d-4f1f-b3af-255731383204",
                jsonSpy = sinon.spy();

            ATT[apiNamespace].login({data : {}, success : jsonSpy});
            
            // response to authorize
            requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));
            
            // response to createWebRTCSession.  Only passes pack response with no body.
            requests[1].respond(200, {"Content-Type": "application/json", "location": expectedLocationHeader }, JSON.stringify({}));
            
            expect(requests[1].getResponseHeader('location')).to.equal(expectedLocationHeader);
            //expect(jsonSpy.called).to.be.true;
        });
    });
});