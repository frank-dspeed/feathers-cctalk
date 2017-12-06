const cctalk = require('./lib/cctalk');

module.exports = function createCCBus(port,config) {
  var CCBus = new cctalk.CCBus(port,config);
  return CCBus;
}
