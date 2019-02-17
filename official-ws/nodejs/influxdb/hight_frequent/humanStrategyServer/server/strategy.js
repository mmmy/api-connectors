
const { apiKey, apiSecret } = require('../../../../strategy/test-secret.json')
var daishu = require('../../../../strategy/daishu-secret.json')
const isProduction = process.env.NODE_ENV === 'production'

const StrategyUserManager = require('../StrategyUserManager')
const manager = new StrategyUserManager()
// 注意，要有个main: true, 这个用来接收orderbook等信息。
manager.addStrategy({
  user: 'yq',
  test: false,
  testnet: isProduction ? false : true,
  apiKey: isProduction ? daishu.apiKey : apiKey,
  apiSecret: isProduction ? daishu.apiSecret : apiSecret,
  database: isProduction,
  main: true,
})

module.exports = manager
