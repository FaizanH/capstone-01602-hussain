
(function(){
    // const deviceslist = document.getElementById('deviceslist');

    const id = document.querySelectorAll('.id');
    const state = document.querySelectorAll('.state');
    const lastUpdated = document.querySelectorAll('.lastUpdated')
    const ip = document.querySelectorAll('.ip');
    const code = document.querySelectorAll('.sku');

    const serial = document.getElementById('serial');
    const manufacturer = document.getElementById('manufacturer');
    const model = document.getElementById('model');
    const description = document.getElementById('description');
    const metadata = document.getElementById('metadata');
    const type = document.getElementById('type');
    const gateway = document.getElementById('gateway');
    const gprs = document.getElementById("gprs");

    const socket = io.connect();

    socket.on('status', function (data) {
        state.forEach(function(el5) {
            el5.innerHTML = data.state;
        });
        lastUpdated.forEach(function(el6) {
            el6.innerHTML = data.lastUpdated;
        });
    });
    socket.on('event-dht11', function(data) {
        const d = new Date();
        if (tempChart.data.datasets[0].data.length < 10) {
          tempChart.data.datasets[0].data.push(data.temp);
          tempChart.data.labels.push(d.getMonth() + 1 + '/' + d.getDate() + '\r\n' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
          tempChart.update();
        } else {
          tempChart.data.datasets[0].data.shift();
          tempChart.data.labels.shift();
          tempChart.data.datasets[0].data.push(data.temp);
          tempChart.data.labels.push(d.getMonth() + 1 + '/' + d.getDate() + '\r\n' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
          tempChart.update();
        }
        if (tempChart.data.datasets[1].data.length < 10) {
          tempChart.data.datasets[1].data.push(data.humid);
          tempChart.update();
        } else {
          tempChart.data.datasets[1].data.shift();
          tempChart.data.datasets[1].data.push(data.humid);
          tempChart.update();
        }
    });
    socket.on('event-ldr', function(data) {
        const d = new Date();
        if (luminosityChart.data.datasets[0].data.length < 10) {
          luminosityChart.data.datasets[0].data.push(data.ldrVal);
          luminosityChart.data.labels.push(d.getMonth() + 1 + '/' + d.getDate() + '\r\n' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
          luminosityChart.update();
        } else {
          luminosityChart.data.datasets[0].data.shift();
          luminosityChart.data.labels.shift();
          luminosityChart.data.datasets[0].data.push(data.ldrVal);
          luminosityChart.data.labels.push(d.getMonth() + 1 + '/' + d.getDate() + '\r\n' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
          luminosityChart.update();
        }
    });
    socket.on('event-gps', function(data) {
        gprs.innerHTML = data.gps;
    });
    socket.on('device', function(data) {
        id.forEach(function(el) {
            el.innerHTML = data.id;
        });
        type.innerHTML = data.type;
        gateway.innerHTML = data.gateway;
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