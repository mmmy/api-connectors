
var m5Data = require('../data/m5Data.json').reverse()
const Candels = require('../Candles')

var c = new Candels()
c.setOptions({
  sarStart: 0.017,
  sarStep: 0.034,
  sarMax: 0.13
})

var len = m5Data.length

c.setHistoryData(m5Data)

// test ok
console.log(c.sarSignal())
// test ok
// c.smaSignal()

// c.sarSmaSignal()
