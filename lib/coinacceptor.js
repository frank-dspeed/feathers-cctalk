const CCDevice = require('./device');
const defaults = require('defaults-deep');
const debug = require('debug')
class CoinDetector extends CCDevice {
  constructor(bus, config) {
    super(bus,config)

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
      readBufferedCredit: 229,
      modifyMasterInhibit: 228,
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
      requestCommsRevision: 4,
      clearCommsStatusVariables: 3,
      requestCommsStatusVariables: 2,
      resetDevice: 1
    },this.commands)
    // register last, after all device type specific variables have been set up!
    //this.bus.registerDevice(this);
    this.on('ready',()=>{
      this.onReady()
    })
  }
  onReady(){
    debug('CCTALK')('emp800-ready');
    this.ready = true;
    this.pollInterval = setInterval(()=> {
      this.poll()
    }, 999);
    this.enableAcceptance()
      .then(()=>this.setAcceptanceMask(0xFFFF));
  }
  poll() {
    if (this.ready) {
      this.exec('readBufferedCredit').then((buffer)=>{
        this.parseEventBuffer(buffer)
      });
    } else {
      debug('CoinAcceptor::poll()')(this.ready)
    }
  }
  setAcceptanceMask(acceptanceMask) {
    return this.exec('modifyInhibitStatus',  Uint8Array.from([ acceptanceMask & 0xFF, (acceptanceMask >> 8) & 0xFF ]))
  }
  enableAcceptance(){
    return this.exec('modifyMasterInhibit', new Uint8Array(1).fill(0xFF))
  }
  disableAcceptance(){
    return this.exec('modifyMasterInhibit', new Uint8Array(1).fill(0x00))
  }
  channelToCoin(channel){
    return channel
  }
  getCoinName(channel){
    return this.exec('requestCoinId', Uint8Array.from([ channel ]))
      .then((reply) => {
        return String.fromCharCode.apply(null, reply.data);
      });
  };
  getCoinPosition(channel){
    return this.exec('requestCoinPosition', Uint8Array.from([ channel ]));
  }

  get eventCodes() {
    return {
      254: 'return',
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
    }
  }
}

module.exports = exports = CoinDetector;
