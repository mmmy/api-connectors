var { apiKey, apiSecret } = require('../yqhero_secret.json')

const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const SarMaStrategyManager = require('./sar_ma/Manager')
const common = require('../common')
/*
  5分钟策略
  这个适合小震荡
*/

const defaultPriceFilter = {
  longPriceLen: 15,
  longMaxPriceDiff: 60,
  longMinPriceDiff: 0,

  shortPriceLen: -1,
  // shortMaxPriceDiff: 43,
  // shortMinPriceDiff: 20
}

const obManager = new SarMaStrategyManager()
// run real rocket
obManager.addNewStrategy({
  id: 'sar-ma-5min-yangqihero-priceOffset1',
  amount: 2000,
  priceOffset: 3,
  disableShort: true,
  account: {
    loss: -40,
    shortLoss: -44,
    profit: 60,
    shortProfit: 55,
    frequenceLimit: 2,
    test: true,
    notify: true,
    name: '2',
    // apiKey,
    // apiSecret
  },
  '5m': {
    smaFastLen: 33,
    smaSlowLen: 66,
    sarStart: 0.017,
    sarStep: 0.034,
    sarMax: 0.013,
  },
  ...defaultPriceFilter
})

// test
obManager.addNewStrategy({
  id: 'sar-ma-5min', 
  account: {loss: -40, shortLoss: -44, profit: 58, shortProfit: 55, frequenceLimit: 2 },
  // '5m': { smaFastLen: 2 },
  ...defaultPriceFilter
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


const webserver = new WebServer({ port: 7778 }, obManager)
