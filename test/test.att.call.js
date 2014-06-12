/**
 * @author Yogesh Randhawa
 */

describe('Call', function () {
  
  it('Should have a public constructor under ATT.private', function () {
    expect(ATT.private.Call).to.be.a('function');
  });
  
  it('Should create a call object');
  
  describe('Connect method', function () {
    it('Should exist');

    it('Should fail if the required options are not provided');

    it('Should execute the onConnected callback if no error');

    it('Should execute the onError callback if there is an error');
  });

  describe('Disconnect method', function () {
    it('Should exist');

    it('Should execute the onDisconnected callback if no error');

    it('Should execute the onError callback if there is an error');
  });

});
