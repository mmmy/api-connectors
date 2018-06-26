
// Hightcharts
var HC = {
  depthChart: null,
  convertData: function(data) {
    const x = []
    const y = []
    data.forEach(item => {
      x.push(item.price)
      y.push(item.size)
    })
    return { x, y }
  },
  drawChart: function(data) {
    if (data.length === 0) return
    var _data = HC.convertData(data)
    if (!HC.depthChart) {
      HC.depthChart = Highcharts.chart('highchart-container', {
        chart: {
            type: 'line'
        },
        xAxis: {
            categories: _data.x
        },
        yAxis: {
        },
        series: [{
            name: 'Jane',
            data: _data.y
        }]
      })
    } else {
      var options = HC.depthChart.options
      options.xAxis[0].categories = _data.x
      options.series[0].data = _data.y
      HC.depthChart.update(options, true, true, false)
    }
  }
}