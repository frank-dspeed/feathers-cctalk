# Importent
Please don't use this its not active maintained and gets refactored to use node-cctalk its WIP code from a old project. https://github.com/frank-dspeed/esnext-cctalk/blob/main/src/cctalk.js and is now only used as Example implamentation Higher Level Implementation like it got done in some hotels.
and Resorts. There was a need to manage diffrent devices in many diffrent rooms.

## USE
1. git clone => /srv/drivers/cctalk-devices
2. copy edit config.example.js => config.js
3. systemctl enable $PWD/ccTalk.service
4. use via systemctl cctalk start stop

if error post a issue on github

## TODO
- This should be using beequeue as async jobqueue to stay responsive and be better debug able implamentation is started but not used at present.



## Historical Package.json
Removed for Security needs

```json
{
  "name": "feathers-cctalk",
  "version": "0.1.9",
  "description": "Interface coin acceptors and other hardware speaking ccTalk",
  "keywords": [
    "serial",
    "usb",
    "money",
    "coins",
    "hardware",
    "cctalk"
  ],
  "email": "frank@dspeed.eu",
  "author": "Frank Lemanschik",
  "main": "index.js",
  "dependencies": {
    "bee-queue": "^1.1.0",
    "node-cctalk": "git+https://github.com/direktspeed/node-cctalk.git#master",
    "node-cctalk-command": "git+https://github.com/direktspeed/node-cctalk-command.git#master",
    "class-nonew-decorator": "^1.0.6",
    "debug": "^3.0.1",
    "defaults-deep": "^0.2.3",
    "feathers-client": "^2.3.0",
    "promise": "^7.1.1",
    "promise-timeout": "^1.0.0",
    "serialport": "git+https://github.com/direktspeed/node-serialport.git#add_cctalk_parsers",
    "serialport-parsers-cctalk": "git+https://github.com/direktspeed/serialport-parsers-cctalk.git",
    "socket.io-client": "^4.0.0"
  },
  "scripts": {
    "deploy": "rsync -avzh --exclude-from='./RSYNC_EXCLUDES' ./ remote-pc-hostname:/srv/drivers/cctalk-devices && ssh markus DEBUG=* node /srv/peep-server/batch/sync-drivers.js;",
    "start": "node .",
    "systemctl": "systemctl enable $PWD/ccTalk.service",
    "debug": "DEBUG=* node ."
  },
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/direktspeed/feathers-cctalk.git"
  }
}
```
