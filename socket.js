const config = require('./config');
const io = require('socket.io-client');
const socket = io(config.server);
module.exports = socket;
