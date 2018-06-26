
window.onload = function() {

  var ws = new WebSocket("ws://127.0.0.1:8099");

  ws.onopen = function(evt) { 
    console.log("Connection open ..."); 
    ws.send("Hello WebSockets!");
  };

  ws.onmessage = function(evt) {
    var json = JSON.parse(evt.data)
    handleData(json)
    // console.log( "Received Message: " + evt.data);
    // ws.close();
  };

  ws.onclose = function(evt) {
    console.log("Connection closed.");
  };

}

var CLIENT = {
  _data: {},
  _keys: {}
}


function handleData(json) {
  // console.log(json)
  var newData = DeltaParser.onAction(json.action, json.table, 'XBTUSD', CLIENT, json);
  // newData = newData.reverse()
  if (newData.length > 5000) {
    newData = newData.slice(CONFIG.s0, CONFIG.s1)
  }
  // HC.drawChart(newData)
  drawDepthChart(newData)
}

// Chart.js

var depthChart = null

function coverDepthDataForChart(data) {
  const x = []
  const y = []
  const yRed = []
  const yGreen = []
  data.forEach(item => {
    var isB = item.side == 'Buy'
    x.push(item.price)
    y.push(item.size)
    yRed.push(isB ? null : item.size)
    yGreen.push(isB ? item.size : null)
  })
  return { x, y, yRed, yGreen }
}

function drawDepthChart(newData) {
  var data = coverDepthDataForChart(newData)
  if (data.x.length === 0) {
    return
  }
  if (!depthChart) {
    var ctx = document.getElementById("myChart")
    depthChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.x,
        datasets: [{
          // borderColor: "rgb(255, 99, 132)",
          borderColor: "rgb(50, 50, 50)",
          data: data.yRed
        }, {
          borderColor: "rgb(54, 162, 235)",
          data: data.yGreen
        }]
      },
      options: {
        elements: {
          line: {
            tension: 0, // disables bezier curves.
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 1,
          },
          point: {
            radius: 0
          }
        },
        responsive: true,
        scales: {
          yAxes: [{
            ticks: {
              // the data minimum used for determining the ticks is Math.min(dataMin, suggestedMin)
              min: 0,

              // the data maximum used for determining the ticks is Math.max(dataMax, suggestedMax)
              // max: 5000
            }
          }]
        }
      }
    })
  } else {
    depthChart.data.labels = data.x
    depthChart.data.datasets[0].data = data.yRed
    depthChart.data.datasets[1].data = data.yGreen
    depthChart.update()
  }
}