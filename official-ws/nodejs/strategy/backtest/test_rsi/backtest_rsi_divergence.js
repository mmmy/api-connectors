
const TestStrategy = require('./BackTestRsiDivergence')
const BackTestManager = require('../BackTestManager')

const path = require('path')
const fs = require('fs')

const timeToSeries = require('../utils').timeToSeries

const JSONtoCSV = require('../utils').JSONtoCSV

var xbt5m = require('../data/xbt5m')
var len = xbt5m.length

const manager = new BackTestManager()

manager.addNewStrategy(new TestStrategy({
  id: 'rsi_divergence',
  disableShort: true,
}))

function testRange(orangeData, indexRange) {
  const startIndex = indexRange[0]
  const endIndex = indexRange[1] || orangeData.length
  manager.setCandleHistory('5m', orangeData.slice(startIndex - 380, startIndex))
  for (let i = startIndex; i < endIndex; i++) {
    const bar = orangeData[i]
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

let dataSeries = [
  // [400]
  // ['2017-09-16T00:00:00.000Z', '2017-12-13T00:00:00.000Z'],
  // ["2017-10-01T00:00:00.000Z", "2017-11-10T00:00:00.000Z",],
  // ["2017-11-13T00:00:00.000Z", "2017-12-08T00:00:00.000Z",],
  ["2019-05-19T22:00:00.000Z"]
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
