
const { apiKey, apiSecret } = require('../../../../strategy/test-secret.json')
// var { apiKey, apiSecret } = require('../../../strategy/daishu-secret.json')

const StrategyUserManager = require('../StrategyUserManager')
const manager = new StrategyUserManager()

manager.addStrategy({
  user: 'yq',
  test: false,
  testnet: true,
  apiKey,
  apiSecret,
  database: false,
})

module.exports = manager
