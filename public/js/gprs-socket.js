//const gprsCoordinates = {
//	longitude: '',
//	latitude: '',
//};

(function(){
  const gprsLat = document.getElementById("gprsLat");
  const gprsLon = document.getElementById("gprsLon");
  const socket = io.connect();

  socket.on('gprsdat', function (data) {
//    console.log(data);
	gprsLat.innerHTML = data.latitude;
	gprsLon.innerHTML = data.longitude;
  });
  
})();