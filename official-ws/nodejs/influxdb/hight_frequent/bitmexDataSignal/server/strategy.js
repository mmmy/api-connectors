
// const { apiKey, apiSecret } = require('../../../../strategy/test-secret.json')
// var daishu = require('../../../../strategy/daishu-secret.json')
// var qq = require('../../../../strategy/secret.json')
const isProduction = process.env.NODE_ENV === 'production'

const createStratey = require('../createStratey')
const dataManager = createStratey({
  user: 'yq',
  test: false,
  testnet: isProduction ? false : true,
  // apiKey: isProduction ? qq.apiKey : apiKey,
  // apiSecret: isProduction ? qq.apiSecret : apiSecret,
  database: false,
})

module.exports = dataManager
