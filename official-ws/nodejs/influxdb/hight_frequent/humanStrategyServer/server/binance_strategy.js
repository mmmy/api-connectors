const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'
const MarketManager = require('../../../../binance/MarketManager')

process.setMaxListeners(0)

const StrategyManager = require('../../../../binance/StrategyManager')
const bManager = new StrategyManager()

const yqNotify = {
  on: true,
  token: 'ayuuekzm61f2nm72qes1wkaofyhxp3',
  user: 'uzxi5bsqjf8a58be5kvxzze4m1agwy',
}

const list = []

const BnMarkerManager = new MarketManager({
  testnet: !isProduction
})

if (isProduction) {
  var qq = require('../../../../strategy/apikey/qq_secret_binance.json')
  list.push({
    user: 'yq',
    notify: yqNotify,
    test: false,
    testnet: false,
    apiKey: qq.apiKey,
    apiSecret: qq.apiSecret,
    initCheckSystem: true,
    // main: true,
    configFilePath: path.join(__dirname, 'yq_binance.config.json'),
    marginFilePath: path.join(__dirname, 'yq_binance.marigin.csv'),
  })
} else {
  var qqTest = require('../../../../strategy/apikey/qq_test_binance_secret.json')
  list.push({
    user: 'yq',
    notify: yqNotify,
    test: false,
    testnet: true,
    apiKey: qqTest.apiKey,
    apiSecret: qqTest.apiSecret,
    // database: false,
    // initCheckSystem: true,
    // main: true,
    configFilePath: path.join(__dirname, 'yq_test_binance.config.json'),
    marginFilePath: path.join(__dirname, 'yq_test_binance.marigin.csv'),
  })
}

list.forEach(option => {
  const userManager = bManager.addStrategy(option)
  userManager.initMarketManager(BnMarkerManager)
})

module.exports = bManager
