const BitmexManager = require('../../../strategy/researchStrategy/BitmexManager')
// var { apiKey, apiSecret } = require('../../strategy/daishu-secret.json')
var { apiKey, apiSecret } = require('../../../strategy/test-secret.json')

const HumanStrategy = require('./HumanStrategy')
/**
  id: 'humaun-strategy',
  user: 'yq'
  test: true,
  testnet: true,
  apiKey,
  apiSecret,
  database: false
 */
module.exports = function createStratey(options) {
  const strategy = new HumanStrategy({
    id: 'human-strategy',
    user: 'yq',
    test: true,
    testnet: true,
    apiKey,
    apiSecret,
    database: false,
    ...options
  })
  const bitmex = new BitmexManager({
    testnet: options.testnet,
    apiKeyID: options.apiKey,
    apiKeySecret: options.apiSecret
  })
  function dataCb(json, symbol) {
    // if (json.table === 'orderBookL2_25') {
    //   client_orderbook.saveJson(json)
    // } else if (json.table === 'instrument' || json.table === 'trade') {
    //   client_others.saveJson(json)
    // }
    strategy.listenJson(json, symbol)
  }
  bitmex.listenPosition(dataCb, "*")

  bitmex.listenMargin(dataCb, "*")
  bitmex.listenOrder(dataCb, "*")
  // bitmex.listenExecution(dataCb)
  if (options.main) {
    // bitmex.listenOrderBook(dataCb)
    bitmex.listenQuote(dataCb, 'XBTUSD')
    bitmex.listenQuote(dataCb, 'ETHUSD')
    bitmex.listenQuote(dataCb, 'XRPH19')
  } else {
    // 为了保持和bitmex的连接, 也可以send {ping}
    bitmex.listenInstrument(() => {})
  }
  
  return strategy
}
