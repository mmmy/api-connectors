
const TestStrategy = require('./BackTestRsiDivergence')
const BackTestManager = require('../BackTestManager')

const path = require('path')
const fs = require('fs')

const timeToSeries = require('../utils').timeToSeries

const JSONtoCSV = require('../utils').JSONtoCSV

const { getXBTUSD5mData, getXBTUSD1hData, getXBTUSD1dData } = require('../data/xbt5m')
const xbt5m = getXBTUSD5mData()
const xbt1h = getXBTUSD1hData()
const xbt1d = getXBTUSD1dData()

const manager = new BackTestManager()

manager.addNewStrategy(new TestStrategy({
  id: 'rsi_divergence_width_filter_not_highestlowest_300_5m_long_short',
  // disableShort: true,
  // disableLong: true
}))

let DataIndex = {
  '1h': 0,
  '1d': 0,
}
function setHourHistoryData(curTime, period) {
  let data = null
  let lastHourTime = ''
  if (period === '1h') {
    data = xbt1h
    lastHourTime = curTime.replace(/\d\d:\d\d\..*Z/g, '00:00.000Z')
  } else if (period === '1d') {
    data = xbt1d
    lastHourTime = curTime.replace(/\d\d:\d\d:\d\d\..*Z/g, '00:00:00.000Z')
  }
  const len = data.length

  for (let i = 0; i < len - 1; i++) {
    const nextd = data[i + 1]
    if (nextd.timestamp === lastHourTime) {
      DataIndex[period] = i
      manager.setCandleHistory(period, data.slice(i - 90, i))
      break
    }
  }
}

function pushHistoryDataIfNeed(curTime, period, cb) {
  curTime = new Date(curTime)
  let data = null
  let timePassedToUpdate = 3600000
  if (period === '1h') {
    data = xbt1h
    timePassedToUpdate = 3600000
  } else if (period === '1d') {
    data = xbt1d
    timePassedToUpdate = 3600000 * 24
  }
  // 1h
  const listDataTime = new Date(data[DataIndex[period]].timestamp)
  const timePassed = curTime - listDataTime
  // asserts
  if (timePassed < timePassedToUpdate || timePassed > timePassedToUpdate * 2) {
    throw `wrong time to push hour data ${curTime} - ${listDataTime}`
  }
  if (timePassed === timePassedToUpdate * 2) {
    manager.updateCandleLastHistory(period, data[DataIndex[period]])
    DataIndex[period] = DataIndex[period] + 1
    cb && cb()
  }
}

function testRange(orangeData, indexRange) {
  const startIndex = indexRange[0]
  const startTime = orangeData[startIndex].timestamp
  const endIndex = indexRange[1] || orangeData.length
  manager.setCandleHistory('5m', orangeData.slice(startIndex - 380, startIndex))

  setHourHistoryData(startTime, '1h')
  setHourHistoryData(startTime, '1d')

  for (let i = startIndex; i < endIndex; i++) {
    const bar = orangeData[i]
    // progress.tick();
    // if (bar.complete) {
    //   console.log('\ncomplete\n');
    // }
    if (i % 1000 === 0) {
      console.log(i)
    }
    // manager.readBar(bar)
    manager.updateCandleLastHistory('5m', bar)
    pushHistoryDataIfNeed(bar.timestamp, '1h', () => {
      pushHistoryDataIfNeed(bar.timestamp, '1d')
    })
  }
}

let dataSeries = [
  [400]
  // ['2017-09-16T00:00:00.000Z', '2017-12-13T00:00:00.000Z'],
  // ["2017-10-01T00:00:00.000Z", "2017-11-10T00:00:00.000Z",],
  // ["2017-11-13T00:00:00.000Z", "2017-12-08T00:00:00.000Z",],
  // ["2019-05-22T10:00:00.000Z"]
]

const seriesIndex = timeToSeries(xbt5m, dataSeries)

console.log(seriesIndex)
seriesIndex.forEach(range => {
  testRange(xbt5m, range)
})

const d0 = new Date()
const allTrades = manager.getAllTrades(true)

const str = JSON.stringify(allTrades)
console.log(str)

fs.writeFileSync(path.join(__dirname, 'temp.json'), str)

allTrades.map((t, i) => {
  const { id, statistic } = t
  const saveName = `rsi_divergence_result_${id || (i + 1)}.csv`
  const savePath = path.join(__dirname, saveName)
  const dataToCsv = JSONtoCSV(statistic.tradeEarnList, ['st', 'pf', 'bk'])
  fs.writeFileSync(savePath, dataToCsv)
})

console.log('time used:', (new Date() - d0) / 1000)
