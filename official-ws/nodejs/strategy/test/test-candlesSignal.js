
var m5Data = require('../data/data1h.json').reverse()
const Candels = require('../Candles')

var c = new Candels()
c.setOptions({
  sarStart: 0.017,
  sarStep: 0.034,
  sarMax: 0.13,
  smaFastLen: 53,
  smaSlowLen: 88,
})

const startIndex = 100

var len = m5Data.length

c.setHistoryData(m5Data.slice(0, startIndex))

m5Data.slice(startIndex - 1).forEach(candle => {
  c.updateLastHistory(candle)
  let signal = c.macdDepartSignal()
  if (signal.long) {
    console.log('long', candle.timestamp)
  } else if (signal.short) {
    console.log('short', candle.timestamp)
  }
})
// test ok
// console.log(c.sarSignal())
// test ok
// c.smaSignal()

// console.log(c.smaCrossSignal())
