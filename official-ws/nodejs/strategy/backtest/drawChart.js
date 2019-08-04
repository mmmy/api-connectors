
const { getHistoryData } = require('./data/xbt5m')
const puppeteer = require('puppeteer-core')
const path = require('path')
// const echarts = require('echarts')

async function launchBrowser() {
  return await puppeteer.launch({
    headless: false,
    executablePath: 'F:/chrome-win/chrome.exe',
    defaultViewport: {
      width: 1500,
      height: 1000,
    },
    args: [`--window-size=${1500},${1000}`] // new option
  })
}

function createTradeDataObject(reportData) {
  const map = {}
  reportData.tradeEarnList.forEach(t => {
    const time = t.st.split('T')[0]
    map[time] = t
  })
  return map
}

function createOptions(data, reportData) {
  const reportDataMap = createTradeDataObject(reportData)
  const dates = data.map(d => d.timestamp.split('T')[0])
  const volumes = data.map(d => d.volume)
  const candlesData = data.map(d => [d.open, d.close, d.low, d.high])
  const colorList = ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83', '#ca8622', '#bda29a', '#6e7074', '#546570', '#c4ccd3']
  const pfData = dates.map(d => {
    const tradeData = reportDataMap[d]
    return tradeData && tradeData.margin
  })
  const ppBackData = dates.map(d => {
    const tradeData = reportDataMap[d]
    return tradeData && tradeData.pp_bk  // 百分比回撤
  })
  return {
    title: {
      left: 'center',
      text: ''
    },
    legend: {
      show: true,
      top: 0,
    },
    axisPointer: {
      link: [{
        xAxisIndex: [0, 1]
      }]
    },
    xAxis: [{
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#777' } },
      axisLabel: {
        formatter: function (value) {
          return value
          // return echarts.format.formatTime('MM-dd', value);
        }
      },
      min: 'dataMin',
      max: 'dataMax',
      axisPointer: {
        show: true
      }
    }, {
      type: 'category',
      gridIndex: 1,
      data: dates,
      scale: true,
      boundaryGap: false,
      splitLine: { show: false },
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#777' } },
      splitNumber: 20,
      min: 'dataMin',
      max: 'dataMax',
    }, {
      type: 'category',
      gridIndex: 2,
      data: dates,
      scale: true,
      boundaryGap: false,
      splitLine: { show: false },
      axisLabel: { show: true },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#777' } },
      splitNumber: 20,
      min: 'dataMin',
      max: 'dataMax',
    }, {
      type: 'category',
      gridIndex: 3,
      data: dates,
      scale: true,
      boundaryGap: false,
      splitLine: { show: false },
      axisLabel: { show: true },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#777' } },
      splitNumber: 20,
      min: 'dataMin',
      max: 'dataMax',
    }],
    yAxis: [{
      scale: true,
      splitNumber: 2,
      axisLine: { lineStyle: { color: '#777' } },
      splitLine: { show: true },
      axisTick: { show: false },
      axisLabel: {
        inside: true,
        formatter: '${value}\n'
      }
    }, {
      scale: true,
      gridIndex: 1,
      splitNumber: 2,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false }
    }, {
      scale: true,
      gridIndex: 2,
      splitNumber: 2,
      axisLabel: {
        inside: true,
        formatter: '{value}\n'
      },
      axisLine: { show: true },
      axisTick: { show: true },
      splitLine: { show: true },
      min: 1,
    }, {
      scale: true,
      gridIndex: 3,
      splitNumber: 2,
      axisLabel: {
        inside: true,
        formatter: '{value}\n'
      },
      axisLine: { show: true },
      axisTick: { show: true },
      splitLine: { show: true },
      max: 0,
      min: -1,
    }],
    grid: [{
      left: 10,
      right: 10,
      top: 30,
      height: 350
    }, {
      left: 10,
      right: 10,
      height: 60,
      top: 400
    }, {
      left: 10,
      right: 10,
      height: 120,
      top: 470,
    }, {
      left: 10,
      right: 10,
      height: 120,
      top: 620,
    }],
    series: [
      {
        type: 'candlestick',
        name: '日线价格图',
        data: candlesData,
        itemStyle: {
          normal: {
            color: '#14b143',
            color0: '#ef232a',
            borderColor: '#14b143',
            borderColor0: '#ef232a',
          },
          emphasis: {
            color: 'black',
            color0: '#444',
            borderColor: 'black',
            borderColor0: '#444'
          }
        }
      }, {
      name: '交易量',
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      itemStyle: {
        normal: {
          color: '#7fbe9e'
        },
        emphasis: {
          color: '#140'
        }
      },
      data: volumes
    },
    {
      type: 'line',
      name: '复利收益曲线（%）',
      data: pfData,
      xAxisIndex: 2,
      yAxisIndex: 2,
      connectNulls: true,
      itemStyle: {
        normal: {
          //https://www.echartsjs.com/option.html#series-line.itemStyle
          borderWidth: 0,      // 拐点样式?
          color: '14b143',
          // color0: '#ef232a',
          // borderColor: '#14b143',
          // borderColor0: '#ef232a',
        },
      },
      lineStyle: {
        color: '#14b143'
      },
    },
    {
      type: 'bar',
      name: '发生交易',
      data: pfData,
      xAxisIndex: 2,
      yAxisIndex: 2,
      connectNulls: true,
      itemStyle: {
        normal: {
          //https://www.echartsjs.com/option.html#series-line.itemStyle
          borderWidth: 1,      // 拐点样式?
          color: '#444',
          // color0: '#ef232a',
          // borderColor: '#14b143',
          // borderColor0: '#ef232a',
        },
      },
    },
    {
      type: 'line',
      name: '回撤',
      data: ppBackData,
      xAxisIndex: 3,
      yAxisIndex: 3,
      connectNulls: true,
      itemStyle: {
        normal: {
          //https://www.echartsjs.com/option.html#series-line.itemStyle
          borderWidth: 0,      // 拐点样式?
          color: 'red',
          // color0: '#ef232a',
          // borderColor: '#14b143',
          // borderColor0: '#ef232a',
        },
      },
      lineStyle: {
        lineWidth: 1,
        color: 'red',
      },
      areaStyle: {
        color: 'red'
      }
    }
    ],
    animation: false
  };
}

