
  function toCoins(name) {
    //'EU200A'
    coins = name.replace('EU','').replace('00A','');
    coins = parseInt(coins);
    return coins
  }
  var socket = require('socket.io-client')('http://master.peep:3030');

  socket.on('connect', function(){
    /* Self Test */
    socket.emit('INSERTED_COINS', { from: 'emp800-test', amount: 3 });
  });

  socket.on('FRONTEND_COINS', function(data){
    console.log('DATA_FROM_LOCAL_CHANNEL:', data);
  });
  socket.on('disconnect', function(){});


  var cd = new require('./cctalk').CoinDetector('/dev/ttyUSB0');

  cd.on('error', function(e)
  {
    console.log(e);
  });

  cd.on('ready', function()
  {
    try
    {
      console.log('emp800-ready');
      cd.enableAcceptance();
      cd.setAcceptanceMask(0xFFFF);

      cd.on('error', function(e) { console.log('error', e); });
      cd.on('accepted', function(c)
      {
        console.log('Accepted', c);
        cd.getCoinName(c).then(function(name) {
          var coins = toCoins(name)
          console.log(name, coins);
        });
      });
      cd.on('inhibited', function(c)
      {
        console.log('Inhibited', c);
        cd.getCoinName(c).then(function(name) {
          var coins = toCoins(name)
          console.log(name, coins);
          socket.emit('INSERTED_COINS', { from: 'emp800', amount: coins });
        });
      });
      cd.on('rejected', function(c) { console.log('Rejected', c); });
    }
    catch(e)
    {
      console.log(e, e.stack);
    }
  });

  var br = new require('./cctalk').BanknoteReader(cd.bus,{ dest: 40 });
  br.on('error', function(e) {
    console.log(e);
  });
  br.on('ready', function() {
    try {
      console.log('jmcReady-ready');
      br.enableAcceptance();
      br.setAcceptanceMask(0xFFFF);

      br.on('error', function(e) { console.log('error', e); });
      br.on('accepted', function(c) {
        console.log('Accepted', c);
        br.getNoteName(c).then(function(name) {
          var coins = toCoins(name)
          console.log(name, coins);
        });
      });
      br.on('inhibited', function(c) {
        console.log('Inhibited', c);
        br.getNoteName(c).then(function(name) {
          var coins = toCoins(name)
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
