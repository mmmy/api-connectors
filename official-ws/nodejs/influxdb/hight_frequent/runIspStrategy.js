const BitmexManager = require('../../strategy/researchStrategy/BitmexManager')
// var { apiKey, apiSecret } = require('../../strategy/test-secret.json')
var { apiKey, apiSecret } = require('../../strategy/daishu-secret.json')
const IspStrategyManager = require('./IspStrategy/Manager')
const { SaveRawJson } = require('../db')

// const client_orderbook = new SaveRawJson({cacheLen: 400})
// const client_others = new SaveRawJson({cacheLen: 100})

const bitmex = new BitmexManager({
  testnet: false,
  apiKeyID: apiKey,
  apiKeySecret: apiSecret
})

const strategyManager = new IspStrategyManager()

strategyManager.addNewStrategy({
  id: 'ISP-strategy',
  test: false,
  testnet: false,
  apiKey,
  apiSecret,
  amount: 50,
  upThreshold: 2.5,
  downThreshold: -2.7,
  bookMaxSizeBuy: 5E5,
  bookMaxSizeSell: 5E5,
  database: true,
  initCheckSystem: true,
  notify: false,
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

// bitmex.listenTrade(dataCb)

bitmex.listenOrderBook(dataCb)

bitmex.listenPosition(dataCb)

bitmex.listenMargin(dataCb)

bitmex.listenExecution(dataCb)
