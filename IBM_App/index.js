const { ApplicationClient, ApplicationConfig } = require('@wiotp/sdk');

/*
 * Dependencies
 */

const express = require('express')
	, http = require('http')
	, app = express()
	, async = require('async')
	, server = require('http').createServer(app)
	, io = require('socket.io').listen(server)
	, ip = require('ip');

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

initializeClient();

// io.on('connection', function (socket) {
//     console.log('client connected');
    
// 	setInterval(() => {
//         // Do client stuff here
//         console.log("Hello, friend.")
//     }, 3000);
// });

function initializeClient() {
    if (appClient != null) {
        console.log("Client is already initialized");
    }
    else {
        // Configure App Client
        appConfig = ApplicationConfig.parseConfigFile("Config_ApplicationClient.yaml");
        startClient();
    }
}

function getDeviceCommandData(device) {
    console.log(`Command recieved: ${device.data}\n`);
}

function startClient() {
    appClient = new ApplicationClient(appConfig);
    // Use sockets to push information to front-end
    // Event callbacks
    // appClient.on("deviceEvent", function (typeId, deviceId, eventId, format, payload) {
    //     console.log("Device Event from :: " + typeId + " : " + deviceId + " of event " + eventId + " with format " + format + " - payload = " + payload);
    // });
    if (appClient == null) {
        console.log("Client is not initialized!");
        return;
    }
    appClient.connect();

    // Connectivity callbacks
    appClient.on("connect", function () {
        // document.getElementById("status").innerHTML = "CONNECTED";
        console.log("App Connected");
        // appClient.commandCallback = getDeviceData;
        appClient.subscribeToEvents("raspi", "RaspiMeshNode1","sensor","json", 0);
    });

    appClient.on("deviceEvent", function (typeId, deviceId, eventId, format, payload) {
        let jsonData = JSON.stringify(payload);
        let str = `${eventId} event recieved from ${deviceId}:\n ${jsonData}\n`;
        console.log(str);
    });

    // appClient.on("reconnect", function () {
    //     // document.getElementById("status").innerHTML = "RECONNECTING";
    //     console.log("Reconnecting");
    // });
    // appClient.on("close", function () {
    //     // document.getElementById("status").innerHTML = "DISCONNECTED";
    //     console.log("Disconnected");
    // });
    // appClient.on("offline", function () {
    //     // document.getElementById("status").innerHTML = "OFFLINE";
    //     console.log("Offline");
    // });

    // Error callback
    appClient.on("error", function (err) {
        // document.getElementById("lastError").innerHTML = err;
        console.log("Error: " + err);
    });
}

// function connect() {
//     if (appClient == null) {
//         document.getElementById("lastError").innerHTML = "Client is not initialized!";
//         return;
//     }
//     appClient.connect();
// }
// function disconnect() {
//     if (appClient == null) {
//         document.getElementById("lastError").innerHTML = "Client is not initialized!";
//         return;
//     }
//     appClient.disconnect();
// }
// function subscribeToEvents() {
//     if (appClient == null) {
//         document.getElementById("lastError").innerHTML = "Need to initialize client before you can subscribe to events!";
//         return;
//     }
//     appClient.subscribeToEvents("+", "+", "+", "+", 0);
// }