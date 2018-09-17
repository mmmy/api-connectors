
var bitmextSdk = require('../bitmexSdk')
var Candles = require('../Candles')

var candleManager = new Candles()

//ok width tradingview
bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize: '5m', count: 200 }).then((json) => {
  json = JSON.parse(json)
  console.log(json[0])
  candleManager.setHistoryData(json.reverse())
  candleManager.checkData()
  // candleManager.macdTrendSignal()
  candleManager.smaCrossSignal()
  candleManager.priceIsAboveSma()
}).catch(e => console.error(111111, e))