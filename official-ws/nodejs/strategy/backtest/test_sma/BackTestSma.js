
const BackTest = require('../BackTest')

class BackTestSma extends BackTest {
  constructor(options) {
    super(options)
    this.initStrategy()
  }

  initStrategy() {
    this.setStrategy((bar, candles) => {
      const longPriceLen = this._options.longPriceLen || -1             // 5min: 6, 1min: 50  // disable: -1
      const longMaxPriceDiff = this._options.longMaxPriceDiff || 30     // 1min: 47
      const longMinPriceDiff = this._options.longMinPriceDiff || 0      // 1min: 20

      const shortPriceLen = this._options.longPriceLen || -1             // 1min: 50 // disable: -1
      const shortMaxPriceDiff = this._options.shortMaxPriceDiff || 60   // 1min: 47
      const shortMinPriceDiff = this._options.shortMinPriceDiff || 0   // 1min: 20


      let long = false
      let short = false
      const _5mCandle = candles['5m']
      let mainCandle = _5mCandle
      const smaCrossSignal = mainCandle.smaCrossSignalFast()
      // 设置中禁止做空
      const disableShort = this._options.disableShort
      if (
        smaCrossSignal.long &&
        (longPriceLen > 0 ? mainCandle.minMaxCloseFilter(longPriceLen, longMaxPriceDiff, longMinPriceDiff) : true)
      ) {
        long = true
      } else if (
        !disableShort &&
        smaCrossSignal.short &&
        (shortPriceLen > 0 ? mainCandle.minMaxCloseFilter(shortPriceLen, shortMaxPriceDiff, shortMinPriceDiff) : true)
      ) {
        short = true
      }
      let strategyPrice = null
      if (long || short) {
        strategyPrice = mainCandle.getLastHistoryClose()
      }
      return {
        long,
        short
      }
    })
  }
}

module.exports = BackTestSma