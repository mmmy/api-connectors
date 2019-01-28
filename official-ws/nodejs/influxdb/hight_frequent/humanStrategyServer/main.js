
var { apiKey, apiSecret } = require('../../../strategy/test-secret.json')
// var { apiKey, apiSecret } = require('../../strategy/daishu-secret.json')

const createStratey = require('./createStratey')

createStratey({
  testnet: true,
  apiKey,
  apiSecret,
})