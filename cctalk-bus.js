const config = require('./config');
const cctalk = require('./lib/cctalk');
const CCBus = new cctalk.CCBus(config.port);
module.exports = CCBus;
