
function Book(canvasId, options) {
	this._ws = null
  this._chart = null
  this._dom = {
    canvas: document.getElementById(canvasId)
  }
  this._config = {
  	isFuture: options && options.isFuture
  }
  this._state = {
  	connecting: false
  }
  this._initChart()
}

Book.prototype._initChart = function() {
	 this._chart = new Chart(this._dom.canvas, {
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

Book.prototype._update = function(json) {
	this._orderBook.update(json[0])
	this._updateChart()
}

Book.prototype._updateChart = function() {
  /*
	var data = []
  var chart = this._chart
  chart.data.labels = x
  chart.data.datasets[0].data = yGreen
  // chart.data.datasets[0].steppedLine = CONFIG.step
  chart.data.datasets[1].data = yRed
  // chart.data.datasets[1].steppedLine = CONFIG.step
  chart.update({ duration: 0, lazy: true })
  */
}

Book.prototype.getCanvas = function() {
  return this._dom.canvas
}

Book.prototype.saveImage = function(domId, prefix) {
  var downloadLink = document.getElementById(domId)
  downloadLink.href = this._dom.canvas.toDataURL("image/jpeg", 0.5)
  downloadLink.download = prefix + '-' + (new Date().toLocaleString().replace(' ', '-'))
  downloadLink.click()
}
