
const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const MinuteStrategyManager = require('./minute/Manager')
const common = require('../common')

const obManager = new MinuteStrategyManager()

obManager.addNewStrategy({
  id: 'minute-5', 
  account: {loss: -5, profit: 5, frequenceLimit: 0.1 },
})

obManager.addNewStrategy({
  id: 'minute-10', 
  account: {loss: -10, profit: 10, frequenceLimit: 0.1 },
  // orderbook: {rateBig: 2, histLenBig: 60, lenBig: 24}
})

obManager.addNewStrategy({
  id: 'minute-18', 
  account: {loss: -18, profit: 18, frequenceLimit: 0.1 },
  // orderbook: {rateBig: 2, histLenBig: 60, lenBig: 24}
})

obManager.addNewStrategy({
  id: 'minute-20', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
  // orderbook: {rateBig: 2, histLenBig: 60, lenBig: 24}
})

obManager.addNewStrategy({
  id: 'minute-23', 
  account: {loss: -23, profit: 23, frequenceLimit: 0.1 },
  // orderbook: {rateBig: 2, histLenBig: 60, lenBig: 24}
})

obManager.addNewStrategy({
  id: 'minute-30', 
  account: {loss: -30, profit: 30, frequenceLimit: 0.1 },
  // orderbook: {rateBig: 2, histLenBig: 60, lenBig: 24}
})

obManager.addNewStrategy({
  id: 'minute-20', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
  orderbook: {lenBig: 24}
})

const bitmex = new BitmexManager()

bitmex.listenCandle({binSize: '1m'}, function(list) {
  obManager.setCandleHistory('1m', list)
}, function(data) {
  obManager.updateCandleLastHistory('1m', data.data[0])
})

bitmex.listenCandle({binSize: '1h'}, function(list) {
  obManager.setCandleHistory('1h', list)
}, function(data) {
  obManager.updateCandleLastHistory('1h', data.data[0])
})

bitmex.listenOrderBook(function(data) {
  obManager.updateOrderbook(data)
})

bitmex.listenTrade(function(data) {
  var lastData = data.data.slice(-1)[0]

  obManager.updateCandlesRealTime(lastData)
  // obManager.updateTradeHistoryData(data.data)
  obManager.doStrategy(lastData.price)
})

const webserver = new WebServer({ port: 7002 }, obManager)
