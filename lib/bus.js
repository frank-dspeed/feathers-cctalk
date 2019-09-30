  var SerialPort = require('serialport');
  var CCCommand = require('node-cctalk-command');
  var defaults = require('defaults-deep');
  var timeout = require('promise-timeout').timeout;
  var debug = require('debug')('CCBus');

  var ccTalkParser = require('serialport-parsers-cctalk');
  //var ccTalkParser = SerialPort.parsers.CCTalk;

  var parser = new ccTalkParser();

  class CCBus {
    constructor(port, config) {
      //this.parserBuffer = new Uint8Array(255+5);
      //this.parserBuffer.cursor = 0;
      this.parser = parser
      this.config = defaults(config, { src: 1, timeout: 2000 });
      this.connectionStatus = 'closed';

      this.ser = new SerialPort(port, { baudRate: 9600, autoOpen: false });
      this.ser.on('error', (err) => console.log('Serial port error', err));

      this.ser.pipe(parser);
      function toArrayBuffer(buf) {
        var ab = new ArrayBuffer(buf.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        debug('parser::toArrayBuffer',new Uint8Array(ab))
        return new Uint8Array(ab);
    }

      this.parser.on('data',(data) => {
        var command = new CCCommand(data)
        command._origin = data
        debug('parser::onData',command._command,(command._dest === this.config.src),this.config)
        toArrayBuffer(data)
        if(command._dest === this.config.src || command._dest === 0) {
          debug('response::',command._command,(command._dest === this.config.src))
          this.commandResponse(command)
        } else {
          return
        }
      })


      this.lastCommand = null;
      this.commandChainPromise = Promise.resolve();
    }
    commandResponse(command) {
      //console.log('data', command);
      debug('response',JSON.stringify(command))
      // command.dest === 1 as bus is always src 1
      if(this.lastCommand) {
        var lastCommand = this.lastCommand;
        this.lastCommand = null;
        debug('SET LAST COMMAND NULL',(command._command === 0),command)
        if(command._command === 0){
          lastCommand.resolve(command);
        } else {
          lastCommand.reject(command);
        }
      }
    }
    registerDevice(device) {
      if(this.ser.isOpen) {
        debug('bus::registerDevice::deprected')('')
        //device.onBusOpen();
      }
    }
    // Command needs to be Instance of node-cctalk-command!
    sendCommand(command) {
      command._src = this.config.src;
      function commandErrorHandler(err) {
        debug('COMMAND ERROR')
        debug(err, command)
        if (err instanceof timeout) {
          console.error('Timeout: ', command);
        } else {
          console.log(err);
        }
      }
      // Send command with promised reply
      // If you use this function, use it exclusively and don't forget to call _onData() if you override onData()

      var promise = timeout(new Promise((resolve, reject) => {
       command.resolve = resolve;
       command.reject = reject;
      }), this.config.timeout)
      .catch(commandErrorHandler);

      // use the command chain to send command only when previous commands have finished
      // this way replies can be correctly attributed to commands
      this.commandChainPromise = this.commandChainPromise
        .then(() => {
           this.lastCommand = command;
           debug('SET LAST COMMAND')
           return new Promise((resolve,reject)=> {
               debug(new Buffer.from(command.toBuffer()))
               this.ser.write(command.toBuffer(),(err)=>{
                 if(err) {
                   reject(err)
                 } else {
                   resolve()
                 }
               });
             });
        })
        .then(() => promise)

        //.then(()=>process.exit(1))
      return promise
        //.then(()=>console.log('WEEEEEEEEEEEEEEE ARE RESOLVED'))
        .catch(commandErrorHandler);
     }
  };

  module.exports = exports = CCBus;
