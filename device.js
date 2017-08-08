var Promise = require('promise');
var CCBus = require('./bus');
var defaults = require('defaults-deep');

function CCDevice(bus, config) {
  if(!bus && !config) // initialize prototype only
    return;

  if(typeof bus == 'string')
   this.bus = new CCBus(bus, config);
  else
    this.bus = bus;

  this.config = defaults(config, { dest: 2 });
}

CCDevice.prototype =
{
  onBusReady: function onBusReady()
  {
    console.log("Warn: CCTalk device proxy doesn't override onBusReady()");
  },

  onData: function onData(command)
  {
    // Don't do anything by default
  },

  onBusClosed: function onBusClosed()
  {
    console.log("Warn: CCTalk device proxy doesn't override onBusClosed()");
  },

  sendCommand: function sendCommand(command)
  {
    command.dest = this.config.dest;
    return this.bus.sendCommand(command);
  }
};

CCDevice.commands = {
  simplePoll: 254,
  addressPoll: 253,
  addressClash: 252,
  addressChange: 251,
  addressRandom: 250
};

/*
1 - Core commands
P - Payout commands ( for serial hoppers )

255 Factory set-up and test
254 Simple poll //Core commands
253 Address poll //Multi-drop commands
252 Address clash //Multi-drop commands
251 Address change //Multi-drop commands
250 Address random //Multi-drop commands
249 Request polling priority //Coin Acceptor commands //Bill Validator commands
248 Request status //Coin Acceptor commands
247 Request variable set //Coin Acceptor commands //Payout commands ( for serial hoppers ) //Bill Validator commands //Changer / Escrow commands
246 Request manufacturer id //Core commands
245 Request equipment category id //Core commands
244 Request product code //Core commands
243 Request database version //Coin Acceptor commands
242 Request serial number //Core Plus commands
241 Request software revision //Core Plus commands
240 Test solenoids //Coin Acceptor commands //Changer / Escrow commands
239 Operate motors //Bill Validator commands //Changer / Escrow commands
238 Test output lines //Coin Acceptor commands //Bill Validator commands
237 Read input lines //Coin Acceptor commands //Bill Validator commands //Changer / Escrow commands
236 Read opto states //Coin Acceptor commands //Payout commands ( for serial hoppers ) //Bill Validator commands //Changer / Escrow commands
235 Read DH public key //Core Plus commands
234 Send DH public key //Core Plus commands
233 Latch output lines //Coin Acceptor commands //Bill Validator commands
232 Perform self-check //Coin Acceptor commands //Bill Validator commands //Changer / Escrow commands
231 Modify inhibit status //Coin Acceptor commands //Bill Validator commands //Changer / Escrow commands
230 Request inhibit status //Coin Acceptor commands //Bill Validator commands //Changer / Escrow commands
229 Read buffered credit or error codes //Coin Acceptor commands
228 Modify master inhibit status //Coin Acceptor commands //Bill Validator commands
227 Request master inhibit status //Coin Acceptor commands //Bill Validator commands
226 Request insertion counter //Coin Acceptor commands //Bill Validator commands
225 Request accept counter //Coin Acceptor commands //Bill Validator commands
224 Request encrypted product id //Core Plus commands
223 Modify encrypted inhibit and override registers //Coin Acceptor commands
222 Modify sorter override status //Coin Acceptor commands
221 Request sorter override status //Coin Acceptor commands
220 ACMI encrypted data //Core Plus commands
219 Enter new PIN number //Coin Acceptor commands //Payout commands ( for serial hoppers )
218 Enter PIN number //Coin Acceptor commands //Payout commands ( for serial hoppers )
217 Request payout high / low status //Payout commands ( for serial hoppers )
216 Request data storage availability //Core Plus commands
215 Read data block //Coin Acceptor commands //Payout commands ( for serial hoppers ) //Bill Validator commands //Changer / Escrow commands
214 Write data block //Coin Acceptor commands //Payout commands ( for serial hoppers ) //Bill Validator commands //Changer / Escrow commands
213 Request option flags //Coin Acceptor commands //Bill Validator commands
212 Request coin position //Coin Acceptor commands
211 Power management control
210 Modify sorter paths //Coin Acceptor commands //Changer / Escrow commands
209 Request sorter paths //Coin Acceptor commands //Changer / Escrow commands
208 Modify payout absolute count //Payout commands ( for serial hoppers )
207 Request payout absolute count //Payout commands ( for serial hoppers )
206
205
204 Meter control
203 Display control
202 Teach mode control //Coin Acceptor commands //Bill Validator commands
201 Request teach status //Coin Acceptor commands //Bill Validator commands
200 ACMI unencrypted product id //Core Plus commands
199 Configuration to EEPROM //Coin Acceptor commands
198 Counters to EEPROM //Coin Acceptor commands
197 Calculate ROM checksum //Core Plus commands
196 Request creation date //Core Plus commands
195 Request last modification date //Core Plus commands
194 Request reject counter //Coin Acceptor commands //Bill Validator commands
193 Request fraud counter //Coin Acceptor commands //Bill Validator commands
192 Request build code //Core commands
191 Keypad control
190
189 Modify default sorter path //Coin Acceptor commands
188 Request default sorter path //Coin Acceptor commands
187 Modify payout capacity //Payout commands ( for serial hoppers )
186 Request payout capacity //Payout commands ( for serial hoppers )
185 Modify coin id //Coin Acceptor commands //Changer / Escrow commands
184 Request coin id //Coin Acceptor commands //Changer / Escrow commands
183 Upload window data //Coin Acceptor commands
182 Download calibration info //Coin Acceptor commands
181 Modify security setting //Coin Acceptor commands //Bill Validator commands
180 Request security setting //Coin Acceptor commands //Bill Validator commands
179 Modify bank select //Coin Acceptor commands //Bill Validator commands
178 Request bank select //Coin Acceptor commands //Bill Validator commands
177 Handheld function //Coin Acceptor commands
176 Request alarm counter //Coin Acceptor commands
175 Modify payout float //Payout commands ( for serial hoppers ) //Changer / Escrow commands
174 Request payout float //Payout commands ( for serial hoppers ) //Changer / Escrow commands
173 Request thermistor reading //Coin Acceptor commands //Payout commands ( for serial hoppers )
172 Emergency stop //Payout commands ( for serial hoppers )
171 Request hopper coin //Payout commands ( for serial hoppers )
170 Request base year //Core Plus commands
169 Request address mode //Core Plus commands
168 Request hopper dispense count P
167 Dispense hopper coins //Payout commands ( for serial hoppers )
166 Request hopper status //Payout commands ( for serial hoppers )
165 Modify variable set P //Changer / Escrow commands
164 Enable hopper P
163 Test hopper P
162 Modify inhibit and override registers //Coin Acceptor commands
161 Pump RNG P
160 Request cipher key P
159 Read buffered bill events //Bill Validator commands
158 Modify bill id //Bill Validator commands
157 Request bill id //Bill Validator commands
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
137 Switch encryption code //Core Plus commands
136 Store encryption code //Core Plus commands
135 Set accept limit //Coin Acceptor commands
134 Dispense hopper value P
133 Request hopper polling value P
132 Emergency stop value P
131 Request hopper coin value P
130 Request indexed hopper dispense count P
129 Read barcode data //Bill Validator commands
128 Request money in //Changer / Escrow commands
127 Request money out //Changer / Escrow commands
126 Clear money counters //Changer / Escrow commands
125 Pay money out //Changer / Escrow commands
124 Verify money out //Changer / Escrow commands
123 Request activity register //Changer / Escrow commands
122 Request error status //Changer / Escrow commands
121 Purge hopper //Changer / Escrow commands
120 Modify hopper balance //Changer / Escrow commands
119 Request hopper balance //Changer / Escrow commands
118 Modify cashbox value //Changer / Escrow commands
117 Request cashbox value //Changer / Escrow commands
116 Modify real time clock //Changer / Escrow commands
115 Request real time clock //Changer / Escrow commands
114 Request USB id //Core Plus commands
113 Switch baud rate //Core Plus commands
112 Read encrypted events //Coin Acceptor commands //Bill Validator commands
111 Request encryption support //Core commands
110 Switch encryption key //Core Plus commands
109 Request encrypted hopper status //Payout commands ( for serial hoppers )
108 Request encrypted monetary id //Coin Acceptor commands //Bill Validator commands
107 Operate escrow //Changer / Escrow commands
106 Request escrow status //Changer / Escrow commands
105 Data stream //Core Plus commands
104 Request service status //Changer / Escrow commands
103 Expansion header 4
102 Expansion header //Multi-drop commands
101 Expansion header //Core Plus commands
100 Expansion header //Core commands
99 Application specific to 20
19 to 7 Reserved
6 BUSY message //Core Plus commands
5 NAK message //Core Plus commands
4 Request comms revision //Core Plus commands
3 Clear comms status variables //Coin Acceptor commands //Payout commands ( for serial hoppers ) //Bill Validator commands
2 Request comms status variables //Coin Acceptor commands //Payout commands ( for serial hoppers ) //Bill Validator commands
1 Reset device //Core Plus commands
0 Return message
*/
/*
Public Domain Document
ccTalk Generic Specification - Crane Payment Solutions - Page 7 of 87 - ccTalk Part 3 v4.7.doc
While every effort has been made to ensure the accuracy of this document no liability of any kind is
accepted or implied for any errors or omissions that are contained herein.
1.1 Core Commands
These are the commands which should be supported by all ccTalk peripherals. They
*/







module.exports = exports = CCDevice;
