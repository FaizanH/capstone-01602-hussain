
(function(){
    const state = document.getElementById('state');
    const deviceInfo = document.getElementById('deviceInfo');
    const eventData_temp = document.getElementById('deviceSensorData1');
    const eventData_ldr = document.getElementById('deviceSensorData2');
    const eventData_gps = document.getElementById('deviceSensorData3');
    const deviceslist = document.getElementById('deviceslist');

    const socket = io.connect();
  
    socket.on('status', function (data) {
        state.innerHTML = data.state;
        deviceInfo.innerHTML = data.deviceInfo;
    });
    socket.on('event', function (data) {
        eventData_temp.innerHTML = data.temp;
        eventData_ldr.innerHTML = data.ldr;
        eventData_gps.innerHTML = data.gps;
    });
    socket.on('devices', function(data) {
        deviceslist.innerHTML = data.deviceslist;
    });
})();