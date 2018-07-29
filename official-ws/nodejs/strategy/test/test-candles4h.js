const BitmexManager = require('../researchStrategy/BitmexManager')
const hourData = require('../data/data1h.json').reverse()

const Candels4H = require('../Candles4H')

var c = new Candels4H()
var len = hourData.length
var histData = hourData.slice(0, len - 10)
var newData = hourData.slice(len - 10)

c.setHistoryData(histData)
for(var i=0; i<newData.length; i++) {
  c.updateLastHistory(newData[i])
}
// test ok
console.log(c)
var candleManager = new Candels4H()
function logCandle() {
  var relC = candleManager._latestCandle && candleManager._latestCandle.getCandle()
  var hist = candleManager._histories.slice(-3)
  console.log('realTime Candle -----------')
  console.log(relC)
  console.log(hist)
  console.log(candleManager._unMergeCandles)
}
var bitmex = new BitmexManager()

bitmex.listenTrade(function(data) {
  var lastData = data.data.slice(-1)[0]

  candleManager.updateRealTimeCandle(lastData)
})

bitmex.listenCandle({binSize: '1h', count: 400}, function(list) {
  candleManager.setHistoryData(list)
  logCandle()
}, function(data) {
  candleManager.updateLastHistory(data.data[0])
})

setInterval(() => {
  logCandle()
}, 30 * 60 * 1000)
