
const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const OrderBookStrategyManager = require('./orderbook/Manager')

const obManager = new OrderBookStrategyManager()

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-lossprofit20', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
})


obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-rateBig2histLenBig60', 
  account: {loss: -10, profit: 10, frequenceLimit: 0.1 },
  orderbook: {rateBig: 2, histLenBig: 60}
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-rateBig2histLenBig60lenBig24', 
  account: {loss: -10, profit: 10, frequenceLimit: 0.1 },
  orderbook: {rateBig: 2, histLenBig: 60, lenBig: 24}
})


obManager.addNewStrategy({
  id: 'orderbook-rearch-loss7profit10', 
  account: {loss: -7, profit: 10, frequenceLimit: 0.1 },
  orderbook: {rateBig: 2, histLenBig: 60, lenBig: 24}
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
