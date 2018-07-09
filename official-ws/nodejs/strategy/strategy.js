const WebSocket = require('ws');
const bitmextSdk = require('./bitmexSdk')
const BitMEXClient = require('../index')
const notifyPhone = require('./notifyPhone').notifyPhone

const RealtimeTradeDataManager = require('./RealtimeTradeDataManager')
const Candles = require('./Candles')

const candleManager = new Candles()
const tradeHistoryManager = new RealtimeTradeDataManager()


const client = new BitMEXClient({testnet: false});
client.on('error', console.error);
client.on('close', () => console.log('Connection closed.'));
client.on('initialize', () => console.log('Client initialized, data is flowing.'));

client.on('open', () => {
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
          console.log('mayTrendSignal long', new Date().toLocaleString())
          console.log('data time: ', new Date(data.data[0].timestamp).toLocaleString())
        } else if (mayTrendSignal.short) {
          console.log('mayTrendSignal short', new Date().toLocaleString())
          console.log('data time: ', new Date(data.data[0].timestamp).toLocaleString())
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

  // TODO: 处理getMayTrendSignal后再处理 tradeSignal
  var mayTrendSignal = candleManager.getMayTrendSignal()
  if (mayTrendSignal.long) {
    var reverseSignal = candleManager.isReversed()
    if (reverseSignal.long) {
      var tradeSignal = tradeHistoryManager.trendSignal()
      if (tradeSignal.log) {
        notifyPhone('long at ', lastData.price)
      }
    }
  } else if (mayTrendSignal.short && candleManager.isReversed().short) {
    var tradeSignal = tradeHistoryManager.trendSignal()
    if (tradeSignal.short) {
      notifyPhone('short at ', lastData.price)
    }
  }

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
