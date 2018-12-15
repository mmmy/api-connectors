
const BitmexManager = require('../researchStrategy/BitmexManager')
const SarMaStrategyManager = require('../researchStrategy/sar_ma/Manager')
var { apiKey, apiSecret } = require('../test-secret.json')


const obManager = new SarMaStrategyManager()

obManager.addNewStrategy({
  id: 'test',
})

const bitmex = new BitmexManager({
  testnet: true,
  apiKeyID: apiKey,
  apiKeySecret: apiSecret
})

// bitmex.listenOrderBook(function(data) {
//   obManager.updateOrderbook(data)
// })

// bitmex.listenCandle({binSize: '5m'}, function(list) {
//   obManager.setCandleHistory('5m', list)
// }, function(data) {
//   obManager.updateCandleLastHistory('5m', data.data[0])
// })

// bitmex.listenExecution(function(data) {
//   // console.log(data)
// })

bitmex.listenPosition(function(data) {
  console.log(data)
})

// bitmex.listenMargin(function(json) {
//   console.log(json)
// })

// bitmex.listenInstrument(function(json) {
//   console.log(json)
// })
