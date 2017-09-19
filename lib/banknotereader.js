var Promise = require('promise');
var CCCommand = require('cctalk-message');
var CCDevice = require('./device');
var EventEmitter = require('events');
var compose = require('./compose');

const debug = require('debug');
const crc = require('crc');
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
  var COMMAND = new CCCommand(this.config.src, this.config.dest, 254, new Uint8Array(0),16);
  this.sendCommand(COMMAND)
    .then((answer) => {
      console.log(answer);
      /*
      if (answer.command === 0) {
        return answer;
      } else {
        return 'WORINGANSWER';
      }
      */
      this.ready = true;
      this.pollInterval = setInterval(this.poll, 900);
      this.emit('ready');
    }, (error) => {
      this.emit('error', error);
    });
  /*
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
    */
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

        for(var i = 1; i < maxI; i += 2) {
          var type = reply.data[i+1];
          console.log('switching: Type: ', type);
          switch(type) {
          case BanknoteReader.eventCodes.accepted_stacker:
            var coin = reply.data[i];
            this.emit(BanknoteReader.eventCodes[type], coin);
            break;
          case BanknoteReader.eventCodes.accepted_escrow:
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

BanknoteReader.prototype.client = function client(cmd,data){
  // 0 0 , stacker, escrow
  if (!data) {
    data = new Uint8Array(0);
  }
  if (typeof cmd === 'string'){
    cmd = BanknoteReader.commands[cmd];
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
  //return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.modifyBillOperatingMode,
  //Uint8Array.from([ operatingMode & 0xFF, (operatingMode >> 8) & 0xFF ]),16))
  //153
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.modifyBillOperatingMode, new Uint8Array([1]),16))
    .then(console.log)
    .catch((e) => {
      this.emit('error', e);
      throw e;
    });
};

BanknoteReader.prototype.setAcceptanceMask = function setAcceptanceMask(acceptanceMask){
  // example:   231  255  255
  //all-> 231 255 1 0 0 0 0 0 0
  // Uint8Array.from([ acceptanceMask & 0xFF, (acceptanceMask >> 8) & 0xFF ]) == Uint8Array [ 255, 255 ]
  //
  if (!acceptanceMask) {
    acceptanceMask = 0xFFFF;
  }
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.modifyInhibitStatus,
    new Uint8Array([255,255]),16))
    .catch(function(e) {
      this.emit('error', e);
      throw e;
    }.bind(this));
};

BanknoteReader.prototype.enableAcceptance = function enableAcceptance(){
  //228  001
  //_> new Uint8Array(1).fill(0xFF) == Uint8Array [ 255 ] new Buffer(1).from([255]) new Buffer.from([255,255]).readUInt8()
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, BanknoteReader.commands.modifyMasterInhibit, Buffer.from([[1]]),16))
    .catch(function(e)
    {
      this.emit('error', e);
      throw e;
    }.bind(this));
};


