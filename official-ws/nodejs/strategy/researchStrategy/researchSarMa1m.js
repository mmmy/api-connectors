
const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const SarMaStrategyManager = require('./sar_ma/Manager')
const common = require('../common')

const obManager = new SarMaStrategyManager()

const defaultPriceFilter = {
  longPriceLen: 50,
  longMaxPriceDiff: 100,
  longMinPriceDiff: 40,

  shortPriceLen: 50,
  shortMaxPriceDiff: 43,
  shortMinPriceDiff: 20
}


obManager.addNewStrategy({
  id: 'sar-ma-1min-priceoffset7-profit36',
  use1m: true,
  priceOffset: 7,
  account: { loss: -30, profit: 36, shortProfit: 36, orderCancelTime: 10, frequenceLimit: 2 },
  '1m': { smaFastLen: 5, sarMax: 0.13 },
  ...defaultPriceFilter
})

obManager.addNewStrategy({
  id: 'sar-ma-1min-disableShort-priceoffset7-profit36',
  use1m: true,
  disableShort: true,
  priceOffset: 7,
  account: { loss: -30, profit: 36, orderCancelTime: 10, frequenceLimit: 2 },
  '1m': { smaFastLen: 5, sarMax: 0.13 },
  ...defaultPriceFilter
})

obManager.addNewStrategy({
  id: 'sar-ma-1min-priceoffset7-profit38',
  use1m: true,
  priceOffset: 7,
  account: { loss: -30, profit: 38, shortProfit: 38, orderCancelTime: 10, frequenceLimit: 2 },
  '1m': { smaFastLen: 5, sarMax: 0.13 },
  ...defaultPriceFilter
})

obManager.addNewStrategy({
  id: 'sar-ma-1min',
  use1m: true,
  account: { loss: -30, profit: 33, orderCancelTime: 10, frequenceLimit: 2 },
  '1m': { smaFastLen: 5, sarMax: 0.13 },
  ...defaultPriceFilter
})

obManager.addNewStrategy({
  id: 'sar-ma-1min-priceoffset5-profit34',
  use1m: true,
  priceOffset: 5,
  account: { loss: -30, profit: 34, shortProfit: 34, orderCancelTime: 10, frequenceLimit: 2 },
  '1m': { smaFastLen: 5, sarMax: 0.13 },
  ...defaultPriceFilter
})

const bitmex = new BitmexManager()

bitmex.listenOrderBook(function (data) {
  obManager.updateOrderbook(data)
})

bitmex.listenTrade(function (data) {
  var lastData = data.data.slice(-1)[0]

  obManager.updateCandlesRealTime(lastData)
  // obManager.updateTradeHistoryData(data.data)
  obManager.doStrategy(lastData.price)
})

bitmex.listenCandle({ binSize: '1m' }, function (list) {
  obManager.setCandleHistory('1m', list)
}, function (data) {
  obManager.updateCandleLastHistory('1m', data.data[0])
})

bitmex.listenCandle({ binSize: '5m' }, function (list) {
  obManager.setCandleHistory('5m', list)
}, function (data) {
  obManager.updateCandleLastHistory('5m', data.data[0])
})

bitmex.listenCandle({ binSize: '1h' }, function (list) {
  obManager.setCandleHistory('1h', list)
  obManager.setCandleHistory('4h', list)
}, function (data) {
  obManager.updateCandleLastHistory('1h', data.data[0])
  obManager.updateCandleLastHistory('4h', data.data[0])
})


const webserver = new WebServer({ port: 7006 }, obManager)
