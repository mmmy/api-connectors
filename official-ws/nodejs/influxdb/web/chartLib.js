Chart.plugins.register({
  // beforeDraw: function(chart) {
  //   var ctx = chart.ctx
  //   ctx.fillStyle = 'white'
  //   ctx.fillRect(0, 0, chart.width, chart.height)
  // },
  afterDatasetsDraw: function(chart) {
    var ctx = chart.ctx;

    chart.data.datasets.forEach(function(dataset, i) {
      var meta = chart.getDatasetMeta(i);
      if (!meta.hidden) {
        meta.data.forEach(function(element, index) {
          // Draw the text in black, with the specified font

          var fontSize = 12;
          var fontStyle = 'normal';
          var fontFamily = 'Helvetica Neue';
          ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);

          var x = chart.data.labels[index]
          // Just naively convert to string for now
          var dataString = dataset.data[index];
          var isMiddle = dataString && dataset.data[index + 1] === null
          if (isMiddle) {
            ctx.fillStyle = isMiddle ? 'rgb(255, 99, 132)' : 'rgb(0, 0, 0)';
            dataString =  (dataString / 1E6).toFixed(3) + 'M'
            // Make sure alignment settings are correct
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            var padding = 5;
            var position = element.tooltipPosition();
            ctx.fillText(x + ':\n' + dataString, position.x, position.y - (fontSize / 2) - padding);
          }

        });
      }
    });
  }
});

let depthChart = null
function coverDepthDataForChart(data) {
  var len = data.length
  let x = []
  let y = []
  let yRed = []
  let yGreen = []
  let middleIndex = -1
  data.forEach((item, i) => {
    var isB = item.side == 'Buy'
    x.push(item.price)
    y.push(item.size)
    yRed.push(isB ? null : item.size)
    yGreen.push(isB ? item.size : null)
  })
  // if(middleIndex > -1) {
  //   var startIndex = Math.max(middleIndex - 28, 0)
  //   var l = startIndex + 55
  //   x = x.slice(startIndex, l)
  //   y = y.slice(startIndex, l)
  //   yRed = yRed.slice(startIndex, l)
  //   yGreen = yGreen.slice(startIndex, l)
  // }
  return { x, y, yRed, yGreen }
}

function drawDepthChart(newData) {
  var data = coverDepthDataForChart(newData)
  if (data.x.length === 0) {
    return
  }
  if (!depthChart) {
    var canvas = document.getElementById('depth-chart')
    depthChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.x,
        datasets: [{
          // borderColor: "rgb(255, 99, 132)",
          borderColor: "rgb(54, 162, 235)",
          data: data.yGreen,
          steppedLine: true
        }, {
          borderColor: "rgb(50, 50, 50)",
          data: data.yRed,
          steppedLine: true
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
              callback: function(value, index, values) {
                return value / 1E6 + 'M'
              }
            }
          }]
        },
        _config: {
          showLabel: true
        }
      },
      plugins: [{
        afterUpdate: function(chart, options) {
          // drawDateTime(canvas.getContext('2d'))
          // window._DOM.$download[0].href = canvas.toDataURL()
          // window._DOM.$download[0].download = new Date().toLocaleString().replace(' ', '-')
        }
      }]
    })
  } else {
    depthChart.data.labels = data.x
    depthChart.data.datasets[0].data = data.yGreen
    // depthChart.data.datasets[0].steppedLine = CONFIG.step
    depthChart.data.datasets[1].data = data.yRed
    // depthChart.data.datasets[1].steppedLine = CONFIG.step
    depthChart.update({ duration: 0, lazy: true })
  }
}