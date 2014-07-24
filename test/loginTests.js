
/*
QUnit.test( "Phone Object", function( assert ) {
  var phone = ATT.rtc.Phone.getPhone();
  ok(phone, "Created Phone object without errors");
});
*/

/*
test( "login check for mandatory input parameters", function( assert ) {
  var phone = ATT.rtc.Phone.getPhone();
  ok(phone, "Created Phone object without errors");
  phone.on("error", function (event) {
    "use strict";
    ok("error","Error event got called with sdk error");
  })
  phone.login();
});
*/


asyncTest( "Invoking login without E911Id should generate API Error 2505", function( assert ) {
  expect( 3 );
  var phone = ATT.rtc.Phone.getPhone();
  ok(phone, "Created Phone object without errors");
  phone.login({
    token: "UyDHqbFC2k3N5100lhKm5XqVSWwjZsw0"
  });
  QUnit.config.autostart = false;

  phone.on("error", function (event) {
    "use strict";
    ok("error","Got call-error event");
    equal(event.error.ErrorCode,2505,"Should return error code 2505");
    console.log("error message");
    console.log(event);
    setTimeout(start(),1000);
  });
});