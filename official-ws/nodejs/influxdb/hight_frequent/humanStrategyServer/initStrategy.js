const BitmexManager = require('../../strategy/researchStrategy/BitmexManager')
var { apiKey, apiSecret } = require('../../strategy/test-secret.json')
// var { apiKey, apiSecret } = require('../../strategy/daishu-secret.json')
const HumanStrategy = require('./HumanStrategy')

const bitmex = new BitmexManager({
  testnet: true,
  apiKeyID: apiKey,
  apiKeySecret: apiSecret
})

const strategy = new HumanStrategy({
  id: 'humaun-strategy',
  test: true,
  testnet: true,
  apiKey,
  apiSecret,
  database: false
})

function dataCb(json) {
  // if (json.table === 'orderBookL2_25') {
  //   client_orderbook.saveJson(json)
  // } else if (json.table === 'instrument' || json.table === 'trade') {
  //   client_others.saveJson(json)
  // }
  strategy.listenJson(json)
}

// bitmex.listenInstrument(dataCb) 

// bitmex.listenTrade(dataCb)

// bitmex.listenOrderBook(dataCb)

bitmex.listenPosition(dataCb)

bitmex.listenMargin(dataCb)

bitmex.listenExecution(dataCb)

module.exports = strategy
