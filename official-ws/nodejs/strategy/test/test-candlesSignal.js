
var m5Data = require('../data/5m.json').reverse()
const Candels = require('../Candles')

var c = new Candels()
c.setOptions({
  sarStart: 0.017,
  sarStep: 0.034,
  sarMax: 0.13,
  smaFastLen: 53,
  smaSlowLen: 88,
})

var len = m5Data.length

m5Data =m5Data.slice(0, len - 1)

c.setHistoryData(m5Data)

// test ok
// console.log(c.sarSignal())
// test ok
// c.smaSignal()

console.log(c.smaCrossSignal())
