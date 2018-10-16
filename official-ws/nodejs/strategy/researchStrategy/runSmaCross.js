// var { apiKey, apiSecret } = require('../yqhero_secret.json')
var { apiKey, apiSecret } = require('../secret.json')

const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const SarMaStrategyManager = require('./sma_cross/Manager')
const common = require('../common')
/*
  5分钟策略, SMA cross
*/

const defaultPriceFilter = {
  longPriceLen: 6,
  longMaxPriceDiff: 30,
  longMinPriceDiff: 0,

  shortPriceLen: -1,
  // shortMaxPriceDiff: 43,
  // shortMinPriceDiff: 20
}

const obManager = new SarMaStrategyManager()
// run real rocket
obManager.addNewStrategy({
  id: 'samcorss-5m-yangqihero-priceOffset1',
  amount: 2000,
  priceOffset: 1,
  disableShort: true,
  account: {
    loss: -30,
    shortLoss: -30,
    profit: 37,
    shortProfit: 37,
    frequenceLimit: 2,
    test: true,
    notify: false,
    name: '3',
    // apiKey,
    // apiSecret
  },
  '5m': {
    smaFastLen: 53,
    smaSlowLen: 88,
  },
  '1d': {
    smaFilterLen: 8
  },
  ...defaultPriceFilter
})

obManager.addNewStrategy({
  id: 'samcorss-5m-yangqihero-profit37',
  amount: 10000,
  priceOffset: 30,
  disableShort: true,
  account: {
    loss: -25,
    shortLoss: -30,
    profit: 60,
    shortProfit: 37,
    frequenceLimit: 2,
    test: false,
    notify: true,
    name: '4',
    apiKey,
    apiSecret
  },
  '5m': {
    smaFastLen: 53,
    smaSlowLen: 88,
  },
  '1d': {
    smaFilterLen: 8
  },
  ...defaultPriceFilter,
})

// obManager.addNewStrategy({
//   id: 'samcorss-5m-yangqihero-test',
//   amount: 2000,
//   priceOffset: 1,
//   disableShort: false,
//   account: {
//     loss: -40,
//     shortLoss: -44,
//     profit: 59,
//     shortProfit: 55,
//     frequenceLimit: 2,
//     test: true,
//     notify: false,
//     name: '5',
//     // apiKey,
//     // apiSecret
//   },
//   '5m': {
//     smaFastLen: 15,
//     smaSlowLen: 30,
//   },
//   '1d': {
//     smaFilterLen: 8
//   },
//   ...defaultPriceFilter
// })

// test
// obManager.addNewStrategy({
//   id: 'samcorss-5m', 
//   account: {loss: -40, shortLoss: -44, profit: 58, shortProfit: 55, frequenceLimit: 2 },
//   // '5m': { smaFastLen: 2 },
//   ...defaultPriceFilter
// })

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

// bitmex.listenCandle({binSize: '1m'}, function(list) {
//   obManager.setCandleHistory('1m', list)
// }, function(data) {
//   obManager.updateCandleLastHistory('1m', data.data[0])
// })

bitmex.listenCandle({binSize: '5m'}, function(list) {
  obManager.setCandleHistory('5m', list)
}, function(data) {
  obManager.updateCandleLastHistory('5m', data.data[0])
})

// bitmex.listenCandle({binSize: '1h'}, function(list) {
//   obManager.setCandleHistory('1h', list)
//   obManager.setCandleHistory('4h', list)
// }, function(data) {
//   obManager.updateCandleLastHistory('1h', data.data[0])
//   obManager.updateCandleLastHistory('4h', data.data[0])
// })

bitmex.listenCandle({binSize: '1d'}, function(list) {
  obManager.setCandleHistory('1d', list)
}, function(data) {
  obManager.updateCandleLastHistory('1d', data.data[0])
})

const webserver = new WebServer({ port: 7779 }, obManager)
