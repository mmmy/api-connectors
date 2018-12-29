const BitmexManager = require('../../../strategy/researchStrategy/BitmexManager')
// var { apiKey, apiSecret } = require('../../../strategy/test-secret.json')
var { apiKey, apiSecret } = require('../../../strategy/daishu-secret.json')
const OrderBookStrategyManager = require('./Manager')
const { SaveRawJson } = require('../../db')

// const client_orderbook = new SaveRawJson({cacheLen: 400})
// const client_others = new SaveRawJson({cacheLen: 100})

const bitmex = new BitmexManager({
  testnet: false,
  apiKeyID: apiKey,
  apiKeySecret: apiSecret
})

const strategyManager = new OrderBookStrategyManager()

strategyManager.addNewStrategy({
  id: 'ob-strategy',
  test: false,
  testnet: false,
  apiKey,
  apiSecret,
  amount: 100,
  database: false,
  initCheckSystem: true,
  notify: true,
  autoOrderStop: true,
  secondsForClose1: 120,
  secondsForClose2: 170,
  // isReduceOnly: function() {
  //   // utc
  //   const hour = new Date().getHours()
  //   return hour > 12 || hour < 3
  // }
})

function dataCb(json) {
  // if (json.table === 'orderBookL2_25') {
  //   client_orderbook.saveJson(json)
  // } else if (json.table === 'instrument' || json.table === 'trade') {
  //   client_others.saveJson(json)
  // }
  strategyManager.listenJson(json)
}

bitmex.listenInstrument(dataCb) 

bitmex.listenTrade(dataCb)

bitmex.listenOrderBook(dataCb)

bitmex.listenPosition(dataCb)

bitmex.listenMargin(dataCb)
bitmex.listenOrder(dataCb)

// bitmex.listenExecution(dataCb)

bitmex.listenCandle({binSize: '1m', count: 200}, historyList => {
  strategyManager.setCandles1mHistory(historyList)
}, dataCb)
