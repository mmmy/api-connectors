const BitmexManager = require('../../strategy/researchStrategy/BitmexManager')
// var { apiKey, apiSecret } = require('../../strategy/test-secret.json')
var { apiKey, apiSecret } = require('../../strategy/test-secret.json')
const HumanStrategy = require('../hight_frequent/humanStrategyServer/HumanStrategy')

const strategy = new HumanStrategy({
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

function dataCb(json, symbol) {
  // if (json.table === 'orderBookL2_25') {
  //   client_orderbook.saveJson(json)
  // } else if (json.table === 'instrument' || json.table === 'trade') {
  //   client_others.saveJson(json)
  // }
  strategy.listenJson(json, symbol)
  if (json.table === 'tradeBin1m') {
    const signal = strategy._candles1h.calcMacdDepartSignal(symbol)
    if (signal.long) {
      console.log(symbol, 'signal long')
    } else if (signal.short) {
      console.log(symbol, 'signal short')
    }
  }
}

const bitmex = new BitmexManager({
  testnet: true,
  apiKeyID: apiKey,
  apiKeySecret: apiSecret
})

// bitmex.listenInstrument(dataCb, "*")

// bitmex.listenPosition(dataCb, "*")

// bitmex.listenExecution(dataCb)

// bitmex.listenOrder(dataCb, "*")
const symbols = ['XBTUSD', 'ETHUSD', 'ADAH19', 'XRPH19']
symbols.forEach(symbol => {
  bitmex.listenQuote(dataCb, symbol)
  // 1小时K线
  bitmex.listenCandle({ binSize: '1m', count: 200 }, list => {
    strategy.setCandles1hHistory(list, symbol)
  }, dataCb, symbol)
})
// bitmex.listenQuote(dataCb, 'XBTUSD')

// setInterval(() => {
//   console.log(strategy.getAccountAllOrders().length)
  
// }, 5000)