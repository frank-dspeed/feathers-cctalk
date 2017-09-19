//TODO: Move FUnctions for toCoin Calls into messageHandler to Reduce Debug Output
const util = require('util');
const makeDebug = require('debug');
const config = require('./config');

const cctalk = require('./lib/cctalk');
const CCBus = require('./cctalk-bus');

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

const cd_queue = new Queue(config.channel+'/cd',config);
const br_queue = new Queue(config.channel+'/br',config);


var Status = {
  config,
  br: 'offline',
  cd: 'offline'
};

var MESSAGE = { status: ''};

function toCoins(name,DEVICE) {
  //'EU200A'
  var coin;
  coin = name.replace('EU','').replace('00A','');
  coin = parseInt(coin);
  makeDebug('CCTALK::NOTICE::'+DEVICE)('Transformed',name, coin);
  return coin;
}
//const io = require('socket.io-client/dist/socket.io.js');

function messageHandler(msg) {
  msg.date = new Date().toISOString();
  msg.channel = config.channel;
  MESSAGE = msg;
  makeDebug('CCTALK::NOTICE::'+msg.status)(MESSAGE);
  CCTalkStatusService.create(msg);
}

if (config.cd) {
  var cd = new cctalk.CoinDetector(CCBus, { dest: 2 });

  cd.on('error', function(e) {
    Status.cd = 'error';
    Status.error = e;
    messageHandler({ from: 'coindetector', status: 'error', err: e, stack: e.stack });
  });

  cd.on('accepted', function(coin) {
    makeDebug('CCTALK::NOTICE::COINDETECTOR')('Accepted',coin);
    cd.getCoinName(coin).then(function(name) {
      var amount = toCoins(name,'COINDETECTOR');
      messageHandler({ from: 'coindetector', status: 'accepted', amount, name, coin });
    });
  });
  cd.on('inhibited', function(coin) {
    makeDebug('CCTALK::NOTICE::COINDETECTOR')('Inhibited',coin);
    cd.getCoinName(coin).then(function(name) {
      var amount = toCoins(name, 'COINDETECTOR');
      messageHandler({ from: 'coindetector', status: 'inhibited', amount, name, coin });
      //CCTalkStatusService.create(('INSERTED_COINS', { from: 'coindetector', amount: coin });
    });
  });
  cd.on('rejected', function(coin) {
    messageHandler({ from: 'coindetector', status: 'rejected', coin });
  });

  cd.on('ready', function() {
    Status.cd = 'ready';
    cd_queue.process(((job,done)=>{
      return done('Not Implamented', job);
    }));
    try {
      makeDebug('CCTALK')('emp800-ready');
      cd.enableAcceptance();
      cd.setAcceptanceMask(0xFFFF);
      messageHandler({ from: 'coindetector', status: 'ready' });
    }
    catch(e) {
      Status.cd = 'error';
      Status.error = e;
      makeDebug('CCTALK::ERR::COINDETECTOR')(e);
      messageHandler({ from: 'coindetector', status: 'error', err: e, stack: e.stack });
    }
  });
}

if (config.br) {
  var br = new cctalk.BanknoteReader(CCBus,{ src: 1, dest: 40 });
  br.on('error', function(e) {
    makeDebug('CCTALK::NOTICE::BANKNOTEREADER')('ERR',e);
    messageHandler({ from: 'banknotereader', status: 'error', err: e, stack: e.stack });
  });

  br.on('accepted', function(note) {
    makeDebug('CCTALK::NOTICE::BANKNOTEREADER')('Accepted',note);
    //TODO: Needs Check
    //br.getNoteName(note).then(function(name) {
      /*var amount = toCoins(name,'BANKNOTEREADER');
      switch(note) {
        case 1:
        case 2:
      }
      */
      messageHandler({ from: 'banknotereader', status: 'accepted', amount, name, note });
    //});
  });
  br.on('inhibited', function(note) {
    makeDebug('CCTALK::NOTICE::BANKNOTEREADER')('Inhibited',note);
  //  br.getNoteName(note).then(function TransformNameToCoins(name) {
      //var amount = toCoins(name,'BANKNOTEREADER');
      messageHandler({ from: 'banknotereader', status: 'inhibited', amount, name, note });
  //  });
  });
  br.on('rejected', function(note) {
    makeDebug('CCTALK::NOTICE::BANKNOTEREADER')('Rejected',note);
    messageHandler({ from: 'banknotereader', status: 'rejected', note });
  });


  br.on('ready', function() {
    Status.br = 'ready';
    try {
      makeDebug('CCTALK')('jmcReady-ready');
      //br.selfTest();
      br_queue.process(((job,done)=>{
        return done('Not Implamented', job);
      }));
      br.modifyBillOperatingMode();
      br.setAcceptanceMask(); // 0xFFFF modifyInhibitStatus 255,255 // 255 1 0 0 0 0 0 0 //TODO: Needs Check  br.setAcceptanceMask(0xFFFF);
      br.enableAcceptance(); // modifyMasterInhibit 1
    }
    catch(err) {
      messageHandler({ from: 'banknotereader-trycatch', status: 'error', err, stack: err.stack });
    }
  });
}
