
const Candles = require('../../strategy/Candles')
const { BitmexKlineDB } = require('../db')

var candle = new Candles()

BitmexKlineDB.getKlines('1m', '2018-12-22 21:47:00', 200).then(rows => {
  const kline = rows.reverse().map(r => ({
    timestamp: r.time.toISOString(),
    open: r.close,
    close: r.close,
    high: r.high,
    low: r.low,
    volume: r.volume,
  }))
  // console.log(kline)
  for (let i=0; i< 50; i++) {
    const klineMove = kline.slice(0, kline.length - i)
    candle.setHistoryData(klineMove)
    const signal = candle.StochRsiSignal()
    console.log(klineMove.slice(-1)[0].timestamp)
    console.log(signal)
  }
})
