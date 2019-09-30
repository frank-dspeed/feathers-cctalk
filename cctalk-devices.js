//TODO: Move FUnctions for toCoin Calls into messageHandler to Reduce Debug Output
const util = require('util');
const debug = require('debug');
var config
try {
  config = require('./config');
} catch(e) {
  config = require('./config.example');
}

function cctalkDebug(msg) {
  debug('cctalk-devices::debug')(msg)
  return msg
}

const WEBSOCKET_SERVER_ADDRESS = config.server;
const io = require('socket.io-client');
const socket = io(WEBSOCKET_SERVER_ADDRESS);

const feathers = require('feathers-client');
const socketio = require('feathers-socketio/client');

const feathersClient = feathers()
  .configure(socketio(socket, { timeout: 2000 })); //,  {  transports: ['websocket'] }
  //.configure(hooks())

var CCTalkStatusService = feathersClient.service('cctalk');

const jobsService = feathersClient.service('jobs');

const Queue = require('bee-queue');

var Status = {
  config,
  bv: 'offline',
  cd: 'offline'
};

var MESSAGE = { status: ''};

function toCoins(name,DEVICE) {
  //'EU200A'
  var coin;
  coin = name.replace('EU','').replace('00A','');
  coin = parseInt(coin);
  debug('cctalk::NOTICE::'+DEVICE)('Transformed',name, coin);
  return coin;
}
//const io = require('socket.io-client/dist/socket.io.js');

function messageHandler(msg) {
  msg.date = new Date().toISOString();
  msg.channel = config.channel;
  MESSAGE = msg;
  debug('cctalk::NOTICE::'+msg.status)(MESSAGE);
  CCTalkStatusService.create(msg);
}




const cctalk = require('node-cctalk');
var searchFor = 'wh'
var SerialPort = require('serialport');
var CCBus;
SerialPort.list()
  .then(cctalkDebug)
  .then((ports)=>ports.filter((port)=>port.pnpId !== undefined))
  .then(cctalkDebug)
  .then((ports)=>ports.filter((port)=>port.pnpId.indexOf(searchFor) > -1))
  .then(cctalkDebug)
  .then(ports=>{
    /*
    [ { manufacturer: 'wh Berlin',
        serialNumber: 'whEMP0698323',
        pnpId: 'usb-wh_Berlin_EMP_8xx.14_whEMP0698323-if00-port0',
        locationId: undefined,
        vendorId: '0403',
        productId: 'EMP 8xx.14',
        comName: '/dev/ttyUSB0' } ]
     */
    if (ports.length > 0) {
      return ports[0]
    } else {
      return Promise.reject('NotFound: '+searchFor)
    }
  })
  .then(cctalkDebug)
  .then((port)=>{
    CCBus = new cctalk.CCBus(port.comName, {autoOpen: false}); // config
    //TODO: Detect Connected BillValidator
    //TODO: Send Every 30 sec a SimplePoll for the BV

    return CCBus.ser.open()
  })
  .then(cctalkDebug)
  .then(()=> {
    cctalkDebug(config)
    if (config.cd) {
      var cd = new cctalk.CoinAcceptor(CCBus);
      const cd_queue = new Queue(config.channel+'/cd',config);

      cd.on('error', function(e) {
        Status.cd = 'error';
        Status.error = e;
        messageHandler({ from: 'coindetector', status: 'error', err: e, stack: e.stack });
      });

      cd.on('accepted', function(amount) {
        debug('cctalk::NOTICE::COINDETECTOR')('Accepted',coin);
        //var amount = toCoins(name,'COINDETECTOR');
        messageHandler({ from: 'coindetector', status: 'accepted', coin: amount, amount });
      });
      cd.on('inhibited', function(coin) {
        debug('cctalk::NOTICE::COINDETECTOR')('Inhibited',coin);
        messageHandler({ from: 'coindetector', status: 'inhibited', amount, name, coin });
      });
      cd.on('rejected', function() {
        messageHandler({ from: 'coindetector', status: 'rejected', coin });
      });

      cd.on('ready', function() {
        Status.cd = 'ready';
        cd_queue.process((job,done)=>{
          return done('Not Implamented', job);
        });
      })

    }

    if (config.bv) {
      const bv = new cctalk.BillValidator(CCBus,{ dest: 40, crc: 16 });
      const bv_queue = new Queue(config.channel+'/bv',config);

      function startBillValidatorJobs() {
        bv_queue.process((job,done) => {
          if (bv.ready){
            return done('Not Implamented', job);
          } else {
            setTimeout(()=>startBillValidatorJobs(),10000)
            return job.save()
          }
        });
      }

      //startBillValidatorJobs()
      bv.on('error', function(e) {
        debug('cctalk::billvalidator::error')(e);
        messageHandler({ from: 'BillValidator', status: 'error', err: e, stack: e.stack });
      });

      bv.on('accepted', function(amount) {
        debug('cctalk::device::events::BillValidator')('Accepted',amount);
        messageHandler({ from: 'BillValidator', status: 'accepted', amount });
      });

      bv.on('inhibited', function(channel) {
        debug('cctalk::NOTICE::BillValidator')('Inhibited',channel);
        messageHandler({ from: 'BillValidator', status: 'inhibited', amount, name, BillChannel: channel });
      });

      bv.on('rejected', function() {
        debug('cctalk::NOTICE::BillValidator')('Rejected');
        messageHandler({ from: 'BillValidator', status: 'rejected'});
      });
    }
  })
  .catch(console.log)
