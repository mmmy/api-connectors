
// var daishu = require('../../../../strategy/daishu-secret.json')
var qq = require('../../../../strategy/secret.json')
const isProduction = process.env.NODE_ENV === 'production'

let qqTest = {}
let yqheroTest = {}
if (!isProduction) {
  qqTest = require('../../../../strategy/test-secret.json')
  yqheroTest = require('../../../../strategy/test-secret-yqhero.json')
}

const StrategyUserManager = require('../StrategyUserManager')
const manager = new StrategyUserManager()
// 注意，要有个main: true, 这个用来接收orderbook等信息。
manager.addStrategy({
  user: 'yq',
  test: false,
  testnet: isProduction ? false : true,
  apiKey: isProduction ? qq.apiKey : qqTest.apiKey,
  apiSecret: isProduction ? qq.apiSecret : qqTest.apiSecret,
  database: isProduction,
  initCheckSystem: true,
  main: true,
})

// manager.addStrategy({
//   user: 'bot',
//   test: false,
//   testnet: isProduction ? false : true,
//   apiKey: isProduction ? qq.apiKey : yqheroTest.apiKey,
//   apiSecret: isProduction ? qq.apiSecret : yqheroTest.apiSecret,
//   database: isProduction,
//   initCheckSystem: false,
//   main: false,
// })

module.exports = manager
