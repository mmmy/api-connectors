const BitmexManager = require('../../strategy/researchStrategy/BitmexManager')
// var { apiKey, apiSecret } = require('../../strategy/test-secret.json')
var { apiKey, apiSecret } = require('../../strategy/test-secret.json')
const IspStrategyManager = require('../hight_frequent/IspBreakStrategy/Manager')

const strategyManager = new IspStrategyManager()

strategyManager.addNewStrategy({
  id: 'ISP-strategy-test',
  test: true,
  testnet: true,
  apiKey,
  apiSecret,
  amount: 50,
  upThreshold: 2.5,
  downThreshold: -2.7,
  bookMaxSizeBuy: 1E6,
  bookMaxSizeSell: 1E6,
  database: false,
  initCheckSystem: false,
  notify: false,
  maxAmountCount: 4,
})

function dataCb(json) {
  // if (json.table === 'orderBookL2_25') {
  //   client_orderbook.saveJson(json)
  // } else if (json.table === 'instrument' || json.table === 'trade') {
  //   client_others.saveJson(json)
  // }
  strategyManager.listenJson(json)
}

const bitmex = new BitmexManager({
  testnet: true,
  apiKeyID: apiKey,
  apiKeySecret: apiSecret
})

bitmex.listenInstrument(dataCb)

bitmex.listenPosition(dataCb)

bitmex.listenExecution(dataCb)

bitmex.listenOrder(dataCb)