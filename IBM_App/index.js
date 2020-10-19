const { ApplicationClient, ApplicationConfig, RegistryClient } = require('@wiotp/sdk');

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
    , request = require('request')
    , fs = require('fs')
    , yaml = require('js-yaml');

let appClient = null;
let appConfig = null;

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

// app.get('/', (req, res) => {
// 	res.sendFile(__dirname + '/views/index.html', { title: "Index" });
// });
// app.get('/login', (req, res) => {
//     res.sendFile(__dirname + '/views/login.html', { title: "Login" });
// });
app.get('/dashboard', (req, res) => {
	res.sendFile(__dirname + '/views/dashboard.html', { title: "Dashboard" });
});
// app.get('/error', (req, res) => {
//     res.sendFile(__dirname+'/views/404.html', { title: "Error" });
// });

var serverip = ip.address();
setTimeout(() => {
	server.listen(app.get('port'), serverip, () => {
		console.log('Express server started on: ', serverip, ':', app.get('port'));
	});
}, 2000);

// // Return promise for connection
// io.connectAsync = function(url, options) {
//     return new Promise(function(resolve, reject) {
//         io.connect(url, options);
//         io.once('connect', function(socket) {
//             resolve(socket);
//         });
//         io.once('connect_error', function() {
//             reject(new Error('connect_error'));
//         });
//         io.once('connect_timeout', function() {
//             reject(new Error('connect_timeout'));
//         });
//     });
// }

// io.connectAsync().then(function(socket) {

// })
io.on('connection', function (socket) {
    console.log('front-end client connected');

    appConfig = ApplicationConfig.parseConfigFile("Config_ApplicationClient.yaml");
    appClient = new ApplicationClient(appConfig);
    appClient.connect();
    console.log("Client Initialized");
    startClient();

    // REST API - Get all devices
    // Used to manage all devices on platform
    try {
        let fileContents = fs.readFileSync('Config_RESTClient.yaml', 'utf8');
        let data = yaml.safeLoad(fileContents);
        let org = data.identity.orgId
        , api = data.auth.key
        , tok = data.auth.token;
        // Do API call
        GETDEVICES(org, api, tok).then(function(response) {
            let deviceslist = response.results[0].deviceId;
            io.emit('devices', {
                deviceslist,
            });
        });
    } catch (e) {
        console.log(e);
    }
    // Populate table with nodes

    // let state = "GETTING DEVICE STATE...";
    // let deviceInfo = "WAITING FOR INITIALISATION...";
    // let temp = "WAITING FOR INITIALISATION...";
    // let ldr = "WAITING FOR INITIALISATION...";
    // let gps = "WAITING FOR INITIALISATION...";
    // let deviceslist = "WAITING FOR INITIALISATION...";
    // socket.emit('status', {
    //     state, deviceInfo,
    // });
    // socket.emit('event', { // changed to socket instead of io.
    //     temp, ldr, gps,
    // });
    // socket.emit('devices', {
    //     deviceslist,
    // });
});

function startClient() {
    // Connectivity callbacks
    appClient.on("connect", function () {
        console.log("App Connected");
        // appClient.commandCallback = getDeviceData;
        appClient.subscribeToEvents("raspi", "RaspiMeshNode1","sensor","json", 0);
        // appClient.subscribeToDeviceStatus("raspi", "RaspiMeshNode1", 0);
    });
    appClient.on("deviceEvent", function (typeid, deviceId, eventId, format, payload) {
        let str = `${eventId} event recieved from ${deviceId}:\n ${payload}\n`;
        console.log(str);
        let temp = "temp: "+JSON.parse(payload).DHT_Temp;
        let ldr = "ldr: "+ JSON.parse(payload).LDR_Lum;
        let gps = "gps: "+ JSON.parse(payload).GPS_Co;

        io.emit('event', {
            temp, ldr, gps,
        });
    });
    // appClient.on("deviceStatus", function (typeId, deviceId, payload) {
    //     // document.getElementById("status").innerHTML = "OFFLINE";
    //     let str = JSON.parse(payload);
    //     let state = `${deviceId} Status: ` + str.Action;
    //     if (str.Action == "Connect") {
    //         state = `${deviceId} Connected : ` + str.Time;
    //     }
    //     if (str.Action == "Disconnect") {
    //         state = `${deviceId} Disconnected \n Last Connected: ` + str.Time;
    //     }
    //     let deviceInfo = str.ClientAddr + ", SecureToken: " + str.Secure;

    //     console.log(state);
    //     console.log(deviceInfo);

    //     io.emit('status', {
	// 		state, deviceInfo,
	// 	});
    // });

    // appClient.on("reconnect", function () {
    //     // document.getElementById("status").innerHTML = "RECONNECTING";
    //     console.log("Reconnecting");
    // });
    // appClient.on("close", function () {
    //     // document.getElementById("status").innerHTML = "DISCONNECTED";
    //     console.log("Disconnected");
    //     let status = "DISCONNECTED";
    //     io.emit('status', {
	// 		status,
	// 	});
    // });
    // appClient.on("offline", function () {
    //     // document.getElementById("status").innerHTML = "OFFLINE";
    //     console.log("Offline");
    //     let status = "OFFLINE";
    //     io.emit('status', {
	// 		status,
	// 	});
    // });

    // Error callback
    appClient.on("error", function (err) {
        console.log("Error: " + err);
    });
}

function GETDEVICES(orgId, APIKEY, AUTHTOKEN) {
    return new Promise((resolve, reject) => {
        const options = {
            async: true,
            crossDomain: true,
            url: "https://" + orgId + ".internetofthings.ibmcloud.com/api/v0002/bulk/devices/",
            method: "GET",
            contentType: "application/json",
            headers: {
                "Authorization": "Basic " + Buffer.from(APIKEY + ":" + AUTHTOKEN).toString('base64')
            },
        };

        request(options, function (error, response, body) {
            // in addition to parsing the value, deal with possible errors
            if (error) return reject(error);
            try {
                // JSON.parse() can throw an exception if not valid JSON
                resolve(JSON.parse(body));
            } catch(e) {
                reject(e);
            }
        });
    });
}

function getDeviceCommandData(device) {
    console.log(`Command recieved: ${device.data}\n`);
}