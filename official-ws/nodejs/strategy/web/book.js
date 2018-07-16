
function Book(canvasId, options) {
	this._ws = null
  this._chart = null
  this._maxLength = 110
  this._updateRender = true
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
        type: 'line',
        data: [],
        fill: false,
        steppedLine: false
      }, {
        borderColor: "rgb(50, 50, 50)",
        type: 'line',
        data: [],
        fill: false,
        steppedLine: false
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
      responsive: false,
      scales: {
        xAxes: [{
          type: 'time',
          ticks: {
            // source: 'labels'
          }
        }],
        yAxes: [{
          ticks: {
            // the data minimum used for determining the ticks is Math.min(dataMin, suggestedMin)
            min: 0,
            // the data maximum used for determining the ticks is Math.max(dataMax, suggestedMax)
            // max: 5000
            // callback: function(value, index, values) {
            //   return value
            // }
          }
        }]
      },
      _config: {
        isFuture: this._config.isFuture
      }
    },
  })
}

Book.prototype.setData = function(data) {
  var keys = []
  var data0 = []
  var data1 = []
  data.forEach(item => {
    var t = item.k
    keys.push(t)
    data0.push({t, y: item.v[0]})
    data1.push({t, y: item.v[1]})
  })
  var chart = this._chart
  chart.data.lables = keys
  chart.data.datasets[0].data = data0
  chart.data.datasets[1].data = data1
  chart.update({ duration: 0, lazy: true })
}

Book.prototype.appendData = function(data) {
  var chart = this._chart
  var t = data.k
  chart.data.lables.push(t)
  chart.data.datasets[0].data.push({t, y:data.v[0]})
  chart.data.datasets[1].data.push({t, y:data.v[1]})

  var len = chart.data.lables.length
  if (len > this._maxLength) {
    chart.data.lables.shift()
    chart.data.datasets[0].data.shift()
    chart.data.datasets[1].data.shift()
  }
  if (this._updateRender) {
    chart.update({ duration: 1000, lazy: true })
  }
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
