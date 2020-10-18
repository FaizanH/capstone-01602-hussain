
(function(){
    const state = document.getElementById('state');
    const deviceInfo = document.getElementById('deviceInfo');

    const socket = io.connect();
  
    socket.on('status', function (data) {
        state.innerHTML = data.state;
        deviceInfo.innerHTML = data.deviceInfo;
    });
})();