const CCDevice = require('./device');

const debug = require('debug');
const crc = require('crc');
const defaults = require('defaults-deep');

class BillValidator extends CCDevice {
  constructor(bus, config) {
    super(bus, config);
    // register last, after all device type specific variables have been set up!
    this.commands = defaults({
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
    },this.commands);

    this.bus.registerDevice(this);
    this.on('ready',()=> {
      this.init()
    })
  }
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
  get eventCodes() {
    return {
      20: 'barcode',
      19: 'antiStringError',
      18: 'string',
      17: 'optoFraud',
      16: 'billJammed',
      13: 'stackerError',
      8: 'following',
      4: 'inhibited',
      2: 'invalidBill',
      1: 'escrow',
      0: 'accepted',
      accepted: 0, // stacker
      escrow: 1, // Escrow
      invalidBill: 2,
      following: 8,
      busy: 13,
      string: 18,
      antiStringError: 19,
      barcode: 20,
      'return': 254
    }
  }
  init() {
    debug('CCTALK')('jmcReady-ready');
    //br.selfTest();
    var EU_AS_HEX = new Uint8Array([69,85])
    this.exec('requestBillId', new Uint8Array([1]))
      .then(()=>this.exec('requestBillId', new Uint8Array([1])))
      .then(()=>this.exec('requestBillId', new Uint8Array([2])))
      .then(()=>this.exec('requestBillId', new Uint8Array([3])))
      .then(()=>this.exec('requestCountryScalingFactor', EU_AS_HEX))
      .then(()=>this.exec('requestCurrencyRevision', EU_AS_HEX))
      .then(()=>this.exec('modifyBillOperatingMode', new Uint8Array([3]))) // NO ESCROW NO STACKER 3 = both enabled 2 = only stacker
    //this.setAcceptanceMask(); // 0xFFFF modifyInhibitStatus 255,255 // 255 1 0 0 0 0 0 0 //TODO: Needs Check  this.setAcceptanceMask(0xFFFF);
      .then(()=>this.exec('modifyInhibitStatus', new Uint8Array([255,255,255]))) // [255,1] ==== alll [255,255,255]
    //this.enableAcceptance(); // modifyMasterInhibit 1
      .then(()=>this.exec('modifyMasterInhibit', Buffer.from([[1]])))
      .then(()=> {
        this.pollInterval = setInterval(()=>{this.poll();}, 900)
        //this.exec('requestBillOperatingMode').then(console.log).then(process.exit(1))
        return true
      });


  }
  poll() {
    if (this.ready) {
      this.exec('readBufferedBill').then((buffer)=> this.parseEventBuffer(buffer));
    }
  }
  modifyBillOperatingMode(operatingMode){
    // 0 0 , stacker, escrow
    //return this.sendCommand( this.commands.modifyBillOperatingMode,
    //Uint8Array.from([ operatingMode & 0xFF, (operatingMode >> 8) & 0xFF ]))
    //153
    return this.exec('modifyBillOperatingMode', new Uint8Array([1]))
      //.then(console.log)
  }
  setAcceptanceMask(acceptanceMask){
    // example:   231  255  255
    //all-> 231 255 1 0 0 0 0 0 0
    // Uint8Array.from([ acceptanceMask & 0xFF, (acceptanceMask >> 8) & 0xFF ]) == Uint8Array [ 255, 255 ]
    //
    if (!acceptanceMask) {
      acceptanceMask = 0xFFFF;
    }
    // Experiment replaced 255 255 with 255 1 === all?
    return this.exec('modifyInhibitStatus', new Uint8Array([255,1]))
  }
  enableAcceptance(){
    //228  001
    //_> new Uint8Array(1).fill(0xFF) == Uint8Array [ 255 ] new Buffer(1).from([255]) new Buffer.from([255,255]).readUInt8()
    return this.exec('modifyMasterInhibit', Buffer.from([[1]]))
  }
  selfTest() {
    return this.exec('performSelfCheck')
  }
  disableAcceptance() {
    return this.exec('modifyMasterInhibit', new Uint8Array(1).fill(0x00))
  }
  channelToCoin(channel) {
    var channelToCoin = {
      0: 'rejected',
      1: '5',
      2: '10',
      3: '20',
      4: '50'
    }
    return channelToCoin[channel]
  }
  getBillName(channel) {
    return this.channelToCoin(channel)
    /*
    return this.exec('requestBillId', Uint8Array.from([ channel ]))
      //TODO: here is a good place to verify that the Reply wich is a command has a valid crc :)
      .then((reply) => {
        console.log(reply)
        String.fromCharCode.apply(null, reply._data)
      });
    */
  }
  getBillPosition(channel) {
    return this.exec('requestBillPosition', Uint8Array.from([ channel ]));
  }
}
module.exports = exports = BillValidator;