async function drawKline({ symbol, period, title, timeRange, reportData }, filePath) {
  const data = getHistoryData(symbol, period)
  const options = createOptions(data, reportData)
  const browser = await launchBrowser()
  //创建空白页面
  const page = await browser.newPage()
  //定义网页模板
  let htmlTemplate =
    `<!DOCTYPE html>
  <html lang="en">
        <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="ie=edge">
              <title>Document</title>
        </head>
        <body>
              <div id="canvas" style="width:750px;height:770px"></div>
        </body>
  </html>`

  //设置网页源码
  await page.setContent(htmlTemplate)
  //在网页中导入echarts库
  await page.addScriptTag({
    url: 'https://cdn.bootcss.com/echarts/4.1.0-release/echarts.min.js'
  })
  //在网页中导入可视化图表渲染代码
  await page.addScriptTag({
    content: `
       (function (window) {
       var option = ${JSON.stringify(options)}
       var myChart = window.echarts.init(document.getElementById('canvas'));
       myChart.setOption(option);
       window.myChart = myChart
       })(this);`
  })
  //对渲染后的图表截图
  let canvas = await page.$('#canvas');
  const img = await canvas.screenshot({
    type: 'jpeg',//默认png
    quality: 100,
    path: filePath,
    // path: path.resolve(__dirname, './temp/' + (title || 'report') + ".jpg")
  })
  // 关闭网页
  await page.close()
  // 关闭浏览器
  await browser.close()
  return img
}

module.exports = {
  drawKline
}

// drawKline({
//   symbol: 'XBTUSD',
//   period: '1d',
// })
