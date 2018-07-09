var Candles = require('./Candles')



// test
var candles = require('./data/5min.json')
// var lastCandle = {"timestamp":"2018-07-09T07:40:00.000Z","symbol":"XBTUSD","open":6712.5,"high":6713.5,"low":6711,"close":6713,"trades":931,"volume":4348093,"vwap":6711.8599,"lastSize":8245,"turnover":64784056942,"homeNotional":647.8405694200001,"foreignNotional":4348093}
candles = candles.reverse()

var cc = new Candles()

// mock
var startData = candles.slice(0, 200)
cc.setHistoryData(startData)

var newDatas = candles.slice(200)
newDatas.forEach(data => {
  cc.updateLastHistory(data)
  cc.checkData()
  var signal = cc.mayTrendReverseSignal()
  if (signal.short) {
    console.log('may short: ', new Date(data.timestamp).toLocaleString(), data.close)
  } else if (signal.long) {
    console.log('may long: ', new Date(data.timestamp).toLocaleString(), data.close)
  }
})
// cc.setHistoryData(candles)
// // cc.updateLastHistory(lastCandle)
// // ok
// cc.checkData()
// // ok
// cc.bollSignal()
// // ok
// cc.rsiSignal()
