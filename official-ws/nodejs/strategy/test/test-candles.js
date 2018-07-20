
var bitmextSdk = require('../bitmexSdk')
var Candles = require('../Candles')

var candleManager = new Candles()

//ok width tradingview
bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize: '1h', count: 200 }).then((json) => {
  json = JSON.parse(json)
  console.log(json[0])
  candleManager.setHistoryData(json.reverse())
  candleManager.checkData()
  candleManager.macdSignal()
}).catch(e => console.error(e))