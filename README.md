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

