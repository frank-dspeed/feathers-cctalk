const { execFile } = require('child_process');
const detectDevices = ()=> new Promise((resolve,reject) => {
  execFile('./detect_device.sh', ['--version'], (error, stdout, stderr) => {
    if (error) {
      reject(error);
    }
    if (stderr) {
      reject(stderr)
    }
    resolve(stdout);
  })
});

function parseDetectDevicesOutput(Output) {
  let deviceArray = Output.split('\n')
   .filter((dev)=> dev.length > 1)
   .map((dev) => {
     let devArray = dev.split(' - ')
     let port = devArray[0].trim()
     let id = devArray[1].trim()
     return { port, id }
   })
   return deviceArray;
}

function findDevice(deviceArray,searchFor) {
  whDevice = deviceArray.filter((port)=>port.id.indexOf(searchFor) > -1)
  if (whDevice.length === 0){
    return undefined
  }
  return whDevice[0]
}

var searchFor = 'wh_Berlin_EMP_8'

var detectDevicesExampleOutput = ()=> Promise.resolve('/dev/input/event6 - Weida_Hi-Tech_CoolTouchR_System \n' +
'/dev/input/mouse1 - Weida_Hi-Tech_CoolTouchR_System \n' +
'/dev/ttyUSB0 - wh_Berlin_EMP_8xx.14_whEMP0698366 \n' +
'/dev/input/event4 - _USB_Keyboard \n' +
'/dev/input/event5 - _USB_Keyboard \n' +
'/dev/input/event3 - SIGMACHIP_Usb_Mouse \n' +
'/dev/input/mouse0 - SIGMACHIP_Usb_Mouse \n')

function detectDevice(searchFor = 'wh_Berlin_EMP_8') {
  //detectDevicesExampleOutput()
  return detectDevices(searchFor)
    .then((Output)=> parseDetectDevicesOutput(Output))
    .then((deviceArray)=>findDevice(deviceArray,searchFor))
    .then((DEVICE)=>{
      if (DEVICE) {
        console.log(DEVICE)
        return DEVICE
      } else {
        return Promise.reject('not found DEVICE: ' + searchFor)
      }
    })
}

module.exports = detectDevice
/* Usage */
// arguments === 'wh_Berlin_EMP_8' === 'stringPart'
//detectDevice().then((DEVICE)=>{
  // Connect and execute Ready commands
  // Report unReady Devices once on Start
  // Report Devices Ready once on Start
//})
