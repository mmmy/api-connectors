
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

  shortPriceLen: -1,
  // shortMaxPriceDiff: 43,
  // shortMinPriceDiff: 20
}
const manager = new BackTestManager()
manager.addNewStrategy(new BackTestSma({
  id: 'deleteme',
  account: {
    loss: -30,
    profit: 37
  },
  '5m': { smaFastLen: 53, smaSlowLen: 88 },
  // '5m': { smaFastLen: 40, smaSlowLen: 88 },
  disableShort: true,
  ...defaultPriceFilter,
}))

const startDateTime = new Date("2018-08-27T14:00:00.000Z")
// const startDateTime = new Date("2018-06-16T14:00:00.000Z")
// const startDateTime = null// new Date("2018-03-19T00:00:00.000Z")
let startIndex = 300// len - 1200
if (startDateTime) {
  for (let i = 0; i < len; i++) {
    const b = xbt5m[i]
    if (+new Date(b.timestamp) === +startDateTime) {
      startIndex = i
    }
  }
}

console.log('startIndex',startIndex)
var d0 = new Date()

manager.setCandleHistory('5m', xbt5m.slice(startIndex - 200, startIndex))
var progress = new ProgressBar(':bar', { total: len - startIndex });

for (let i = startIndex; i < len; i++) {
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

const allTrades = manager.getAllTrades()
console.log(JSON.stringify(allTrades))
allTrades.map((t, i) => {
  const { id, statistic } = t
  const saveName = `sma_test_result_${id || (i + 1)}.csv`
  const savePath = path.join(__dirname, saveName)
  const dataToCsv = JSONtoCSV(statistic.tradeEarnList, ['st', 'pf', 'bk'])
  fs.writeFileSync(savePath, dataToCsv)
})
console.log('time used:', (new Date() - d0) / 1000)
// console.log('end')