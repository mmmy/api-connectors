
const BackTest = require('../BackTest')

class BackTestRsiDivergence extends BackTest {
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
      const shortMaxPriceDiff = this._options.shortMaxPriceDiff || 30   // 1min: 47
      const shortMinPriceDiff = this._options.shortMinPriceDiff || 0   // 1min: 20

      const longRateLen = this._options.longRateLen || -1
      const longPriceRateMin = this._options.longPriceRateMin || 0.6
      const longPriceRateMax = this._options.longPriceRateMax || 2

      const shortRateLen = this._options.shortRateLen || -1
      const shortPriceRateMin = this._options.shortPriceRateMin || 0.1
      const shortPriceRateMax = this._options.shortPriceRateMax || 0.3

      let long = false
      let short = false
      const _5mCandle = candles['5m']
      let mainCandle = _5mCandle
      const smaCrossSignal = mainCandle.smaCrossSignalFast()
      // 设置中禁止做空
      const disableShort = this._options.disableShort
      const disableLong = this._options.disableLong
      if (
        !disableLong &&
        smaCrossSignal.long &&
        // (Math.abs(bar.close - smaCrossSignal.fastMa) < 20) &&
        (longPriceLen > 0 ? mainCandle.minMaxCloseFilter(longPriceLen, longMaxPriceDiff, longMinPriceDiff) : true) &&
        (longRateLen > 0 ? mainCandle.priceRateFilter(longRateLen, longPriceRateMin, longPriceRateMax) : true)
      ) {
        long = true
      } else if (
        !disableShort &&
        smaCrossSignal.short &&
        (shortPriceLen > 0 ? mainCandle.minMaxCloseFilter(shortPriceLen, shortMaxPriceDiff, shortMinPriceDiff) : true) &&
        (shortRateLen > 0 ? mainCandle.priceRateFilter(shortRateLen, shortPriceRateMin, shortPriceRateMax) : true)
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

module.exports = BackTestRsiDivergence