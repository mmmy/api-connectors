
// require('./logger')
// const WebSocket = require('ws');
const BitMEXClient = require('../../index')
// const notifyPhone = require('../notifyPhone').notifyPhone
const Account = require('./Account')
const OrderBook = require('../OrderBook')
const Candles = require('../Candles')
const bitmextSdk = require('../bitmexSdk')

const client = new BitMEXClient({testnet: false});
client.on('error', console.error);
client.on('close', () => console.log('Connection closed.'));
client.on('initialize', () => console.log('Client initialized, data is flowing.'));

function slow(func, wait) {
	var lastCall = 0
	return function() {
		var now = +new Date()
		if (now - lastCall > wait) {
			func.apply(null, arguments)
			lastCall = now
		}
	}
}
var logSlow = slow(function() { console.log.apply(null, arguments) }, 0.1 * 60 * 1000)

var orderbook = new OrderBook()
var account = new Account()
const candleManager = new Candles()
const hourCandleManager = new Candles()

client.addStream('XBTUSD', 'orderBookL2_25', function(data, symbol, tableName) {
  var compareData = orderbook.update(data)
  // webServer.updateData('book', {k: +new Date(), v: compareData})
  // orderbook.checData()  // test Ok
  // console.log(orderbook.getSumSizeTest()) // test OK

  // if (account.hasPosition()) {
  //   var long = account.isLong()
  //   if (long) {
  //     account.shouldLiquidation(orderbook.getTopBidPrice())
  //   } else {
  //     account.shouldLiquidation(orderbook.getTopAskPrice())
  //   }
  // }

  // console.log(bidPrice, askPrice)
})

client.on('open', () => {
  bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize: '1m', count: 200 }).then(json => {
    json = JSON.parse(json)
    candleManager.setHistoryData(json.reverse())

    client.addStream('XBTUSD', 'tradeBin1m', function(data, symbol, tableName) {
      candleManager.updateLastHistory(data.data[0])
      candleManager.checkData()
    })
  })

  bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize: '1h', count: 200 }).then(json => {
    json = JSON.parse(json)
    hourCandleManager.setHistoryData(json.reverse())

    client.addStream('XBTUSD', 'tradeBin1h', function(data, symbol, tableName) {
      hourCandleManager.updateLastHistory(data.data[0])
      hourCandleManager.checkData()
    })
  })
  
})

client.addStream('XBTUSD', 'trade', function(data, symbol, tableName) {
  var lastData = data.data.slice(-1)[0]
  candleManager.updateRealTimeCandle(lastData)
  hourCandleManager.updateRealTimeCandle(lastData)
  // tradeHistoryManager.appendData(data.data)
  if (account.isReadyToOrder() && candleManager.isReady() && hourCandleManager.isReady()) {
    var macdSignal = candleManager.macdTrendSignal(true)
    if (macdSignal.long && hourCandleManager.macdTrendSignal().long && orderbook.getSignal().long) {
      var bidPrice = orderbook.getTopBidPrice()
      // logSlow(new Date().toLocaleString() + ' LONG ' + bidPrice)
      account.orderLimit(bidPrice, true, 10000)
    } else if (macdSignal.short && hourCandleManager.macdTrendSignal().short && orderbook.getSignal().short) {
      var askPrice = orderbook.getTopAskPrice()
      // logSlow(new Date().toLocaleString() + ' SHORT ' + askPrice)
      account.orderLimit(askPrice, false, 10000)
    }
  }

  account.shouldLiquidation(lastData.price)
})