function BFX() {
  this._ws = null
  this._depthChart = null
  this._dom = {
    canvas: document.getElementById('bfx-chart')
  }
  this._config = {
  }

  this._initChart()
}

BFX.prototype._initChart = function() {
  this._depthChart = new Chart(this._dom.canvas, {
    type: 'line',
    data: {
      lables: [],
      datasets: [{
        borderColor: "rgb(54, 162, 235)",
        data: [],
        steppedLine: true
      }, {
        borderColor: "rgb(50, 50, 50)",
        data: [],
        steppedLine: true
      }],
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
      /*
      scales: {
        yAxes: [{
          ticks: {
            // the data minimum used for determining the ticks is Math.min(dataMin, suggestedMin)
            // min: 0,
            // the data maximum used for determining the ticks is Math.max(dataMax, suggestedMax)
            // max: 5000
            callback: function(value, index, values) {
              return value
            }
          }
        }]
      },
      */
      _config: {
        bfxDepth: true
      }
    },
  })
}

BFX.prototype.start = function() {
  var that = this
  var ws = new WebSocket("ws://127.0.0.1:8098");

  ws.onopen = function(evt) { 
    console.log("Connection open ..."); 
    ws.send("Hello WebSockets!");
  };

  ws.onmessage = function(evt) {
    //{midPrice, asks:[], bids:[]}
    var json = JSON.parse(evt.data)
    that._updateChart(json)
    // console.log( "Received Message: " + evt.data);
    // ws.close();
  };

  ws.onclose = function(evt) {
    console.log("Connection closed.");
  };

  this._ws = ws
}

BFX.prototype.stop = function() {
  this._ws.close()
}

BFX.prototype._updateChart = function(data) {
  var asks = data.asks,
      bids = data.bids,
      alls = bids.reverse().concat(asks)

  var bidsLen = bids.length,
      asksLen = asks.length,
      x = [],
      yGreen = [],
      yRed = []

  alls.forEach((item, i) => {
    x.push(item[0])
    var isGreen = i < bidsLen
    yGreen.push(isGreen ? item[2] : null)
    yRed.push(!isGreen ? -item[2] : null)
  })

  if (x.length === 0) {
    return
  }

  yGreen = window.calcDepthLeft(yGreen)
  yRed = window.calcDepthRight(yRed)

  var chart = this._depthChart
  chart.data.labels = x
  chart.data.datasets[0].data = yGreen
  // chart.data.datasets[0].steppedLine = CONFIG.step
  chart.data.datasets[1].data = yRed
  // chart.data.datasets[1].steppedLine = CONFIG.step
  chart.update({ duration: 500, lazy: true })
}

$(function() {
  var bfx = new BFX()
  window._bfx = bfx
  bfx.start()
})