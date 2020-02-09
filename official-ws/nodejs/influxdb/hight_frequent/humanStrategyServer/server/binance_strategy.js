const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'

process.setMaxListeners(0)

const StrategyManager = require('../../../../binance/StrategyManager')
const bManager = new StrategyManager()

const yqNotify = {
  on: true,
  token: 'aiee6nmcgz678kbouuoujsmf4wko96',
  user: 'gdz6nj653847v5e65px71bcstdsicv',
}

const list = []

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
  bManager.addStrategy(option)
})

module.exports = bManager
