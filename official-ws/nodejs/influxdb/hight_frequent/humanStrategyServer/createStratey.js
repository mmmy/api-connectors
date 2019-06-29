const BitmexManager = require('../../../strategy/researchStrategy/BitmexManager')
// var { apiKey, apiSecret } = require('../../strategy/daishu-secret.json')
// var { apiKey, apiSecret } = require('../../../strategy/test-secret.json')

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
  bitmex.listenPosition(dataCb, "*")

  bitmex.listenMargin(dataCb, "*")
  bitmex.listenOrder(dataCb, "*")
  // bitmex.listenExecution(dataCb)
  /*
  if (options.main) {
    bitmex.listenOrderBook(dataCb, 'XBTUSD')

    const symbols1d = ['XBTUSD', 'ETHUSD']
    symbols1d.forEach(symbol => {
      // 1天K线
      bitmex.listenCandle({ binSize: '1d', count: 200 }, list => {
        strategy.setCandlesHistory(list, symbol, '1d')
      }, dataCb, symbol)
    })

    let symbols1h = ['XBTUSD', 'ETHUSD']
    symbols1h.forEach(symbol => {
      bitmex.listenQuote(dataCb, symbol)
      bitmex.listenInstrument(dataCb, symbol)
      // 1小时K线
      bitmex.listenCandle({ binSize: '1h', count: 200 }, list => {
        strategy.setCandlesHistory(list, symbol, '1h')
      }, dataCb, symbol)
    })

    let symbols5m = ['XBTUSD', 'ETHUSD']
    symbols5m.forEach(symbol => {
      // 5m
      bitmex.listenCandle({ binSize: '5m', count: 200 }, list => {
        strategy.setCandlesHistory(list, symbol, '5m')
      }, dataCb, symbol)
    })
  } else {
    */
    // 为了保持和bitmex的连接, 也可以send {ping}
  bitmex.listenInstrument(() => { })
  // }

  return strategy
}
