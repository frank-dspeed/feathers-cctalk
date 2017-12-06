module.exports = {
  port: '/dev/ttyUSB0',
  server: 'http://localhost:3030',
  channel: 'room-1',
  redis: {
    host: '172.0.0.2'
  },
  bv: true, // BillValidator
  cd: true // CoinDetector
};