BanknoteReader.prototype.selfTest = function selfTest() {
  return this.sendCommand(new CCCommand(this.config.src, this.config.dest, 232, Buffer.from([]),16))
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
/*
040  000  143  230  178
001  002  054  000  255  255  090
040  000  042  227  226
001  001  165  000  001  081
040  000  143  230  178
001  002  054  000  255  255  090
040  002  095  231  255  255  223
001  000  048  000  055

040  001  043  157  001  251
001  007  023  000  069  085  048  048  048  053  065  014
040  001  043  157  001  251
001  007  023  000  069  085  048  048  048  053  065  014
040  001  072  157  002  203
001  007  210  000  069  085  048  048  049  048  065  198
040  001  105  157  003  219
001  007  130  000  069  085  048  048  050  048  065  159
040  001  142  157  004  171
001  007  018  000  069  085  048  048  053  048  065  026
040  001  175  157  005  187
001  007  086  000  069  085  048  049  048  048  065  135
040  001  204  157  006  139
001  007  138  000  069  085  048  050  048  048  065  028
040  001  237  157  007  155
001  007  167  000  069  085  048  053  048  048  065  077
040  001  002  157  008  106
001  007  177  000  046  046  046  046  046  046  046  024
040  001  035  157  009  122
001  007  177  000  046  046  046  046  046  046  046  024
040  001  064  157  010  074
001  007  177  000  046  046  046  046  046  046  046  024
040  001  097  157  011  090
001  007  177  000  046  046  046  046  046  046  046  024
040  001  134  157  012  042
001  007  177  000  046  046  046  046  046  046  046  024
040  001  167  157  013  058
001  007  177  000  046  046  046  046  046  046  046  024
040  001  196  157  014  010
001  007  177  000  046  046  046  046  046  046  046  024
040  001  229  157  015  026
001  007  177  000  046  046  046  046  046  046  046  024
040  001  059  157  016  249
001  007  177  000  046  046  046  046  046  046  046  024
040  002  192  156  069  085  018
001  003  155  000  100  000  002  204
040  002  192  156  069  085  018
001  003  155  000  100  000  002  204
040  002  192  156  069  085  018
001  003  155  000  100  000  002  204


 */
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
  modifyMasterInhibit: 228, // 228  001
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
  readBufferedBill: 159, //Bill Validator commands
  modifyBillId: 158,  //Bill Validator commands
  requestBillId: 157,  //Bill Validator commands  157  001 - xxx looks like that countries_list
  requestCountryScalingFactor: 156, //Bill Validator commands
  requestBillPosition: 155, //Bill Validator commands
  routeBill: 154, //Bill Validator commands
  modifyBillOperatingMode: 153, //Bill Validator commands 000
  requestBillOperatingMode: 152,  //Bill Validator commands
  testLamps: 151,  //Bill Validator commands /Changer / Escrow commands
  requestIndividualAcceptCounter: 150,  //Bill Validator commands
  requestIndividualErrorCounter: 149,  //Bill Validator commands
  readOptoVoltages: 148,  //Bill Validator commands
  performStackerCycle: 147,  //Bill Validator commands
  operateBiDirectionalMotors: 146,  //Bill Validator commands Changer  Escrow commands
  requestCurrencyRevision: 145,  //Bill Validator commands
  uploadBillTables: 144,  //Bill Validator commands
  beginBillTableUpgrade: 143,  //Bill Validator commands
  finishBillTableUpgrade: 142,  //Bill Validator commands
  requestFirmwareUpgradeCapability: 141, //Bill Validator commands: 141,  //Changer / Escrow commands
  uploadFirmware: 140,  //Bill Validator commands /Changer / Escrow commands
  beginFirmwareUpgrade: 139,  //Bill Validator commands /Changer / Escrow commands
  finishFirmwareUpgrade: 138,  //Bill Validator commands /Changer / Escrow commands
  requestCommsRevision: 4,
  clearCommsStatusVariables: 3,
  requestCommsStatusVariables: 2,
  resetDevice: 1
};


/*

Result A Result B Event Type

Bill type 1 to 255  0  validated correctly and sent to cashbox / stacker Credit
1 to 255 1 Bill type 1 to 255 validated correctly and held in escrow Pending Credit
0 0 Master inhibit active Status
0 1 Bill returned from escrow Status
0 2 Invalid bill ( due to validation fail ) Reject
0 3 Invalid bill ( due to transport problem ) Reject
0 4 Inhibited bill ( on serial ) Status
0 5 Inhibited bill ( on DIP switches ) Status
0 6 Bill jammed in transport ( unsafe mode ) Fatal Error
0 7 Bill jammed in stacker Fatal Error
0 8 Bill pulled backwards Fraud Attempt
0 9 Bill tamper Fraud Attempt
0 10 Stacker OK Status
0 11 Stacker removed Status
0 12 Stacker inserted Status
0 13 Stacker faulty Fatal Error
0 14 Stacker full Status
0 15 Stacker jammed Fatal Error
0 16 Bill jammed in transport ( safe mode ) Fatal Error
0 17 Opto fraud detected Fraud Attempt
0 18 String fraud detected Fraud Attempt
0 19 Anti-string mechanism faulty Fatal Error
0 20 Barcode detected Status
0 21 Unknown bill type stacked Status

 */



BanknoteReader.eventCodes = {
  20: 'barcode',
  19: 'antiStringError',
  18: 'string',
  17: 'optoFraud',
  16: 'billJammed',
  13: 'stackerError',
  8: 'following',
  2: 'invalid_bill',
  1: 'accepted_escrow',
  0: 'accepted_stacker',
  accepted_stacker: 0, // stacker
  accepted_escrow: 1, // Escrow
  invalid_bill: 2,
  following: 8,
  busy: 13,
  slow: 19,
  string: 20,
  'return': 254
};

module.exports = exports = BanknoteReader;
