const canvas2 = document.getElementById('ldr');
let data2 = {
  labels: ['Status'],
  datasets: [{
    label: 'Luminosity',
    fill: true,
    lineTension: 0.1,
    backgroundColor: 'rgba(75,192,192,0.4)',
    borderColor: 'rgba(75,192,192,1)',
    borderCapStyle: 'butt',
    borderDash: [],
    borderDashOffset: 0.0,
    borderJoinStyle: 'miter',
    pointBorderColor: 'rgba(75,192,192,1)',
    pointBackgroundColor: '#fff',
    pointBorderWidth: 1,
    pointHoverRadius: 5,
    pointHoverBackgroundColor: 'rgba(75,192,192,1)',
    pointHoverBorderColor: 'rgba(220,220,220,1)',
    pointHoverBorderWidth: 2,
    pointRadius: 5,
    pointHitRadius: 10,
    data: [0],
  }],
};

const option2 = {
  showLines: true,
  scales: {
    yAxes: [{
      ticks: {
        beginAtZero: true,
        min: 0,
        max: 1023
      },
    }],
  },
};
const luminosityChart = Chart.Line(canvas2, {
  data: data2,
  options: option2,
});
