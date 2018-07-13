const WebSocket = require('ws');
const bitmextSdk = require('./bitmexSdk')
const BitMEXClient = require('../index')
const notifyPhone = require('./notifyPhone').notifyPhone
const Account = require('./Account')

const RealtimeTradeDataManager = require('./RealtimeTradeDataManager')
const Candles = require('./Candles')

const candleManager = new Candles()
const tradeHistoryManager = new RealtimeTradeDataManager()
const accout = new Account(true)

const AMOUNT = 10000

const client = new BitMEXClient({testnet: false});
client.on('error', console.error);
client.on('close', () => console.log('Connection closed.'));
client.on('initialize', () => console.log('Client initialized, data is flowing.'));

client.on('open', () => {
    console.log('client open ^v^ EVERY THING IS OK~~~~~~~~~~~~~~~~~~ ')
    notifyPhone('client open ^v^ EVERY THING IS OK~~~~~~~~~~~~~~~~~~ ')
    bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize: '5m', count: 200 }).then((json) => {
      json = JSON.parse(json)
      candleManager.setHistoryData(json.reverse())

      client.addStream('XBTUSD', 'tradeBin5m', function(data, symbol, tableName) {
        // console.log(`Got update for ${tableName}:${symbol}. Current state:\n${JSON.stringify(data).slice(0, 100)}...`);
        // Do something with the table data...
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
});

client.addStream('XBTUSD', 'trade', function(data, symbol, tableName) {
  // console.log(`Got update for ${tableName}:${symbol}. Current state:\n${JSON.stringify(data).slice(0, 100)}...`);
  // Do something with the table data...
  // console.log(data, symbol)
  var lastData = data.data.slice(-1)[0]
  candleManager.updateRealTimeCandle(lastData)
  tradeHistoryManager.appendData(data.data)

  if (accout.isReadyToOrder()) {
    var mayTrendSignal = candleManager.getMayTrendSignal()
  
    if (mayTrendSignal.long) {
      // console.log('trade may long ========', new Date().toLocaleString(), lastData.price)

      var reverseSignal = candleManager.isReversed(mayTrendSignal)
      
      if (reverseSignal.long) {
        console.log('try trade long +++++++++', new Date().toLocaleString(), candleManager._latestCandle.getCandle())

        var tradeSignal = tradeHistoryManager.trendSignal()
        if (tradeSignal.long) {
          console.log('do long ', new Date().toLocaleString(), lastData.price)
          // notifyPhone('long at ' + lastData.price) // ok
          accout.orderMarket(lastData.price, true, AMOUNT)
        }
      }
    } else if (mayTrendSignal.short && candleManager.isReversed(mayTrendSignal).short) {
      console.log('try trade short ---------', new Date().toLocaleString(), lastData.price)

      var tradeSignal = tradeHistoryManager.trendSignal()
      if (tradeSignal.short) {
        console.log('do short ', new Date().toLocaleString(), lastData.price)
        notifyPhone('short at ' + lastData.price)
        accout.orderMarket(lastData.price, false, AMOUNT)
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
