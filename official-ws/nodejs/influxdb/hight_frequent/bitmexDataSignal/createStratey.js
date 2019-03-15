const BitmexManager = require('../../../strategy/researchStrategy/BitmexManager')
// var { apiKey, apiSecret } = require('../../strategy/daishu-secret.json')
// var { apiKey, apiSecret } = require('../../../strategy/test-secret.json')

const BitmexDataSignal = require('./BitmexDataSignal')
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
  const strategy = new BitmexDataSignal({
    id: 'bitmex-signal',
    user: 'yq',
    test: true,
    testnet: true,
    // apiKey,
    // apiSecret,
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

  ['XBTUSD', 'ETHUSD'].forEach(symbol => {
    bitmex.listenOrderBook(dataCb, symbol)
  })

  return strategy
}
