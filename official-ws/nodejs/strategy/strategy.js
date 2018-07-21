
require('./logger')
const argv = require('./argv')
const WebSocket = require('ws');
const bitmextSdk = require('./bitmexSdk')
const BitMEXClient = require('../index')
const notifyPhone = require('./notifyPhone').notifyPhone
const Account = require('./Account')
const OrderBook = require('./OrderBook')

const RealtimeTradeDataManager = require('./RealtimeTradeDataManager')
const Candles = require('./Candles')
const SockServer = require('./mysocks/SockServer')

// const webServer = new SockServer()
// webServer.startServer()

const candleManager = new Candles()
const hourCandleManager = new Candles()
const tradeHistoryManager = new RealtimeTradeDataManager()
const accout = new Account(true)
var orderbook = new OrderBook()

const AMOUNT = 3000

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

const client = new BitMEXClient({testnet: false, ...argv});
client.on('error', console.error);
client.on('close', () => console.log('Connection closed.'));
client.on('initialize', () => console.log('Client initialized, data is flowing.'));

var logLong = slow(function() { console.log('orderLimitSignal long ' + new Date().toLocaleString()) }, 5000)
var logShort = slow(function() { console.log('orderLimitSignal short ' + new Date().toLocaleString()) }, 5000)

var notify5min = slow(function(msg) { notifyPhone(msg) }, 5 * 60 * 1000)
var log2min = slow(function() { console.log.call(null, arguments) }, 2 * 60 * 1000)

client.addStream('XBTUSD', 'orderBookL2_25', function(data, symbol, tableName) {
  var compareData = orderbook.update(data)
  // webServer.updateData('book', {k: +new Date(), v: compareData})
  // orderbook.checData()  // test Ok
  // console.log(orderbook.getSumSizeTest()) // test OK
  // var orderLimitSignal = orderbook.getSignal()
  // if (orderLimitSignal.long) {
  //   logLong()
  // } else if (orderLimitSignal.short) {
  //   logShort()
  // }

  // var bidPrice = orderbook.getTopBidPrice()
  // var askPrice = orderbook.getTopAskPrice()
  // console.log(bidPrice, askPrice)
})

client.on('open', () => {
    console.log('client open ^v^ EVERY THING IS OK~~~~~~~~~~~~~~~~~~ ')
    notifyPhone('client open ^v^ EVERY THING IS OK~~~~~~~~~~~~~~~~~~ ')
    bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize: '5m', count: 200 }).then((json) => {
      json = JSON.parse(json)
      candleManager.setHistoryData(json.reverse())

      client.addStream('XBTUSD', 'tradeBin5m', function(data, symbol, tableName) {
        // console.log(data, symbol)
        // console.log('local time: ', new Date().toLocaleString())
        // console.log('data time: ', new Date(data.data[0].timestamp).toLocaleString())

        candleManager.updateLastHistory(data.data[0])
        candleManager.checkData()
        var mayTrendSignal = candleManager.getMayTrendSignal()
        if (mayTrendSignal.long) {
          // console.log('mayTrendSignal long', new Date().toLocaleString())
          // console.log('data time: ', new Date(data.data[0].timestamp).toLocaleString())
        } else if (mayTrendSignal.short) {
          // console.log('mayTrendSignal short', new Date().toLocaleString())
          // console.log('data time: ', new Date(data.data[0].timestamp).toLocaleString())
        }
        // console.log('candleManager._histories.length ', candleManager._histories.length)
        // console.log('\n')
      });
    })
    // 小时线
    bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize: '1h', count: 200 }).then((json) => {
      json = JSON.parse(json)
      hourCandleManager.setHistoryData(json.reverse())
      client.addStream('XBTUSD', 'tradeBin1h', function(data, symbol, tableName) {
        hourCandleManager.updateLastHistory(data.data[0])
        hourCandleManager.checkData()
      })
    })
});

client.addStream('XBTUSD', 'trade', function(data, symbol, tableName) {
  var lastData = data.data.slice(-1)[0]
  candleManager.updateRealTimeCandle(lastData)
  hourCandleManager.updateRealTimeCandle(lastData)

  tradeHistoryManager.appendData(data.data)
  // 注意应该和大的趋势一样, 比如小时线, 应该反向大的趋势很难
  // 比如, 在小时线是上涨的时候, 不要做空
  if (accout.isReadyToOrder()) {
    var mayTrendSignal = candleManager.getMayTrendSignal()
    // 小时线的macd是long
    if (mayTrendSignal.long && hourCandleManager.macdTrendSignal().long) {
      // console.log('trade may long ========', new Date().toLocaleString(), lastData.price)

      var reverseSignal = candleManager.isReversed(mayTrendSignal)
      
      if (reverseSignal.long) {
        // console.log('try trade long +++++++++', new Date().toLocaleString(), candleManager._latestCandle.getCandle())
        /*
        var tradeSignal = tradeHistoryManager.trendSignal()
        if (tradeSignal.long) {
          console.log('do long ', new Date().toLocaleString(), lastData.price)
          // notifyPhone('long at ' + lastData.price) // ok
          accout.orderLimit(lastData.price, true, AMOUNT)
        }
        */
        var stableSignal = tradeHistoryManager.stableSignal()
        var orderbookSignal = orderbook.getSignal()
        // bid price
        var price = orderbook.getTopBidPrice()
        log2min('try long ++++', new Date().toLocaleString(), lastData.price, price)
        if (stableSignal && orderbookSignal.long) {
          notify5min('多limit long at' + price)
          accout.orderLimit(price, true, AMOUNT)
        }
      }
    } else if (mayTrendSignal.short && hourCandleManager.macdTrendSignal().short && candleManager.isReversed(mayTrendSignal).short) {
      /*
      var tradeSignal = tradeHistoryManager.trendSignal()
      if (tradeSignal.short) {
        console.log('do short ', new Date().toLocaleString(), lastData.price)
        // notifyPhone('short at ' + lastData.price) //ok
        accout.orderLimit(lastData.price, false, AMOUNT)
      }
      */
      var stableSignal = tradeHistoryManager.stableSignal()
      var orderbookSignal = orderbook.getSignal()
      var price = orderbook.getTopAskPrice()
      log2min('try short -----', new Date().toLocaleString(), lastData.price, price)

      if (stableSignal && orderbookSignal.short) {
        notify5min('空limit short at' + price)
        accout.orderLimit(price, false, AMOUNT)
      }
    }
  }

  accout.shouldLiquidation(lastData.price)

  return
  var tradeSignal = tradeHistoryManager.trendSignal()
  if (tradeSignal.long) {
    console.log('tradeSignal long', new Date().toLocaleString())
  } else if (tradeSignal.short) {
    console.log('tradeSignal short', new Date().toLocaleString())
  }
});


// client.addStream('XBTUSD', 'quote', function(data, symbol, tableName) {
//   // console.log(`Got update for ${tableName}:${symbol}. Current state:\n${JSON.stringify(data).slice(0, 100)}...`);
//   // Do something with the table data...
//   console.log(data, symbol)
// });
