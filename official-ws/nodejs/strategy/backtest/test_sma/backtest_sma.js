
const BackTestSma = require('./BackTestSma')
const BackTestManager = require('../BackTestManager')
var ProgressBar = require('progress')
const path = require('path')
const fs = require('fs')

const JSONtoCSV = require('../utils').JSONtoCSV

var xbt5m = require('../data/xbt5m')
var len = xbt5m.length

const defaultPriceFilter = {
  longPriceLen: 6,
  longMaxPriceDiff: 30,
  longMinPriceDiff: 0,

  shortPriceLen: 6,
  shortMaxPriceDiff: 30,
  shortMinPriceDiff: 0
}
const manager = new BackTestManager()
manager.addNewStrategy(new BackTestSma({
  id: 'benchmark',
  account: {
    loss: -30,
    profit: 37
  },
  '5m': { smaFastLen: 53, smaSlowLen: 88 },
  // '5m': { smaFastLen: 40, smaSlowLen: 88 },
  disableLong: false,
  disableShort: true,
  ...defaultPriceFilter,
}))

function findIndexByTime(time) {
  time = +new Date(time)
  for (let i = 0; i < len; i++) {
    const b = xbt5m[i]
    if (+new Date(b.timestamp) === time) {
      return i
    }
  }
}

function timeToSeries(list) {
  return list.map(r => {
    return r.map(t => typeof t === 'string' ? findIndexByTime(t) : t)
  })
}

function testRange(indexRange) {
  const startIndex = indexRange[0]
  const endIndex = indexRange[1] || len
  manager.setCandleHistory('5m', xbt5m.slice(startIndex - 200, startIndex))
  for (let i = startIndex; i < endIndex; i++) {
    const bar = xbt5m[i]
    // progress.tick();
    // if (bar.complete) {
    //   console.log('\ncomplete\n');
    // }
    if (i % 1000 === 0) {
      console.log(i)
    }
    manager.readBar(bar)
    manager.updateCandleLastHistory('5m', bar)
  }
}

// const startDateTime = new Date("2018-08-27T11:00:00.000Z")
// const startDateTime = new Date("2018-06-16T14:00:00.000Z")
// const startDateTime = null// new Date("2018-03-19T00:00:00.000Z")


dataSeries = [
  [300]
  // ["2017-10-01T00:00:00.000Z", "2017-11-10T00:00:00.000Z",],
  // ["2017-11-13T00:00:00.000Z", "2017-12-08T00:00:00.000Z",],
  // ["2018-08-27T11:00:00.000Z"]
]

seriesIndex = timeToSeries(dataSeries)
console.log(seriesIndex)
seriesIndex.forEach(range => {
  testRange(range)
})

var d0 = new Date()

const allTrades = manager.getAllTrades(true)
const str = JSON.stringify(allTrades)
console.log(str)
fs.writeFileSync(path.join(__dirname, 'temp.json'), str)
allTrades.map((t, i) => {
  const { id, statistic } = t
  const saveName = `sma_test_result_${id || (i + 1)}.csv`
  const savePath = path.join(__dirname, saveName)
  const dataToCsv = JSONtoCSV(statistic.tradeEarnList, ['st', 'pf', 'bk'])
  fs.writeFileSync(savePath, dataToCsv)
})
console.log('time used:', (new Date() - d0) / 1000)
// console.log('end')