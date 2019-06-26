
const BackTestSma = require('./BackTestSma')
const BackTestManager = require('../BackTestManager')
var ProgressBar = require('progress')
const path = require('path')
const fs = require('fs')

const JSONtoCSV = require('../utils').JSONtoCSV

var { getXBTUSD5mData } = require('../data/xbt5m')
xbt5m = getXBTUSD5mData()
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
  id: 'p8090l200-2019-fix-bug',
  account: {
    loss: -30,
    profit: 37,
    priceOffset: 0,
  },
  '5m': { smaFastLen: 53, smaSlowLen: 88 },
  // '5m': { smaFastLen: 40, smaSlowLen: 88 },
  disableLong: false,
  disableShort: false,
  shortRateLen: 200,
  shortPriceRateMin: 0,
  shortPriceRateMax: 0.15,
  ...defaultPriceFilter,
}))

manager.addNewStrategy(new BackTestSma({
  id: 'lands200-2019-fix-bug',
  account: {
    loss: -30,
    profit: 37,
    priceOffset: 0,
  },
  '5m': { smaFastLen: 53, smaSlowLen: 88 },
  // '5m': { smaFastLen: 40, smaSlowLen: 88 },
  disableLong: false,
  disableShort: false,
  longRateLen: 200,
  longPriceRateMin: 0.75,
  longPriceRateMax: 0.9,
  shortRateLen: 200,
  shortPriceRateMin: 0.1,
  shortPriceRateMax: 0.15,
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
  manager.setCandleHistory('5m', xbt5m.slice(startIndex - 380, startIndex))
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

let upSeries = [
  ['2017-09-16T00:00:00.000Z', '2017-10-15T00:00:00.000Z'],
  ['2017-10-19T00:00:00.000Z', '2017-10-22T00:00:00.000Z'],
  ['2017-10-25T00:00:00.000Z', '2017-11-05T00:00:00.000Z'],
  ['2017-11-08T00:00:00.000Z', '2017-11-10T00:00:00.000Z'],
  ['2017-11-13T00:00:00.000Z', '2017-11-21T00:00:00.000Z'],
  ['2017-11-24T00:00:00.000Z', '2017-11-29T00:00:00.000Z'],
  ['2017-12-01T00:00:00.000Z', '2017-12-07T00:00:00.000Z'],
  ['2017-12-11T00:00:00.000Z', '2017-12-13T00:00:00.000Z'],
]

let upSeries1 = [
  ['2017-12-23T00:00:00.000Z', '2017-12-27T00:00:00.000Z'],
  ['2017-12-31T00:00:00.000Z', '2018-01-07T00:00:00.000Z'],
  ['2018-01-12T00:00:00.000Z', '2018-01-14T00:00:00.000Z'],
  ['2018-01-17T00:00:00.000Z', '2018-01-21T00:00:00.000Z'],
  ['2018-01-23T00:00:00.000Z', '2018-01-29T00:00:00.000Z'],
  ['2018-02-06T00:00:00.000Z', '2018-02-21T00:00:00.000Z'],
  ['2018-02-25T00:00:00.000Z', '2018-03-04T00:00:00.000Z'],
  ['2018-03-18T00:00:00.000Z', '2018-03-22T00:00:00.000Z'],
  ['2018-03-31T00:00:00.000Z', '2018-05-05T00:00:00.000Z'],
]

let upSeries2 = [
  ['2018-05-06T00:00:00.000Z'],
]

let dataSeries = [
  [400]
  // ['2017-09-16T00:00:00.000Z', '2017-12-13T00:00:00.000Z'],
  // ["2017-10-01T00:00:00.000Z", "2017-11-10T00:00:00.000Z",],
  // ["2017-11-13T00:00:00.000Z", "2017-12-08T00:00:00.000Z",],
  // ["2018-09-10T22:00:00.000Z"]
]

// dataSeries = upSeries.concat(upSeries1).concat(upSeries2)

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
  const dataToCsv = JSONtoCSV(statistic.tradeEarnList, ['st', 'pf', 'bk', 'pfp'])
  fs.writeFileSync(savePath, dataToCsv)
})
console.log('time used:', (new Date() - d0) / 1000)
// console.log('end')