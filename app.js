const { DeviceClient, DeviceConfig } = require('@wiotp/sdk');
const { v4: uuidv4 } = require('uuid');

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
	, rpio = require('rpio')
	, SerialPort = require("serialport")
	, GPS = require("gps");

/* IBM Watson IoT Platform JS SDK */
const argv = require('yargs')
    .option('quickstart', {
        alias: 'q',
        description: 'Connects the sample device to quickstart',
        type: 'boolean',
    })
    .option('configFile', {
        alias: 'cfg',
        description: 'Connects the sample device using the Config_Sample.yaml file',
        type: 'config',
    })
    .help()
    .alias('help', 'h')
    .epilogue("If neither the quickstart or configFile parameter is provided the device will attempt to parse the configuration from environment variables.")
    .argv;

let deviceConfig = null;
let deviceClient = null;

/* Database */
// const sqlite3 = require('sqlite3').verbose();
// var db;
// var sensordb = './db/sensorData.db';
// var sqlitedb = require('./db/sqlitedb.js');

/* GPS Init */
Readline = SerialPort.parsers.Readline;
const port = new SerialPort("/dev/ttyS0", {
	baudRate: 9600,
	parser: new Readline('\r\n')
});
const gps = new GPS();

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
	res.sendFile(__dirname + '/views/index.html', { title: "Index" });
});
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html', { title: "Login" });
});
app.get('/dashboard', (req, res) => {
	res.sendFile(__dirname + '/views/dashboard.html', { title: "Dashboard" });
});
app.get('/error', (req, res) => {
    res.sendFile(__dirname+'/views/404.html', { title: "Error" });
});

var serverip = ip.address();
setTimeout(() => {
	server.listen(app.get('port'), serverip, () => {
		console.log('Express server started on: ', serverip, ':', app.get('port'));
	});
}, 2000);

if (argv.quickstart) {
    let identity = {orgId:"quickstart", typeId:"nodejsSample", deviceId:uuidv4()};
    let options = {
        logLevel: "info",
    };
    let auth = null; //As quickstart does not support authentication
    deviceConfig = new DeviceConfig(identity, auth, options)
    startClient()
    console.log("\x1b[35m"); //Text formatting
    console.log("Welcome to IBM Watson IoT Platform Quickstart, view a vizualization of live data from this device at the URL below:");
    console.log("https://quickstart.internetofthings.ibmcloud.com/#/device/"+(identity["deviceId"])+"/sensor/");
    console.log("\x1b[0m"); //Text formatting
}
else if(argv.configFile)
{
    deviceConfig = DeviceConfig.parseConfigFile("Config_RaspiMeshNode1.yaml");
    startClient();
}
else 
{
     // Intialize using:
            // export WIOTP_IDENTITY_ORGID=myOrg
            // export WIOTP_IDENTITY_TYPEID=myType
            // export WIOTP_IDENTITY_DEVICEID=myDevice
            // export WIOTP_AUTH_TOKEN=myToken
    deviceConfig = DeviceConfig.parseEnvVars();
    startClient();
}

function startClient(){
    deviceClient = new DeviceClient(deviceConfig);
    deviceClient.connect();
    console.log("Press {ctrl + c} to disconnect at any time.")
    var interval = 3
    setInterval(sendInformation, interval*1000)
}

function getSensorData() {
	let sensorData = {
		"DHT Temperature": "null",
		"DHT Humidity": "null",
		"LDR Luminosity": "null",
		"GPS Coordinates": "null",
	};
	// Read values from SPI ch0
	rpio.spiBegin();

	// Prepare TX buffer [trigger byte = 0x01] [channel 0 = 0x80 (128)] [dummy data = 0x01]
	var txBuffer = new Buffer.from([0x01, (8 + 0 << 4), 0x01]);
	var rxBuffer = new Buffer.alloc(8);
	// Send TX buffer to SPI MOSI and recieve RX buffer from MISO
	rpio.spiTransfer(txBuffer, rxBuffer, txBuffer.length);
	// Extract value from output buffer. Ignore first byte (junk). 
	var junk = rxBuffer[0],
		MSB = rxBuffer[1],
		LSB = rxBuffer[2];
	// Ignore first six bits of MSB, bit shift MSB 8 positions and 
	// lastly combine LSB with MSB to get a full 10 bit value
	var ldrVal = ((MSB & 3) << 8) + LSB;
	sensorData['LDR'] = ldrVal;

	// Read values from DHT sensor
	const dht = new rpiDhtSensor.DHT11(22);
	const readout = dht.read();
	const temp = (readout.temperature.toFixed(0));
	const humid = (readout.humidity.toFixed(0));

	sensorData['DHT Temperature'] = temp;
	sensorData['DHT Humidity'] = humid;

	return sensorData;
}

function sendInformation() {
	let data = getSensorData();
	console.log(data);
	// publishEvent function publishes data from the node to MQTT Topic ("iot-2/evt/%s/fmt/%s", eventId, format)
	deviceClient.publishEvent("sensor", "json", data, 0, NodePublishConfirmed());
}

function NodePublishConfirmed(){
	console.log("Data received by Server");
}

io.on('connection', function (socket) {
	console.log('client connected');
	setInterval(() => {
		// Previous local client code - Moved to Sensors function
		let data = getSensorData();
		let temp = data['DHT Temperature'];
		let humid = data['DHT Humidity'];
		let ldrVal = data['LDR Luminosity'];

		socket.emit('dht11', {
			temp, humid,
		});
		socket.emit('ldr', {
			ldrVal,
		});
	}, 3000);
});

// Read GPS co-ordinates from /dev/ttyS0
gps.on("data", async data => {
	const latitude = data.lat,
		longitude = data.lon;
	if (data.type == "GGA") {
		if (data.quality != null) {
			console.log("[" + data.lat + ", " + data.lon + "]");
			io.emit('gprsdat', {
				latitude, longitude,
			});
		}
		else {
			console.log("NO GPS FIX AVAILABLE");
		}
	}
});

port.on("data", function (data) {
	gps.updatePartial(data);
});