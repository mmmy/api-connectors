import React from 'react'
import Chart from 'chart.js'

const DefaultOptions = {
  responsive: false,
  hoverMode: 'index',
  stacked: false,
  title: {
    display: false,
    text: 'margin history'
  },
  scales: {
    yAxes: [{
      type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
      display: true,
      position: 'left',
      id: 'y-axis-1',
    }, {
      type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
      display: true,
      position: 'right',
      id: 'y-axis-2',

      // grid line settings
      gridLines: {
        drawOnChartArea: false, // only want the grid lines for one axis to show up
      },
    }],
  }
}

export default class MarginHistoryChart extends React.Component {
  componentDidMount() {
    if (this.props.data.length > 0) {
      this.initChart()
    }
  }
  componentDidUpdate(preProps) {
    if (preProps.data.length === 0 && this.props.data.length > 0) {
      this.initChart()
    }
  }
  render() {
    return <canvas ref={node => this._canvas = node} id="margin-history-chart" width="350" height="400"></canvas>
  }
  initChart() {
    const ctx = this._canvas.getContext('2d')
    const chartData = {
      labels: [],
      datasets: [{
        label: 'btc',
        borderColor: 'rgb(24, 144, 255)',
        data: [],
        yAxisID: 'y-axis-1',
        fill: false,
      }, {
        label: 'dollar',
        borderColor: 'rgb(63, 178, 126)',
        data: [],
        yAxisID: 'y-axis-2',
        fill: false,
      }]
    }
    this.props.data.forEach(item => {
      const { timestamp, btc, dollar } = item
      chartData.labels.push(new Date(timestamp).toLocaleDateString())
      chartData.datasets[0].data.push(btc)
      chartData.datasets[1].data.push(dollar)
    })
    this._chart = Chart.Line(ctx, {
      data: chartData,
      options: DefaultOptions,
    })
  }
}
