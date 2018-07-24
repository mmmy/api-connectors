
const WebServer = require('./WebServer')
const BitmexManager = require('./BitmexManager')
const OrderBookStrategyManager = require('./orderbook/Manager')

const obManager = new OrderBookStrategyManager()

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-lossprofit20', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-lossprofit18', 
  account: {loss: -18, profit: 18, frequenceLimit: 0.1 },
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-lossprofit15', 
  account: {loss: -15, profit: 15, frequenceLimit: 0.1 },
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-lossprofit23', 
  account: {loss: -23, profit: 23, frequenceLimit: 0.1 },
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-rateBig2', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
  orderbook: {rateBig: 2}
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-rateBig2histLenBig40', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
  orderbook: {rateBig: 2, histLenBig: 40}
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-rateBig3', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
  orderbook: {rateBig: 3}
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-rateBig3lenBig24', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
  orderbook: {rateBig: 3, lenBig: 24}
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-histLenBig40', 
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
  orderbook: {histLenBig: 40}
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-r2hl30lb24',
  account: {loss: -20, profit: 20, frequenceLimit: 0.1 },
  orderbook: {rateBig: 2, histLenBig: 30, lenBig: 24}
})

obManager.addNewStrategy({
  id: 'orderbook-rearch-1-orderbook-loss15profit20rateBig2lenBig24', 
  account: {loss: -15, profit: 20, frequenceLimit: 0.1 },
  orderbook: {rateBig: 2, histLenBig: 30, lenBig: 24}
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
