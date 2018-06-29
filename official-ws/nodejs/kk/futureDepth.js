
function FD(canvasId, options) {
	this._ws = null
  this._depthChart = null
  this._dom = {
    canvas: document.getElementById(canvasId)
  }
  this._config = {
  	isFuture: options && options.isFuture
  }
  this._state = {
  	connecting: false
  }
  this._orderBook = new OrderBook()
  this._initChart()
}

FD.prototype._initChart = function() {
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
        isFuture: this._config.isFuture
      }
    },
  })
}

FD.prototype.start = function(uri) {
  var that = this
  var ws = new WebSocket(uri || "ws://127.0.0.1:8090");

  ws.onopen = function(evt) { 
    console.log("Connection open ..."); 
    ws.send("Hello Future depth!");
  };

  ws.onmessage = function(evt) {
    //{midPrice, asks:[], bids:[]}
    var json = JSON.parse(evt.data)
    that._update(json)
    // console.log( "Received Message: " + evt.data);
    // ws.close();
  };

  ws.onclose = function(evt) {
    console.log("Connection closed.");
  };

  this._ws = ws
}

FD.prototype.stop = function() {
  this._ws.close()
}

FD.prototype._update = function(json) {
	this._orderBook.update(json[0])
	this._updateChart()
}

FD.prototype._updateChart = function() {
	var data = this._orderBook.calcData(window.CONFIG.depth)
  var x = data.x,
  		yGreen = data.yGreen,
  		yRed = data.yRed

  var chart = this._depthChart
  chart.data.labels = x
  chart.data.datasets[0].data = yGreen
  // chart.data.datasets[0].steppedLine = CONFIG.step
  chart.data.datasets[1].data = yRed
  // chart.data.datasets[1].steppedLine = CONFIG.step
  chart.update({ duration: 0, lazy: true })
}

FD.prototype.getCanvas = function() {
  return this._dom.canvas
}

FD.prototype.saveImage = function(domId, prefix) {
  var downloadLink = document.getElementById(domId)
  downloadLink.href = this._dom.canvas.toDataURL("image/jpeg", 0.5)
  downloadLink.download = prefix + '-' + (new Date().toLocaleString().replace(' ', '-'))
  downloadLink.click()
}

$(function() {
	var fd = new FD('future-chart', { isFuture: true })
	window._fd = fd
	fd.start("ws://127.0.0.1:8090")

	var sd = new FD('spot-chart')
	window._sd = sd
	sd.start("ws://127.0.0.1:8091")
})