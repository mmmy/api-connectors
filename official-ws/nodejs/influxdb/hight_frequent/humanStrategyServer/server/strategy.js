
// var daishu = require('../../../../strategy/daishu-secret.json')
const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'

process.setMaxListeners(0)
const BitmexManager = require('../../../../strategy/researchStrategy/BitmexManager')
const StrategyUserManager = require('../StrategyUserManager')
const manager = new StrategyUserManager()

const yqNotify = {
  on: true,
  token: 'aiee6nmcgz678kbouuoujsmf4wko96',
  user: 'gdz6nj653847v5e65px71bcstdsicv',
}

const list = []
if (isProduction) {
  var qq = require('../../../../strategy/apikey/qq_secret.json')
  var godice = require('../../../../strategy/apikey/godice_secret.json')
  var yqhero = require('../../../../strategy/apikey/yqhero-secret.json')
  // 注意，要有个main: true, 这个用来接收orderbook等信息。
  list.push({
    user: 'yq',
    notify: yqNotify,
    test: false,
    testnet: false,
    apiKey: qq.apiKey,
    apiSecret: qq.apiSecret,
    database: false,
    initCheckSystem: true,
    main: true,
    configFilePath: path.join(__dirname, 'yq.config.json'),
    marginFilePath: path.join(__dirname, 'yq.marigin.csv'),
  })

  list.push({
    user: 'lixihuan',
    notify: yqNotify,
    test: false,
    testnet: false,
    apiKey: yqhero.apiKey,
    apiSecret: yqhero.apiSecret,
    database: false,
    initCheckSystem: false,
    main: false,
    configFilePath: path.join(__dirname, 'yqhero.config.json'),
    marginFilePath: path.join(__dirname, 'yqhero.marigin.csv'),
  })

  list.push({
    user: 'godice',
    notify: yqNotify,
    test: false,
    testnet: false,
    apiKey: godice.apiKey,
    apiSecret: godice.apiSecret,
    database: false,
    initCheckSystem: false,
    main: false,
    BotConfig: {
      usdMode: true,  // $本位
    },
    botRsiDivergence: {
      on: true,
      highBoDong: false, // for test
    },
    botBreakCandle: {
      on: true,
      upVol: false, // for test
    },
    botPinBar: {
      on: true
    },
    autoUpdateStopOpenMarketOrder: true,
    autoUpdateStopOpenMarketOrder1h: false,
    configFilePath: path.join(__dirname, 'godice.config.json'),
    marginFilePath: path.join(__dirname, 'godice.marigin.csv'),
  })

} else {
  var qqTest = require('../../../../strategy/apikey/test-secret.json')
  var yqheroTest = require('../../../../strategy/apikey/test-secret-yqhero.json')
  list.push({
    user: 'yq',
    notify: yqNotify,
    test: false,
    testnet: true,
    apiKey: qqTest.apiKey,
    apiSecret: qqTest.apiSecret,
    database: false,
    initCheckSystem: true,
    main: true,
    configFilePath: path.join(__dirname, 'yq.config.json'),
    marginFilePath: path.join(__dirname, 'yq.marigin.csv'),
  })
  list.push({
    user: 'yqhero',
    notify: yqNotify,
    test: false,
    testnet: true,
    apiKey: yqheroTest.apiKey,
    apiSecret: yqheroTest.apiSecret,
    database: false,
    initCheckSystem: false,
    main: false,
    BotConfig: {
      usdMode: true,  // $本位
    },
    botRsiDivergence: {
      on: true,
      highBoDong: false, // for test
    },
    botBreakCandle: {
      on: true,
      upVol: false, // for test
    },
    botPinBar: {
      on: true
    },
    autoUpdateStopOpenMarketOrder: true,
    autoUpdateStopOpenMarketOrder1h: false,
    configFilePath: path.join(__dirname, 'yqhero.config.json'),
    marginFilePath: path.join(__dirname, 'yqhero.marigin.csv'),
  })
}

list.forEach(option => {
  manager.addStrategy(option)
})

const bitmexPublic = new BitmexManager({
  testnet: !isProduction,
  // apiKeyID: options.apiKey,
  // apiKeySecret: options.apiSecret
})

function dataCb(json, symbol) {
  // if (json.table === 'orderBookL2_25') {
  //   client_orderbook.saveJson(json)
  // } else if (json.table === 'instrument' || json.table === 'trade') {
  //   client_others.saveJson(json)
  // }
  manager.listenPublicJson(json, symbol)
}

// bitmexPublic.listenOrderBook(dataCb, 'XBTUSD')

const symbols1d = ['XBTUSD', 'ETHUSD']
symbols1d.forEach(symbol => {
  // 1天K线
  bitmexPublic.listenCandle({ binSize: '1d', count: 200 }, list => {
    manager.setCandlesHistory(list, symbol, '1d')
  }, dataCb, symbol)
})

let symbols1h = ['XBTUSD', 'ETHUSD']
symbols1h.forEach(symbol => {
  bitmexPublic.listenQuote(dataCb, symbol)
  bitmexPublic.listenInstrument(dataCb, symbol)
  // 1小时K线
  bitmexPublic.listenCandle({ binSize: '1h', count: 200 }, list => {
    manager.setCandlesHistory(list, symbol, '1h')
    manager.setCandlesHistory(list, symbol, '4h')
  }, dataCb, symbol)
})

let symbols5m = ['XBTUSD', 'ETHUSD']
symbols5m.forEach(symbol => {
  // 5m
  bitmexPublic.listenCandle({ binSize: '5m', count: 200 }, list => {
    manager.setCandlesHistory(list, symbol, '5m')
  }, dataCb, symbol)
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
