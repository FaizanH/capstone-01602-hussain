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
// app.use('js', express.static('public/js'));

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

io.on('connection', function (socket) {
    console.log('front-end client connected');

    appConfig = ApplicationConfig.parseConfigFile("Config_ApplicationClient.yaml");
    appClient = new ApplicationClient(appConfig);
    appClient.connect();
    console.log("Client Initialized");

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
            console.log(response);
            console.log(response.results[0].deviceInfo);
            console.log(response.results[0].registration);
            console.log(response.results[0].status);
            console.log(response.results[0].metadata);
            let deviceslist = response.results[0].deviceId;
            let state = `Connected: ${response.results[0].status.alert.enabled}`;
            let id = response.results[0].deviceId;
            let type = response.results[0].typeId;
            let gateway = "";

            let serial = response.results[0].deviceInfo.serialNumber;
            let manufacturer = response.results[0].deviceInfo.manufacturer;
            let model = response.results[0].deviceInfo.model;
            let description = response.results[0].deviceInfo.description;
            let code = response.results[0].metadata.item_specification.sku;
            let metadata = JSON.stringify(response.results[0].metadata);
            console.log(metadata);
            console.log(code);
            // let descriptiveLocation = JSON.stringify(response.results[0].deviceInfo.descriptiveLocation);
            // let registration = JSON.stringify(response.results[0].registration);
            if (response.results[0].status.alert.enabled == true) {
                state = `Connected : ` + response.results[0].status.alert.timestamp;
            }
            if (response.results[0].status.alert.enabled == false) {
                state = `Disconnected \n Last Connected: ` + response.results[0].status.alert.timestamp;
            }

            socket.emit('devices', {
                deviceslist,
            });
            socket.emit('device', {
                id,
                type,
                gateway,
                state,
            });
            socket.emit('deviceInfoOnStandby', {
                serial,
                manufacturer,
                model,
                description,
                // fwversion,
                // descriptiveLocation,
                code,
                metadata,
                // registration,
            });
        });
    } catch (e) {
        console.log(e);
    }
    startClient();
});

function startClient() {
    // Connectivity callbacks
    appClient.on("connect", function () {
        console.log("App Connected");
        appClient.subscribeToEvents("raspi", "RaspiMeshNode1","sensor","json", 0);
        appClient.subscribeToDeviceStatus("raspi", "RaspiMeshNode1", 0);
    });
    appClient.on("deviceEvent", function (typeid, deviceId, eventId, format, payload) {
        let str = `${eventId} event recieved from ${deviceId}:\n ${payload}\n`;
        console.log(str);
        let temp = JSON.parse(payload).DHT_Temp;
        let humid = JSON.parse(payload).DHT_Hum;
        let ldrVal = JSON.parse(payload).LDR_Lum;
        let gps = JSON.parse(payload).GPS_Co;

        io.emit('event-dht11', {
            temp, humid,
        });
        io.emit('event-ldr', {
            ldrVal,
        });
        io.emit('event-gps', {
            gps,
        });
    });
    appClient.on("deviceStatus", function (typeId, deviceId, payload) {
        let str = JSON.parse(payload);
        console.log(str);

        let state = `${deviceId} Status: ` + str.Action;
        let lastUpdated = str.Time;
        let id = deviceId;
        let type = typeId;
        let gateway = "";

        if (str.Action == "Connect") {
            state = "Connected";
        }
        if (str.Action == "Disconnect") {
            state = "Disconnected";
        }
        let ip = str.ClientAddr + ", SecureToken: " + str.Secure;

        io.emit('status', {
			state, lastUpdated,
        });
        io.emit('device', {
            id,
            type,
            gateway,
            state,
        });
        io.emit('deviceInfoOnConnect', {
            ip,
        });
    });

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