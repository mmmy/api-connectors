
const Strategy = require('../../Strategy')

class Minute5Strategy extends Strategy {
  constructor(options) {
    super(options)
    this.initStratety()
  }

  initStratety() {
    this.setStrategy((price, candles, orderbook, tradeHistoryManager) => {
      const longPriceLen = this._options.longPriceLen || -1             // 5min: 15, 1min: 50  // disable: -1
      const longMaxPriceDiff = this._options.longMaxPriceDiff || 60     // 1min: 47
      const longMinPriceDiff = this._options.longMinPriceDiff || 0      // 1min: 20
      
      const shortPriceLen = this._options.longPriceLen || -1             // 1min: 50 // disable: -1
      const shortMaxPriceDiff = this._options.shortMaxPriceDiff || 60   // 1min: 47
      const shortMinPriceDiff = this._options.shortMinPriceDiff || 0   // 1min: 20
      let long = false
      let short = false
      let strategyPrice
      const _1mCandle = candles['1m']
      const _5mCandle = candles['5m']
      const _1hCandle = candles['1h']
      const _4hCandle = candles['4h']

      let mainCandle = _5mCandle
      const use1m = this._options.use1m
      if (use1m) {
        mainCandle = _1mCandle
      }
      // 设置中禁止做空
      const disableShort = this._options.disableShort
      const sarSmaSignal = mainCandle.sarSmaSignal()
      if (sarSmaSignal.long && (longPriceLen > 0 ? mainCandle.minMaxCloseFilter(longPriceLen, longMaxPriceDiff, longMinPriceDiff) : true)) {
        console.log(`${this._options.id} ${new Date()} SAR MA do long ++`)
        long = true
      } else if (
        !disableShort &&
        sarSmaSignal.short &&
        (use1m ? _1hCandle.macdTrendSignal(false).short :  _4hCandle.macdTrendSignal(false).short) &&
        (shortPriceLen ? mainCandle.minMaxCloseFilter(shortPriceLen, shortMaxPriceDiff, shortMinPriceDiff) : true)
      ) {
        console.log(`${this._options.id}  ${new Date()} SAR MA do short --`)
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

module.exports = Minute5Strategy
