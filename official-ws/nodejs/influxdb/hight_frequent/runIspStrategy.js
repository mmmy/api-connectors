const BitmexManager = require('../../strategy/researchStrategy/BitmexManager')
// var { apiKey, apiSecret } = require('../../strategy/test-secret.json')
var { apiKey, apiSecret } = require('../../strategy/daishu-secret.json')
const IspStrategyManager = require('./IspStrategy/Manager')
const { SaveRawJson } = require('../db')

const client = new SaveRawJson()

const bitmex = new BitmexManager({
  testnet: false
})

const strategyManager = new IspStrategyManager()

strategyManager.addNewStrategy({
  id: 'ISP-strategy-5-5',
  test: false,
  testnet: false,
  apiKey,
  apiSecret,
  amount: 50,
  upThreshold: 5,
  downThreshold: -5,
  database: true,
})

function dataCb(json) {
  strategyManager.listenJson(json)
  client.saveJson(json)
}

bitmex.listenInstrument(dataCb)

bitmex.listenTrade(dataCb)

bitmex.listenOrderBook(dataCb)
