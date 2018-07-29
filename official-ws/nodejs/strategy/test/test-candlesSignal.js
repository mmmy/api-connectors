
var m5Data = require('../data/m5Data.json').reverse()
const Candels = require('../Candles')

var c = new Candels()
var len = m5Data.length

c.setHistoryData(m5Data)

// test ok
c.sarSignal()
// test ok
c.smaSignal()

c.sarSmaSignal()
