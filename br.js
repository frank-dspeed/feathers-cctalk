
  function toCoins(name) {
    //'EU200A'
    coins = name.replace('EU','').replace('00A','');
    coins = parseInt(coins);
    return coins;
  }
  var debug = require('debug');


  var cctalk = require('./cctalk');
  var CCBus = new cctalk.CCBus('/dev/ttyUSB1');
  var br = new cctalk.BillReader(CCBus,{ src: 1, dest: 40 });
  br.on('error', function(e) {
    console.log(e);
  });
  br.on('ready', function() {
    try {
      console.log('jmcReady-ready');
      br.setAcceptanceMask(); // 0xFFFF modifyInhibitStatus 255,255 // 255 1 0 0 0 0 0 0
      //br.selfTest();
      br.enableAcceptance(); // modifyMasterInhibit 1

      br.on('error', function(e) { console.log('error', e); });
      br.on('accepted', function(c) {
        console.log('Accepted', c);
        br.getNoteName(c).then(function(name) {
          var coins = toCoins(name);
          console.log(name, coins);
        });
      });
      br.on('inhibited', function(c) {
        console.log('Inhibited', c);
        br.getNoteName(c).then(function(name) {
          var coins = toCoins(name);
          console.log(name, coins);
          socket.emit('INSERTED_COINS', { from: 'emp800', amount: coins });
        });
      });
      br.on('rejected', function(c) { console.log('Rejected', c); });

    }
    catch(e) {
      console.log(e, e.stack);
    }
  });
/*
  var cctalk = require('./cctalk')
  var CCBus = new cctalk.CCBus('/dev/ttyUSB0')
  var br = new cctalk.BillReader(CCBus,{ src: 1, dest: 40 });
  br.pollInterval = 0
  br.poll = function() {
    return
  }
  br.prototype.poll = function() {
    return
  }
  */
  //br.client( 231 ,new Uint8Array([255, 1])).then((s)=>console.log('SSSSSSSSSSSS: ',s))
  //br.client( 228 ,new Uint8Array([1])).then((s)=>console.log('SSSSSSSSSSSS: ',s))
    //br.client( 227 ).then(console.log) // Request inhabitStatus

        //br.client( 254 ).then(console.log)

        //231  255  255
        //228  001
