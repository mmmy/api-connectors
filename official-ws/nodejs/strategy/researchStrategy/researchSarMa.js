
const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const SarMaStrategyManager = require('./sar_ma/Manager')
const common = require('../common')

const obManager = new SarMaStrategyManager()

obManager.addNewStrategy({
  id: 'sar-ma-5min', 
  account: {loss: -40, profit: 62, shortProfit: 50, frequenceLimit: 1 },
})

obManager.addNewStrategy({
  id: 'sar-ma-5min-priceoffset5',
  priceOffset: 5,
  account: {loss: -40, profit: 62, shortProfit: 50, frequenceLimit: 1 },
})

obManager.addNewStrategy({
  id: 'sar-ma-5min-priceoffset10',
  priceOffset: 10,
  account: {loss: -40, profit: 62, shortProfit: 50, frequenceLimit: 1 },
})

obManager.addNewStrategy({
  id: 'sar-ma-5min-priceoffset15',
  priceOffset: 15,
  account: {loss: -40, profit: 62, shortProfit: 50, frequenceLimit: 1 },
})

obManager.addNewStrategy({
  id: 'sar-ma-1min',
  use1m: true,
  account: {loss: -40, profit: 62, shortProfit: 50, frequenceLimit: 1 },
})

obManager.addNewStrategy({
  id: 'sar-ma-1min-priceoffset5',
  use1m: true,
  priceOffset: 5,
  account: {loss: -40, profit: 62, shortProfit: 50, frequenceLimit: 1 },
})

obManager.addNewStrategy({
  id: 'sar-ma-1min-priceoffset10',
  use1m: true,
  priceOffset: 10,
  account: {loss: -40, profit: 62, shortProfit: 50, frequenceLimit: 1 },
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

bitmex.listenCandle({binSize: '5m'}, function(list) {
  obManager.setCandleHistory('5m', list)
}, function(data) {
  obManager.updateCandleLastHistory('5m', data.data[0])
})

bitmex.listenCandle({binSize: '1h'}, function(list) {
  obManager.setCandleHistory('1h', list)
  obManager.setCandleHistory('4h', list)
}, function(data) {
  obManager.updateCandleLastHistory('1h', data.data[0])
  obManager.updateCandleLastHistory('4h', data.data[0])
})


const webserver = new WebServer({ port: 7005 }, obManager)
