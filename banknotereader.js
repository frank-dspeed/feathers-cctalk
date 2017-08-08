var Promise = require('promise');
var CCCommand = require('cctalk-message');
var CCDevice = require('./device');
var EventEmitter = require('events');
var compose = require('./compose');

const debug = require('debug');
const crc = require('crc')
/*
class ccTalkMessage {
  // src, dest, command, data, crc
  constructor(src, dest, command, data, crc) {
    //fromBuffer() A buffer always should have a crc checksum already !
    if(src instanceof Uint8Array) {
      // parse command
      this._buffer = src;
      this._src = this._buffer[2];
      this._dest = this._buffer[0];
      this._command = this._buffer[3];
      this._data = this._buffer.slice(4, this._buffer[1]+4);
      // TODO: checksum detection and parsing
      this._checksum = this._buffer[this._buffer[1]+4]

      if (this._checksum == undefined) {
          console.log(this._buffer)
          throw new Error('NO_CHECKSUM');
      } else {
        // Check for CRC8
        if (this.crc8verify()) {
          this._crcType = 8
          debug('ccMessage:crc')('CRC8_CHECKSUM')
        } else if (this.crc16verify()) {
          this._crcType = 16
          debug('ccMessage:crc')('CRC16_CHECKSUM')
        } else {
          debug('ccMessage:crc')(this._buffer)
          throw new Error('WRONG_CHECKSUM');
        }
      }

    } else {
      // create command
      if (command == undefined) {
          debug('ccMessage:command')(this._buffer)
          throw new Error('NO_COMMAND');
      } else if (data == undefined) {
          debug('ccMessage:command')(this._buffer)
          throw new Error('NO_DATA');
      }
      this._src = typeof src != undefined ? src : 1;
      this._dest = typeof dest != undefined ? dest : 2;
      this._crcType = typeof crc != undefined ? crc : 8
      this._command = command;
      this._data = data;
    }
  }
  toBuffer() {
    if (this._buffer == undefined) {
      this._buffer = new Uint8Array(5 + this._data.length);
      this._buffer[0] = this._dest;
      this._buffer[1] = this._data.length;
      this._buffer[2] = this._src;
      this._buffer[3] = this._command;
      this._buffer.set(this._data, 4);
      // console.log('CRC: ', this._crcType)
      if (this._crcType === 8) {
        return this.crc8()
      } else {
        return this.crc16()
      }
    } else {
      return this._buffer
    }
  }
  crc8() {
    var sum = 0;
    for (var i=0; i < (this._buffer.length - 1); ++i)
      sum += (this._buffer[i]);
    // Set Checksum at end
    this._buffer[this._data.length+4] = 0x100 - sum%0x100;
    return this._buffer;
  }
  crc8verify() {
    var sum = 0;
    for (var i=0; i < (this._buffer.length - 1); ++i) {
      sum += (this._buffer[i]);
    }

    if (this._buffer[this._data.length+4] != 0x100 - sum%0x100) {
      return false;
    } else {
      return true
    }
  }
  crc16() {
    //CRC16-CCITT-xModem signed Buffer
    var UArray = new Uint8Array([this._buffer[0],this._buffer[1],this._buffer[3]])
    var CRCArray = require('crc').crc16xmodem(Buffer.from(UArray))
        .toString(16)
        .match(/.{1,2}/g)
        .map((val)=> parseInt(val, 16))
        .reverse()
    // console.log(CRCArray)
    // Set Checksum first Part at src
    this._buffer.set([CRCArray[0]],2)
    // Set Checksum Secund Part after data
    this._buffer.set([CRCArray[1]], this._buffer[1]+4) // Position after data aka last
    return this._buffer;
  }
  crc16verify() {
    var UArray = new Uint8Array([this._buffer[0],this._buffer[1],this._buffer[3]])
    var CRCArray = require('crc').crc16xmodem(Buffer.from(UArray))
        .toString(16)
        .match(/.{1,2}/g)
        .map((val)=> parseInt(val, 16))
        .reverse();

    if ((this._buffer[2] == CRCArray[0]) && (this._buffer[this._buffer[1]+4] == CRCArray[1])) {
      return true;
    } else {
      return false;
    }
  }
};

var CCCommand = ccTalkMessage;
*/
var CCDeviceEmitter = compose(CCDevice, EventEmitter);

function BanknoteReader(bus, config) {
  EventEmitter.call(this);
  CCDevice.apply(this, arguments);

  this.poll = this.poll.bind(this);
  this.ready = false;

  // register last, after all device type specific variables have been set up!
  this.bus.registerDevice(this);
}

