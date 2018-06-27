
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

  window._DOM = {
    $download: $('#download')
  }
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

function calcDepthRight(list) {
  var sum = 0
  var l = list.length
  for (var i=0; i<l; i++) {
    var v = list[i]
    if (v !== null) {
      sum += v
      list[i] = sum
    }
  }
  return list
}

function calcDepthLeft(list) {
  var sum = 0
  var l = list.length
  for (var i=l-1; i>=0; i--) {
    var v = list[i]
    if (v !== null) {
      sum += v
      list[i] = sum
    }
  }
  return list
}

function coverDepthDataForChart(data) {
  const x = []
  const y = []
  let yRed = []
  let yGreen = []
  data.forEach(item => {
    var isB = item.side == 'Buy'
    x.push(item.price)
    y.push(item.size)
    yRed.push(isB ? null : item.size)
    yGreen.push(isB ? item.size : null)
  })
  if (CONFIG.depth) {
    yRed = calcDepthLeft(yRed)
    yGreen = calcDepthRight(yGreen)
  }
  return { x, y, yRed, yGreen }
}

function drawDateTime(ctx) {
  var oldStyle = ctx.strokeStyle
  ctx.strokeStyle= 'red'
  ctx.strokeText('nihao', 0, 20)
}

function drawDepthChart(newData) {
  var data = coverDepthDataForChart(newData)
  if (data.x.length === 0) {
    return
  }
  var canvas = document.getElementById("myChart")
  if (!depthChart) {
    depthChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.x,
        datasets: [{
          // borderColor: "rgb(255, 99, 132)",
          borderColor: "rgb(50, 50, 50)",
          data: data.yRed,
          steppedLine: CONFIG.step
        }, {
          borderColor: "rgb(54, 162, 235)",
          data: data.yGreen,
          steppedLine: CONFIG.step
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
      },
      plugins: [{
        afterUpdate: function(chart, options) {
          // drawDateTime(canvas.getContext('2d'))
          window._DOM.$download[0].href = canvas.toDataURL()
          window._DOM.$download[0].download = new Date().toLocaleString().replace(' ', '-')
        }
      }]
    })
  } else {
    depthChart.data.labels = data.x
    depthChart.data.datasets[0].data = data.yRed
    depthChart.data.datasets[0].steppedLine = CONFIG.step
    depthChart.data.datasets[1].data = data.yGreen
    depthChart.data.datasets[1].steppedLine = CONFIG.step
    depthChart.update()
  }
}