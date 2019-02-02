
const { apiKey, apiSecret } = require('../../../../strategy/test-secret.json')
// var { apiKey, apiSecret } = require('../../../strategy/daishu-secret.json')
const isProduction = process.env.NODE_ENV === 'production'

const StrategyUserManager = require('../StrategyUserManager')
const manager = new StrategyUserManager()
// 注意，要有个main: true, 这个用来接收orderbook等信息。
manager.addStrategy({
  user: 'yq',
  test: false,
  testnet: true,
  apiKey,
  apiSecret,
  database: isProduction,
  main: true,
})

module.exports = manager
