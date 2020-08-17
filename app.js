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
app.use(express.static('public'));
app.use('css', express.static('public/css'));
app.use('js', express.static('public/css'));

app.get('/', (req, res) => {
    res.sendFile(__dirname+'view/index.html', { title: "Index" });
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname+'view/login.html', { title: "Login" });
});

app.get('/error', (req, res) => {
    res.sendFile(__dirname+'view/404.html', { title: "Error" });
});

app.get('/home', (req, res) => {
    res.sendFile(__dirname+'view/home.html', { title: "Home" });
});

io.on('connection', function(socket) {
    var user = false;
    console.log('client connected');

    socket.on('save data', (data) => {
        console.log('successfully saved data');
    });
});

var serverip = ip.address();
setTimeout(() => {
    server.listen(app.get('port'), serverip, () => {
        console.log('Express server started on: ', serverip, ':', app.get('port'));
    });
}, 2000);