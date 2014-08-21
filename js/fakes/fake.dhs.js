(function () {

  var fDHS = {
    session : function (config) {
      config.success({
        access_token: 'token',
        userid: 'userid',
        sessionId: 'sessionId'
      });
    },
    registerUser : function (config) {
      config.success({
        name: 'user name'
      });
    },
    deleteUser : function (config.success) {
      config.success();
    },
    authorize : function (config) {
      config.success({
        oAuth: {
          code: 'code',
          mockON: true,
          AuthorizeUrl: 'authURL',
          type: 'UserType'
        }
      });
    },
    token : function (config) {
      return config.success({});
    },
    login : function (config) {
      config.success({});
    },
    logout : function (config) {
      config.success();
    },
    createE911Id : function (config) {
      config.success({
        e911Id: {
          e911Locations: {
            addressIdentifier: 'Adddress ID'
          }
        }
      });
    },
  };

  function fakeDHS(dhs) {
    dhs = fDHS;
  }

  window.fakes.fakeDHS = fakeDHS;

  ATT.rtc.dhs = fakeDHS(ATT.rtc.dhs);
  phone = fakePhone(phone);

});