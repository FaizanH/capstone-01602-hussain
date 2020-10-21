(function(){
  const socket = io.connect();

  socket.on('event-ldr', function (data) {
//    console.log(data);
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
  
})();