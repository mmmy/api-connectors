
const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const SuijiStrategyManager = require('./suiji/Manager')

const obManager = new SuijiStrategyManager()

obManager.addNewStrategy({
  id: 'suiji-20', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
})

obManager.addNewStrategy({
  id: 'suiji-10', 
  account: {loss: -10, profit: 10, frequenceLimit: 0.1 },
  // orderbook: {rateBig: 2, histLenBig: 60, lenBig: 24}
})

const bitmex = new BitmexManager()
// bitmex.listenOrderBook(function(data) {
//   obManager.updateOrderbook(data)
// })

bitmex.listenTrade(function(data) {
  var lastData = data.data.slice(-1)[0]

  // obManager.updateCandlesRealTime(lastData)
  // obManager.updateTradeHistoryData(data.data)
  obManager.doStrategy(lastData.price)
})

const webserver = new WebServer({ port: 7001 }, obManager)
