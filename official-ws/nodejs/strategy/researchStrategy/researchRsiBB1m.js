
const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const RsiBBStrategyManager = require('./rsi_bb_reverse/Manager')
const common = require('../common')

const obManager = new RsiBBStrategyManager()

// obManager.addNewStrategy({
//   id: 'rsi-bb-1min-disableShort',
//   use1m: true,
//   disableShort: true,
//   account: {loss: -20, profit: 23, frequenceLimit: 1 },
// })

obManager.addNewStrategy({
  id: 'rsi-bb-1min',
  use1m: true,
  account: {loss: -30, profit: 45, shortProfit: 45, frequenceLimit: 1 },
})

obManager.addNewStrategy({
  id: 'rsi-bb-1min-priceoffset2-shortProfit20.5',
  use1m: true,
  priceOffset: 2,
  account: {loss: -30, profit: 45, shortProfit: 45, frequenceLimit: 1 },
})

obManager.addNewStrategy({
  id: 'rsi-bb-1min-priceoffset4-profit24',
  use1m: true,
  priceOffset: 4,
  account: {loss: -30, profit: 45, shortProfit: 45, frequenceLimit: 1 },
})

const bitmex = new BitmexManager()

bitmex.listenOrderBook(function(data) {
  obManager.updateOrderbook(data)
})

bitmex.listenTrade(function(data) {
  var lastData = data.data.slice(-1)[0]

  obManager.updateCandlesRealTime(lastData)
  // obManager.updateTradeHistoryData(data.data)
  obManager.doStrategy(lastData.price)
})

bitmex.listenCandle({binSize: '1m'}, function(list) {
  obManager.setCandleHistory('1m', list)
}, function(data) {
  obManager.updateCandleLastHistory('1m', data.data[0])
})

// bitmex.listenCandle({binSize: '5m'}, function(list) {
//   obManager.setCandleHistory('5m', list)
// }, function(data) {
//   obManager.updateCandleLastHistory('5m', data.data[0])
// })

bitmex.listenCandle({binSize: '1h'}, function(list) {
  obManager.setCandleHistory('1h', list)
  obManager.setCandleHistory('4h', list)
}, function(data) {
  obManager.updateCandleLastHistory('1h', data.data[0])
  obManager.updateCandleLastHistory('4h', data.data[0])
})


const webserver = new WebServer({ port: 7007 }, obManager)
