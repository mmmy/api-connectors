
// var daishu = require('../../../../strategy/daishu-secret.json')
const isProduction = process.env.NODE_ENV === 'production'

const StrategyUserManager = require('../StrategyUserManager')
const manager = new StrategyUserManager()

const list = []
if (isProduction) {
  var qq = require('../../../../strategy/apikey/qq_secret.json')
  var godice = require('../../../../strategy/apikey/godice_secret.json')
  // 注意，要有个main: true, 这个用来接收orderbook等信息。
  list.push({
    user: 'yq',
    test: false,
    testnet: false,
    apiKey: qq.apiKey,
    apiSecret: qq.apiSecret,
    database: false,
    initCheckSystem: true,
    main: true,
  })
  list.push({
    user: 'godice',
    test: false,
    testnet: false,
    apiKey: godice.apiKey,
    apiSecret: godice.apiSecret,
    database: false,
    initCheckSystem: false,
    main: false,
  })

} else {
  var qqTest = require('../../../../strategy/apikey/test-secret.json')
  // var yqheroTest = require('../../../../strategy/test-secret-yqhero.json')
  list.push({
    user: 'yq',
    test: false,
    testnet: true,
    apiKey: qqTest.apiKey,
    apiSecret: qqTest.apiSecret,
    database: false,
    initCheckSystem: true,
    main: true,
  })
}

list.forEach(option => {
  manager.addStrategy(option)
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
