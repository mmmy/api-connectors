
require('./logger')
const argv = require('./argv')
const WebSocket = require('ws');
const bitmextSdk = require('./bitmexSdk')
const BitMEXClient = require('../index')
const notifyPhone = require('./notifyPhone').notifyPhone
const Strategy = require('./Strategy')

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

var logLong = slow(function() { console.log('orderLimitSignal long ' + new Date().toLocaleString()) }, 5000)
var logShort = slow(function() { console.log('orderLimitSignal short ' + new Date().toLocaleString()) }, 5000)

var notify5min = slow(function(msg) { notifyPhone(msg) }, 5 * 60 * 1000)
var log2min = slow(function() { console.log.call(null, arguments) }, 2 * 60 * 1000)

const strategy = new Strategy({
  id: 's-5m-1h-orderbook-realtime-0'
})

strategy.setStrategy((price, candles, orderbook, tradeHistoryManager) => {
  let long = false
  let short = false
  const _5mCandle = candles['5m']
  const _1hCandle = candles['1h']

  const mayTrendSignal = _5mCandle.getMayTrendSignal()
  if (mayTrendSignal.long && _1hCandle.macdTrendSignal().long && _5mCandle.isReversed(mayTrendSignal).long) {
    var stableSignal = tradeHistoryManager.stableSignal()
    var orderbookSignal = orderbook.getSignal()
    var bidPrice = orderbook.getTopBidPrice()
    log2min('try long ++++', new Date().toLocaleString(), bidPrice, price)
    if (stableSignal && orderbookSignal.long) {
      notify5min('多limit long at' + bidPrice)
      long = true
    }
  } else if (mayTrendSignal.short && _1hCandle.macdTrendSignal().short && _5mCandle.isReversed(mayTrendSignal).short) {
    var stableSignal = tradeHistoryManager.stableSignal()
    var orderbookSignal = orderbook.getSignal()
    var askPrice = orderbook.getTopAskPrice()
    log2min('try short -----', new Date().toLocaleString(), askPrice, price)
    
    if (stableSignal && orderbookSignal.short) {
      notify5min('空limit short at' + askPrice)
      short = true
    }
  }

  return {
    long,
    short
  }
})

const Account = require('./Account')
const OrderBook = require('./OrderBook')

const RealtimeTradeDataManager = require('./RealtimeTradeDataManager')
const Candles = require('./Candles')
// const SockServer = require('./mysocks/SockServer')

// const webServer = new SockServer()
// webServer.startServer()

// const candleManager = new Candles()
// const hourCandleManager = new Candles()
// const tradeHistoryManager = new RealtimeTradeDataManager()
// const accout = new Account(true)
// var orderbook = new OrderBook()

const client = new BitMEXClient({testnet: false});
client.on('error', console.error);
client.on('close', () => console.log('Connection closed.'));
client.on('initialize', () => console.log('Client initialized, data is flowing.'));

client.addStream('XBTUSD', 'orderBookL2_25', function(data, symbol, tableName) {
  strategy.updateOrderbook(data)
  // var compareData = orderbook.update(data)
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
      strategy.setCandleHistory('5m', json.reverse())
      // candleManager.setHistoryData(json.reverse())

      client.addStream('XBTUSD', 'tradeBin5m', function(data, symbol, tableName) {
        // console.log(data, symbol)
        // console.log('local time: ', new Date().toLocaleString())
        // console.log('data time: ', new Date(data.data[0].timestamp).toLocaleString())
        strategy.updateCandleLastHistory('5m', data.data[0])
        // candleManager.updateLastHistory(data.data[0])
        // candleManager.checkData()
      });
    })
    // 小时线
    bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize: '1h', count: 200 }).then((json) => {
      json = JSON.parse(json)
      // hourCandleManager.setHistoryData(json.reverse())
      strategy.setCandleHistory('1h', json.reverse())
      client.addStream('XBTUSD', 'tradeBin1h', function(data, symbol, tableName) {
        strategy.updateCandleLastHistory('1h', data.data[0])
        // hourCandleManager.updateLastHistory(data.data[0])
        // hourCandleManager.checkData()
      })
    })
});

client.addStream('XBTUSD', 'trade', function(data, symbol, tableName) {
  var lastData = data.data.slice(-1)[0]
  // will update 1m, 5m, 1h ...
  strategy.updateCandlesRealTime(lastData)
  // candleManager.updateRealTimeCandle(lastData)
  // hourCandleManager.updateRealTimeCandle(lastData)
  strategy.updateTradeHistoryData(data.data)
  // tradeHistoryManager.appendData(data.data)
  // 注意应该和大的趋势一样, 比如小时线, 应该反向大的趋势很难
  // 比如, 在小时线是上涨的时候, 不要做空
  strategy.doStrategy(lastData.price)

});


// client.addStream('XBTUSD', 'quote', function(data, symbol, tableName) {
//   // console.log(`Got update for ${tableName}:${symbol}. Current state:\n${JSON.stringify(data).slice(0, 100)}...`);
//   // Do something with the table data...
//   console.log(data, symbol)
// });
