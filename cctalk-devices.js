
  function toCoins(name) {
    //'EU200A'
    coins = name.replace('EU','').replace('00A','');
    coins = parseInt(coins);
    return coins
  }
  //const io = require('socket.io-client/dist/socket.io.js');

  const cluster = require('cluster');
  const util = require('util');
  const debug = require('debug')('DRIVER::CCTALK::')

  if(cluster.isMaster) {
    const WEBSOCKET_SERVER_ADDRESS = 'http://master.peep:3030'
    const io = require('socket.io-client');
    const socket = io(WEBSOCKET_SERVER_ADDRESS);

    var CCTALK_MESSAGE = { name: ''}

    function messageHandler(msg) {
      if (msg.cmd && msg.cmd === 'CCTALK') {
        //socket.emit('nfcTag',msg.tag.buffer)
        debug('CCTALK_IN:', msg)
        // When CCTALK_MESSAGE is not Updated
        if (CCTALK_MESSAGE.name !== msg.name) {

          debug('SET CCTALK_MESSAGE:',CCTALK_MESSAGE,' -> ', msg)
          CCTALK_MESSAGE = msg;
          socket.emit(msg.cmd,{ from: 'cardreader-acr122u', tag: msg.tag })
          //console.log('ALLAH', msg)
        }
      }
    }
    function applyHandler(){
      for (const id in cluster.workers) {
        cluster.workers[id].on('message', messageHandler);
      }
    }

    socket.on('connect', ()=>{
      debug(' nfcDriver: successful Connected to:', WEBSOCKET_SERVER_ADDRESS + ' '+new Date())
      // Log Connected to Server
      socket.emit('CCTALK',CCTALK_MESSAGE)
    });

    socket.on('TEST',()=>{
      CCTALK_MESSAGE = { from: 'cardreader-acr122u-test', CLIENT_IP: '192.168.0.33', tag: { buffer: new Buffer('HAHAHA') } };
      socket.emit('CCTALK',CCTALK_MESSAGE)
    })

    socket.on('CCTALK_STATUS',()=>{
      socket.emit('event',{
        type: 'driver',
        name: 'CCTALK_STATUS',
        data: CCTALK_MESSAGE
      })
    })

    socket.on('disconnect', function(){
      debug(new Date(),'nfcDriver: Disconnected from:', WEBSOCKET_SERVER_ADDRESS)
      // Log Connected to Server
    });

    cluster.on('online', function(worker) {
      //console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
        //console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        //console.log('Starting a new worker');
        //setTimeout(()=>
        cluster.fork()
        //,5000)
        applyHandler()
    });
    cluster.fork();
    // CCTALK messageHandler



  } else {

  var cctalk = require('./cctalk')
  var CCBus = new cctalk.CCBus('/dev/ttyUSB0')
  var cd = new cctalk.CoinDetector(CCBus, { dest: 2 });

  cd.on('error', function(e) {
    process.send({ cmd: 'CCTALK', name: 'error', type: 'driver', err: e, stack: e.stack });
  });

  cd.on('ready', function() {
    try {
      console.log('emp800-ready');
      cd.enableAcceptance();
      cd.setAcceptanceMask(0xFFFF);

      cd.on('error', function(e) {
        process.send({ cmd: 'CCTALK', name: 'error', type: 'driver', err: e, stack: e.stack });
      });
      cd.on('accepted', function(c) {
        console.log('Accepted', c);
        cd.getCoinName(c).then(function(name) {
          var coins = toCoins(name)
          console.log(name, coins);
          process.send({ cmd: 'CCTALK', name: 'accepted', type: 'driver', amount: coins, HEX: name, C: c });
        });
      });
      cd.on('inhibited', function(c) {
        console.log('Inhibited', c);
        cd.getCoinName(c).then(function(name) {
          var coins = toCoins(name)
          console.log(name, coins);
          process.send({ cmd: 'CCTALK', name: 'inhibited', type: 'driver', amount: coins, HEX: name, C: c });
          //socket.emit('INSERTED_COINS', { from: 'emp800', amount: coins });
        });
      });
      cd.on('rejected', function(c) {
        process.send({ cmd: 'CCTALK', name: 'rejected', type: 'driver', c: c });
      });
    }
    catch(e) {
      process.send({ cmd: 'CCTALK', name: 'error', type: 'driver', err: e, stack: e.stack });
    }
  });

  var br = new cctalk.BanknoteReader(CCBus,{ src: 1, dest: 40 });
  br.on('error', function(e) {
    process.send({ cmd: 'CCTALK', name: 'error', type: 'driver', err: e, stack: e.stack });
  });

  br.on('ready', function() {
    try {
      console.log('jmcReady-ready');

      //br.selfTest();
      //br.enableAcceptance();
      //TODO: Needs Check
      br.setAcceptanceMask(0xFFFF);

      br.on('error', function(e) {
        console.log('error', e);
      });
      br.on('accepted', function(c) {
        console.log('Accepted', c);
        //TODO: Needs Check
        br.getNoteName(c).then(function(name) {
          var coins = toCoins(name)
          console.log(name, coins);
          process.send({ cmd: 'CCTALK', name: 'accepted', type: 'driver', amount: coins, HEX: name, C: c });
        });
      });
      br.on('inhibited', function(c) {
        console.log('Inhibited', c);
        br.getNoteName(c).then(function(name) {
          var coins = toCoins(name)
          console.log(name, coins);
          process.send({ cmd: 'CCTALK', name: 'inhibited', type: 'driver', amount: coins, HEX: name, C: c });
          //socket.emit('INSERTED_COINS', { from: 'emp800', amount: coins });
        });
      });
      br.on('rejected', function(c) {
        //console.log('Rejected', c);
        process.send({ cmd: 'CCTALK', name: 'rejected', type: 'driver', c: c });
      });

    }
    catch(e) {
      process.send({ cmd: 'CCTALK', name: 'error', type: 'driver', err: e, stack: e.stack });
    }
  });
}
