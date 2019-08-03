const path = require('path')
const fs = require('fs')
const JSONtoCSV = require('../utils').JSONtoCSV
const statisticTradesReport = require('../utils').statisticTradesReport
const { drawKline } = require('../drawChart')
const args = require('yargs').argv

const file = args.f || 'temp.json'
console.log('file:', file)
const filePath = path.join(__dirname, file)
const fileConent = fs.readFileSync(filePath).toString()
const dataList = JSON.parse(fileConent)

dataList.map((t, i) => {
  const { id, trades } = t
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
  // saveHtml({
  //   id, report
  // })
})
