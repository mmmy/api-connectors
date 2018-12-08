const BitmexManager = require('../../strategy/researchStrategy/BitmexManager')
var { apiKey, apiSecret } = require('../../strategy/test-secret.json')
const IspStrategyManager = require('./IspStrategy/Manager')

const bitmex = new BitmexManager({
  testnet: true
})

const strategyManager = new IspStrategyManager()

strategyManager.addNewStrategy({
  id: 'ISP-strategy-3-3',
  test: false,
  testnet: true,
  apiKey,
  apiSecret,
  amount: 1000,
  upThreshold: 3,
  downThreshold: -3,
})

function dataCb(json) {
  strategyManager.listenJson(json)
}

bitmex.listenInstrument(dataCb)

bitmex.listenTrade(dataCb)

bitmex.listenOrderBook(dataCb)
