
const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const OrderBookStrategyManager = require('./orderbook/Manager')

const obManager = new OrderBookStrategyManager()

obManager.addNewStrategy({ id: 'orderbook-rearch-1' })

obManager.addNewStrategy({
  id: 'orderbook-rearch-lossprofit5', 
  account: {loss: -5, profit: 5, frequenceLimit: 0.1 },
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-lossprofit10', 
  account: {loss: -10, profit: 10, frequenceLimit: 0.1 },
})


obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-ratesmall2', 
  account: {loss: -2, profit: 2, frequenceLimit: 0.1 },
  orderbook: {rateSmall: 2}
})


obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-histLenBig60', 
  account: {loss: -2, profit: 2, frequenceLimit: 0.1 },
  orderbook: {histLenBig: 60}
})


obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-lenBig24', 
  account: {loss: -2, profit: 2, frequenceLimit: 0.1 },
  orderbook: {lenBig: 24}
})


obManager.addNewStrategy({
  id: 'orderbook-rearch-loss3profit5', 
  account: {loss: -3, profit: 5, frequenceLimit: 0.1 },
})


const bitmex = new BitmexManager()
bitmex.listenOrderBook(function(data) {
  obManager.updateOrderbook(data)
})

bitmex.listenTrade(function(data) {
  var lastData = data.data.slice(-1)[0]

  // obManager.updateCandlesRealTime(lastData)
  // obManager.updateTradeHistoryData(data.data)
  obManager.doStrategy(lastData.price)
})

const webserver = new WebServer({ port: 7000 }, obManager)