BanknoteReader.prototype = new CCDeviceEmitter();

BanknoteReader.prototype.onBusReady = function onBusReady() {
  var COMMAND = new CCCommand(this.config.src, this.config.dest, 254, new Uint8Array(0),16)
  this.sendCommand(COMMAND)
    .then(function (answer) {
      console.log(answer)
      if (answer.command === 0) {
        return answer
      } else {
        throw "WORINGANSWER"
      }
    })

    this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.performSelfCheck, new Uint8Array(0),16))
    .then(function(answer) {
      console.log(answer)
      //this.ready = true;
      //this.pollInterval = setInterval(this.poll, 900);
      //this.emit('ready');
    }.bind(this), function(error) {
      this.emit('error', error);
    }.bind(this));


    this.sendCommand(new CCCommand(this.config.src, this.config.dest, 153, new Uint8Array(0),16))
    .then(function(answer) {
      console.log(answer)
      this.ready = true;
      this.pollInterval = setInterval(this.poll, 900);
      this.emit('ready');
    }.bind(this), function(error) {
      this.emit('error', error);
    }.bind(this));
};

BanknoteReader.prototype.onBusClosed = function onBusClosed() {
  this.ready = false;
};

BanknoteReader.prototype.poll = function poll() {
  this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.readBufferedBill, new Uint8Array(0),16))
  .then(function(reply) {
    if(this.eventBuffer && reply.data[0] != this.eventBuffer[0])
    {
      var dEventCounter = reply.data[0] -  this.eventBuffer[0];
      if(dEventCounter > 5)
        this.emit('error', new Error('Event overflow. Events generated by the coin detector were lost!'));

      var maxI = Math.min(reply.data.length, dEventCounter*2+1);

      for(var i = 1; i < maxI; i += 2)
      {
        var type = reply.data[i+1];

        switch(type)
        {
          case BanknoteReader.eventCodes.accepted:
            var coin = reply.data[i];
            this.emit(BanknoteReader.eventCodes[type], coin);
            break;
          case BanknoteReader.eventCodes.inhibited:
          case BanknoteReader.eventCodes.rejected:
            this.emit(BanknoteReader.eventCodes[type]);
            break;
          case BanknoteReader.eventCodes.return:
            this.emit('return');
            break;
          default:
            this.emit('malfunction', [type, reply.data[i]]);
            this.emit('error', new Error('The device reported a malfunction: Code ' + type + ', ' + reply.data[i]));
        }
      }
      //console.log(reply.data);
    }
    this.eventBuffer = reply.data;
  }.bind(this));
};

BanknoteReader.prototype.client = function modifyBillOperatingMode(cmd,data){
  // 0 0 , stacker, escrow
  if (!data) {
    data = new Uint8Array(0)
  }
  if (typeof cmd === 'string'){
    cmd = BanknoteReader.commands[cmd]
  }

  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, cmd,
                                        data,16))
    .catch(function(e) {
      this.emit('error', e);
      throw e;
    }.bind(this));
};

BanknoteReader.prototype.modifyBillOperatingMode = function modifyBillOperatingMode(operatingMode){
  // 0 0 , stacker, escrow
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.modifyInhibitStatus,
                                        Uint8Array.from([ operatingMode & 0xFF, (operatingMode >> 8) & 0xFF ]),16))
    .catch(function(e) {
      this.emit('error', e);
      throw e;
    }.bind(this));
};

BanknoteReader.prototype.setAcceptanceMask = function setAcceptanceMask(acceptanceMask){
  // example:   231  255  255
  //all-> 231 255 1 0 0 0 0 0 0
  // Uint8Array.from([ acceptanceMask & 0xFF, (acceptanceMask >> 8) & 0xFF ]) == Uint8Array [ 255, 255 ]
  //
  if (!acceptanceMask) {
    acceptanceMask = 0xFFFF
  }
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.modifyInhibitStatus,
                                        new Uint8Array([255, 1]),16))
    .catch(function(e) {
      this.emit('error', e);
      throw e;
    }.bind(this));
};

BanknoteReader.prototype.enableAcceptance = function enableAcceptance(){
  //228  001
  //_> new Uint8Array(1).fill(0xFF) == Uint8Array [ 255 ] new Buffer(1).from([255]) new Buffer.from([255,255]).readUInt8()
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.modifyMasterInhibit, new Buffer.from([1]),16))
    .catch(function(e)
    {
      this.emit('error', e);
      throw e;
    }.bind(this));
};


