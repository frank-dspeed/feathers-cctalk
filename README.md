# Importent
Please don't use this its not active maintained and gets refactored to use node-cctalk its WIP code from a old project. https://github.com/direktspeed/node-cctalk and is now only used as Example implamentation using node-cctalk

## USE
1. git clone => /srv/drivers/cctalk-devices
2. copy edit config.example.js => config.js
3. systemctl enable $PWD/ccTalk.service
4. use via systemctl cctalk start stop

if error post a issue on github

## TODO
- Since this got last updated we implamented the cctalk protocol directly into node-serialport
so this can be now refactored to only use lates node-serialport release.
- This should be using beequeue as async jobqueue to stay responsive and be better debug able implamentation is started but not used at present.

