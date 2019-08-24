const path = require('path')
const fs = require('fs')
const JSONtoCSV = require('../utils').JSONtoCSV
const statisticTradesReport = require('../utils').statisticTradesReport
const { drawKline } = require('../drawChart')
const { saveHtml } = require('../dataToReport')
const args = require('yargs').argv

const file = args.f || 'temp.json'
console.log('file:', file)
const filePath = path.join(__dirname, file)
const fileConent = fs.readFileSync(filePath).toString()
const dataList = JSON.parse(fileConent)

dataList.map((t, i) => {
  const { id, trades, candleCountMap, date } = t
  const folderName = id
  const folderPath = path.join(__dirname, folderName)
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath)
  }
  const saveName = `${id || (i + 1)}.csv`
  const savePath = path.join(folderPath, saveName)
  const newTrades = trades// filterTradesBars(trades)
  const report = statisticTradesReport(newTrades)
  const allReport = report.all
  console.log(report)
  const dataToCsv = JSONtoCSV(allReport.tradeEarnList, ['st', 'pf', 'bk', 'pfp', 'margin'])
  fs.writeFileSync(savePath, dataToCsv)

  const startTime = new Date(allReport.tradeEarnList[0].st)
  const chartConfig = {
    symbol: 'XBTUSD',
    period: '1d',
    timeRange: [new Date(startTime - 7 * 24 * 3600 * 1000).toISOString()],
    reportData: allReport,
  }

  const imgPath = path.join(folderPath, 'result.jpg')
  const img = drawKline(chartConfig, imgPath)
  // fs.writeFileSync(imgPath, img, 'binary')
  const htmlPath = path.join(folderPath, 'index.html')
  saveHtml({
    date: new Date(date).toLocaleDateString(),
    id,
    report,
    exchange: 'BITMEX',
    symbol: 'XBTUSD',
    period: '5分钟',
    candleCount: candleCountMap['5m'],
    comments: [{
      text: '基本原理：日线指标为上涨趋势，结合小时线放量，5分钟趋势K线突破高点，等待回撤后的高4点位',
    },
    { text: '优势：严格的止盈止损'},
    { text: '交易方式：程序全自动化交易，亦可以辅助人工操作, 结合常见顶部形态可将策略关闭即可' },
    { text: '杠杆倍数：小于3' },
  ]
  }, htmlPath)
})