BanknoteReader.prototype.selfTest = function selfTest() {
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, 232, new Uint8Array(0),16))
    .catch(function(e) {
      this.emit('error', e);
      throw e;
    }.bind(this));
};


BanknoteReader.prototype.disableAcceptance = function disableAcceptance() {
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.modifyMasterInhibit, new Uint8Array(1).fill(0x00),16))
    .catch(function(e)
    {
      this.emit('error', e);
      throw e;
    }.bind(this));
};

BanknoteReader.prototype.getCoinName = function getCoinName(channel) {
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.requestCoinId,
                                        Uint8Array.from([ channel ]),16))
  .then(function(reply)
  {
    return String.fromCharCode.apply(null, reply.data);
  }.bind(this));
};

BanknoteReader.prototype.getCoinPosition = function getCoinPosition(channel) {
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.requestCoinPosition,
                                        Uint8Array.from([ channel ]),16));
};

BanknoteReader.commands = {
  requestStatus: 248,
  requestVariableSet: 247,
  requestManufacturerId: 246,
  requestEquipmentCategoryId: 245,
  requestProductCode: 244,
  requestDatabaseVersion: 243,
  requestSerialNumber: 242,
  requestSoftwareRevision: 241,
  testSolenoids: 240,
  testOutputLines: 238,
  readInputLines: 237,
  readOptoStates: 236,
  latchOutputLines: 233,
  performSelfCheck: 232,
  modifyInhibitStatus: 231,
  requestInhibitStatus: 230,
  readBufferedBill: 159, //Bill Validator commands
  modifyBillOperatingMode: 153, //Bill Validator commands 000
  modifyMasterInhibit: 228, // 228  000
  requestMasterInhibitStatus: 227,
  requestInsertionCounter: 226,
  requestAcceptCounter: 225,
  modifySorterOverrideStatus: 222,
  requestSorterOverrideStatus: 221,
  requestDataStorageAvailability: 216,
  requestOptionFlags: 213,
  requestCoinPosition: 212,
  modifySorterPath: 210,
  requestSorterPath: 209,
  teachModeControl: 202,
  requestTeachStatus: 201,
  requestCreationDate: 196,
  requestLastModificationDate: 195,
  requestRejectCounter: 194,
  requestFraudCounter: 193,
  requestBuildCode: 192,
  modifyCoinId: 185,
  requestCoinId: 184,
  uploadWindowData: 183,
  downloadCalibrationInfo: 182,
  requestThermistorReading: 173,
  requestBaseYear: 170,
  requestAddressMode:169,
  /*
  231  255  255
  228  001

  158 Modify bill id //Bill Validator commands
  157 Request bill id //Bill Validator commands  157  001
  156 Request country scaling factor //Bill Validator commands
  155 Request bill position //Bill Validator commands
  154 Route bill //Bill Validator commands

  153 Modify bill operating mode //Bill Validator commands

  152 Request bill operating mode //Bill Validator commands
  151 Test lamps //Bill Validator commands //Changer / Escrow commands
  150 Request individual accept counter //Bill Validator commands
  149 Request individual error counter //Bill Validator commands
  148 Read opto voltages //Bill Validator commands
  147 Perform stacker cycle //Bill Validator commands
  146 Operate bi-directional motors //Bill Validator commands //Changer / Escrow commands
  145 Request currency revision //Bill Validator commands
  144 Upload bill tables //Bill Validator commands
  143 Begin bill table upgrade //Bill Validator commands
  142 Finish bill table upgrade //Bill Validator commands
  141 Request firmware upgrade capability //Bill Validator commands //Changer / Escrow commands
  140 Upload firmware //Bill Validator commands //Changer / Escrow commands
  139 Begin firmware upgrade //Bill Validator commands //Changer / Escrow commands
  138 Finish firmware upgrade //Bill Validator commands //Changer / Escrow commands
  */
  requestCommsRevision: 4,
  clearCommsStatusVariables: 3,
  requestCommsStatusVariables: 2,
  resetDevice: 1
};










BanknoteReader.eventCodes =
{
 //Core Plus commands  254: 'return',
  20: 'string',
  19: 'slow',
  13: 'busy',
  8: 'following',
  2: 'inhibited',
  1: 'rejected',
  0: 'accepted',

  accepted: 0,
  rejected: 1,
  inhibited: 2,
  following: 8,
  busy: 13,
  slow: 19,
  string: 20,
  'return': 254
};

module.exports = exports = BanknoteReader;
