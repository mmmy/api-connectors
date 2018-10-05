
const Strategy = require('../../Strategy')

class SmaCrossStrategy extends Strategy {
  constructor(options) {
    super(options)
    this.initStratety()
  }

  initStratety() {
    this.setStrategy((price, candles, orderbook, tradeHistoryManager) => {
      const longPriceLen = this._options.longPriceLen || -1             // 5min: 6, 1min: 50  // disable: -1
      const longMaxPriceDiff = this._options.longMaxPriceDiff || 30     // 1min: 47
      const longMinPriceDiff = this._options.longMinPriceDiff || 0      // 1min: 20
      
      const shortPriceLen = this._options.longPriceLen || -1             // 1min: 50 // disable: -1
      const shortMaxPriceDiff = this._options.shortMaxPriceDiff || 60   // 1min: 47
      const shortMinPriceDiff = this._options.shortMinPriceDiff || 0   // 1min: 20
      let long = false
      let short = false
      const _1mCandle = candles['1m']
      const _5mCandle = candles['5m']
      const _1hCandle = candles['1h']
      const _4hCandle = candles['4h']
      const _1dCandle = candles['1d']

      let mainCandle = _5mCandle
      const use1m = this._options.use1m
      if (use1m) {
        mainCandle = _1mCandle
      }
      // 设置中禁止做空
      const disableShort = this._options.disableShort
      const smaCrossSignal = mainCandle.smaCrossSignal()
      if (
        smaCrossSignal.long &&
        // _1dCandle.priceIsAboveSma() &&
        (longPriceLen > 0 ? mainCandle.minMaxCloseFilter(longPriceLen, longMaxPriceDiff, longMinPriceDiff) : true)
      ) {
        console.log(`${this._options.id} ${new Date()} SMA cross do long ++`)
        long = true
      } else if (
        !disableShort &&
        smaCrossSignal.short &&
        // !_1dCandle.priceIsAboveSma() &&
        (shortPriceLen > 0 ? mainCandle.minMaxCloseFilter(shortPriceLen, shortMaxPriceDiff, shortMinPriceDiff) : true)
      ) {
        console.log(`${this._options.id}  ${new Date()} SMA cross do short --`)
        short = true
      }
      
      //有的时候需要在当前的orderbook 上偏移一段价格来挂单, 这样对我们有利
      const priceOffset = this._options.priceOffset || 0
      let strategyPrice = null
      if (long || short) {
        strategyPrice = mainCandle.getLastHistoryClose() + (long ? -priceOffset : priceOffset)
      }

      return {
        long,
        short,
        // priceOffset,
        strategyPrice,
      }
    })
  }
}

module.exports = SmaCrossStrategy
