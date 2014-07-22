/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, sinon, expect, xit, assert, after*/

describe('Application configuration', function () {
  'use strict';


  it('should export `ATT.private.config.app.environments`', function () {
    expect(ATT.private.config.app.environments).to.be.an('object');
  });

  it('should export `ATT.private.config.app.current`', function () {
    expect(ATT.private.config.app.current).to.be.an('object');
  });

  it('should export `ATT.private.config.app.dhsURLs`', function () {
    expect(ATT.private.config.app.dhsURLs).to.be.an('object');
  });
  it('should export `ATT.private.config.app.eventChannelConfig`', function () {
    expect(ATT.private.config.app.eventChannelConfig).to.be.an('object');
  });
});