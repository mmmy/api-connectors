
const BackTestSma = require('./BackTestSma')
const BackTestManager = require('../BackTestManager')
var ProgressBar = require('progress');

var xbt5m = require('../data/xbt5m')
var len = xbt5m.length

const manager = new BackTestManager()
manager.addNewStrategy(new BackTestSma({
  '5m': { smaFastLen: 50, smaSlowLen: 88 }
}))

const startDateTime = new Date("2018-08-27T14:00:00.000Z")
let startIndex = len - 1200
for (let i = 0; i < len; i++) {
  const b = xbt5m[i]
  if (+new Date(b.timestamp) === +startDateTime) {
    startIndex = i
  }
}

console.log('startIndex',startIndex)

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

console.log(JSON.stringify(manager.getAllTrades()))
// console.log('end')