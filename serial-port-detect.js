var SerialPort = require('serialport');

var searchFor = 'wh'
SerialPort.list()
  .then((ports)=>ports.filter((port)=>port.pnpId !== undefined))
  .then((ports)=>ports.filter((port)=>port.pnpId.indexOf(searchFor) > -1))
  .then(ports=>{
    /*
    [ { manufacturer: 'wh Berlin',
        serialNumber: 'whEMP0698323',
        pnpId: 'usb-wh_Berlin_EMP_8xx.14_whEMP0698323-if00-port0',
        locationId: undefined,
        vendorId: '0403',
        productId: 'EMP 8xx.14',
        comName: '/dev/ttyUSB0' } ]
     */
    return ports[0]
  })
  .then(console.log)
  .catch(console.log)
