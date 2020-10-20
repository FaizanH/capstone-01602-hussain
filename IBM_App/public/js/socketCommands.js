
(function(){
    // const deviceInfo = document.querySelectorAll('.deviceInfo');
    const eventData_temp = document.getElementById('deviceSensorData1');
    const eventData_ldr = document.getElementById('deviceSensorData2');
    const eventData_gps = document.getElementById('deviceSensorData3');
    const deviceslist = document.getElementById('deviceslist');

    const id = document.querySelectorAll('.id');
    const type = document.getElementById('type');
    const gateway = document.getElementById('gateway');
    const state = document.querySelectorAll('.state');

    const ip = document.querySelectorAll('.ip');
    const serial = document.getElementById('serial');
    const manufacturer = document.getElementById('manufacturer');
    const model = document.getElementById('model');
    const description = document.getElementById('description');
    const code = document.querySelectorAll('.sku');
    const metadata = document.getElementById('metadata');

    const socket = io.connect();

    socket.on('status', function (data) {
        state.innerHTML = data.state;
        // deviceInfo.innerHTML = data.deviceInfo;

    });
    socket.on('event', function (data) {
        eventData_temp.innerHTML = data.temp;
        eventData_ldr.innerHTML = data.ldr;
        eventData_gps.innerHTML = data.gps;
    });
    socket.on('devices', function(data) {
        deviceslist.innerHTML = data.deviceslist;
    });
    socket.on('device', function(data) {
        id.forEach(function(el) {
            el.innerHTML = data.id;
        });
        type.innerHTML = data.type;
        gateway.innerHTML = data.gateway;
        state.forEach(function(el5) {
            el5.innerHTML = data.state;
        });
    });
    socket.on('deviceInfoOnConnect', function(data) {
        ip.forEach(function(el) {
            el.innerHTML = data.ip;
        });
    });
    socket.on('deviceInfoOnStandby', function(data) {
        serial.innerHTML = data.serial;
        manufacturer.innerHTML = data.manufacturer;
        model.innerHTML = data.model;
        description.innerHTML = data.description;
        code.forEach(function(el) {
            el.innerHTML = data.code;
        });
        metadata.innerHTML = data.metadata;
    });
})();