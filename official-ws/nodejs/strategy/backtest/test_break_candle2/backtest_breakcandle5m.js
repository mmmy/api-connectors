
const TestStrategy = require('./BackTestBreakCandle5m')
const BackTestManager = require('../BackTestManager')

const path = require('path')
const fs = require('fs')

const timeToSeries = require('../utils').timeToSeries

const JSONtoCSV = require('../utils').JSONtoCSV

const { getHistoryData } = require('../data/xbt5m')

const HistoryData = {
  'XBTUSD': {
    '5m': getHistoryData('XBTUSD', '5m'),
    '1h': getHistoryData('XBTUSD', '1h'),
    '1d': getHistoryData('XBTUSD', '1d'),
  },
  'ETHUSD': {
    '5m': getHistoryData('ETHUSD', '5m'),
    '1h': getHistoryData('ETHUSD', '1h'),
    '1d': getHistoryData('ETHUSD', '1d'),
  },
}

const manager = new BackTestManager()
const symbol = 'XBTUSD'
const data5m = HistoryData[symbol]['5m']
const data1h = HistoryData[symbol]['1h']
const data1d = HistoryData[symbol]['1d']

manager.addNewStrategy(new TestStrategy({
  // id: 'rsi_divergence_width_filter_not_highestlowest_300_5m_long_short',
  // id: 'rsi_divergence121025_gaobodong_width_filter_not_highestlowest_300_5m_long',
  // id: `${symbol}_breakcandle5m_48_0601`,
  id: `S2放量突破策略回测2`,
  disableShort: true,
  highVol: false,
  useAdx: true,   // good
  upVol: true,
  len: 48,
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
    data = data1h
    lastHourTime = curTime.replace(/\d\d:\d\d\..*Z/g, '00:00.000Z')
  } else if (period === '1d') {
    data = data1d
    lastHourTime = curTime.replace(/\d\d:\d\d:\d\d\..*Z/g, '00:00:00.000Z')
  }
  const len = data.length

  for (let i = 0; i < len - 1; i++) {
    const d = data[i]
    if (d.timestamp === lastHourTime) {
      DataIndex[period] = i
      manager.setCandleHistory(symbol, period, data.slice(Math.max(i - 90, 0), i))
      break
    }
  }
}

function pushHistoryDataIfNeed(curTime, period, cb) {
  curTime = new Date(curTime)
  let data = null
  let timePassedToUpdate = 3600000
  if (period === '1h') {
    data = data1h
    timePassedToUpdate = 3600000
  } else if (period === '1d') {
    data = data1d
    timePassedToUpdate = 3600000 * 24
  }
  // 1h
  const listDataTime = new Date(data[DataIndex[period] - 1].timestamp)
  const timePassed = curTime - listDataTime
  // asserts
  if (timePassed < timePassedToUpdate || timePassed > timePassedToUpdate * 2) {
    throw `wrong time to push hour data ${curTime} - ${listDataTime}`
  }
  if (timePassed === timePassedToUpdate * 2) {
    manager.updateCandleLastHistory(symbol, period, data[DataIndex[period]])
    DataIndex[period] = DataIndex[period] + 1
    cb && cb()
  }
}

function testRange(orangeData, indexRange) {
  const startIndex = indexRange[0]
  const startTime = orangeData[startIndex].timestamp
  const endIndex = indexRange[1] || orangeData.length
  manager.setCandleHistory(symbol, '5m', orangeData.slice(startIndex - 380, startIndex))

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
    manager.updateCandleLastHistory(symbol, '5m', bar)
    pushHistoryDataIfNeed(bar.timestamp, '1h', () => {
      pushHistoryDataIfNeed(bar.timestamp, '1d')
    })
  }
}

let dataSeries = [
  symbol === 'XBTUSD' ? [400] : ["2018-09-01T10:00:00.000Z"]
  // ['2017-09-16T00:00:00.000Z', '2017-12-13T00:00:00.000Z'],
  // ["2017-10-01T00:00:00.000Z", "2017-11-10T00:00:00.000Z",],
  // ["2017-11-13T00:00:00.000Z", "2017-12-08T00:00:00.000Z",],
  // ["2019-07-02T00:00:00.000Z"]
]

const seriesIndex = timeToSeries(data5m, dataSeries)

console.log(seriesIndex)
seriesIndex.forEach(range => {
  testRange(data5m, range)
})

const d0 = new Date()
const allTrades = manager.getAllTrades(true)

const str = JSON.stringify(allTrades)
// console.log(str)

fs.writeFileSync(path.join(__dirname, 'temp.json'), str)

allTrades.map((t, i) => {
  const { id, statistic } = t
  console.log(id, {
    ...statistic,
    tradeEarnList: []
  })
  const saveName = `${symbol}_rsi_divergence_result_${id || (i + 1)}.csv`
  const savePath = path.join(__dirname, saveName)
  const dataToCsv = JSONtoCSV(statistic.tradeEarnList, ['st', 'pf', 'bk', 'pfp', 'margin'])
  fs.writeFileSync(savePath, dataToCsv)
})

console.log('time used:', (new Date() - d0) / 1000)
