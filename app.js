/*
 * Dependencies
 */

const express = require('express')
, http = require('http')
, app = express()
, async = require('async')
, server = require('http').createServer(app)
, io = require('socket.io').listen(server)
, ip = require('ip')
, rpiDhtSensor = require('rpi-dht-sensor')
, rpio = require('rpio');

/* Database */
const sqlite3 = require('sqlite3').verbose();
var db;
var sensordb = './db/sensorData.db';
var sqlitedb = require('./db/sqlitedb.js');

/* Environment */
app.set('port', process.env.PORT || 4000);
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('vendor', __dirname + '/vendor');
app.set('view engine', 'ejs');

/* View Routes */
app.use(express.static(__dirname.concat('/public')));
// app.use(express.static('public'));
// app.use('css', express.static('public/css'));
// app.use('js', express.static('public/css'));

app.get('/', (req, res) => {
    res.sendFile(__dirname+'/views/index.html', { title: "Index" });
});

// app.get('/login', (req, res) => {
//     res.sendFile(__dirname+'view/login.html', { title: "Login" });
// });

// app.get('/error', (req, res) => {
//     res.sendFile(__dirname+'view/404.html', { title: "Error" });
// });

// app.get('/home', (req, res) => {
//     res.sendFile(__dirname+'view/home.html', { title: "Home" });
// });

var serverip = ip.address();
setTimeout(() => {
    server.listen(app.get('port'), serverip, () => {
        console.log('Express server started on: ', serverip, ':', app.get('port'));
    });
}, 2000);

io.on('connection', function(socket) {
    console.log('client connected');

    setInterval(() => {
//    	// Read values from SPI ch0
//	rpio.spiBegin();
//	// Prepare TV buffer
//	var sendBuffer = new Buffer([0x01, (8 + 0 << 4), 0x01]);
//	// Send TV buffer via MOSI and MISO
//	var recieveBuffer = rpio.spiTransfer(sendBuffer, sendBuffer.length);
//	
//	// Extract val from output buffer
//	var junk = recieveBuffer[0],
//	    MSB = recieveBuffer[1],
//	    LSB = recieveBuffer[2];
//	
//	// Ignore 6b of MSB, shift and combine
//	var value = ((MSB & 3) << 8) + LSB;
//	console.log('ch' + ((sendBuffer[1] >> 4) - 8), '=', value);

rpio.spiBegin();

// Prepare TX buffer [trigger byte = 0x01] [channel 0 = 0x80 (128)] [dummy data = 0x01]
var txBuffer = new Buffer([0x01, (8 + 0 << 4), 0x01]); 

var rxBuffer = new Buffer(8);
// Send TX buffer to SPI MOSI and recieve RX buffer from MISO
rpio.spiTransfer(txBuffer, rxBuffer, txBuffer.length);

// Extract value from output buffer. Ignore first byte (junk). 
var junk = rxBuffer[0],
    MSB = rxBuffer[1],
    LSB = rxBuffer[2];

// Ignore first six bits of MSB, bit shift MSB 8 positions and 
// lastly combine LSB with MSB to get a full 10 bit value
var ldrVal = ((MSB & 3) << 8) + LSB; 

console.log('ch' + ((txBuffer[1] >> 4) - 8), '=', ldrVal);

    	// Read values from DHT sensor
        const dht = new rpiDhtSensor.DHT11(22);
        const readout = dht.read();
        const temp = (readout.temperature.toFixed(0));
        const humid = (readout.humidity.toFixed(0));

        socket.emit('dht11', {
            temp, humid,
        });

	socket.emit('ldr', {
	    ldrVal,
	});
    }, 3000);
});