
const BitmexManager = require('./BitmexManager')
const OrderBookStrategyManager = require('./orderbook/Manager')

const obManager = new OrderBookStrategyManager()
obManager.addNewStrategy({ id: 'orderbook-rearch-1' })
obManager.addNewStrategy({ id: 'orderbook-rearch-2' })

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
