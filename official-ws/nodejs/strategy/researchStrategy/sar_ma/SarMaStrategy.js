
const Strategy = require('../../Strategy')

class Minute5Strategy extends Strategy {
  constructor(options) {
    super(options)
    this.initStratety()
  }

  initStratety() {
    this.setStrategy((price, candles, orderbook, tradeHistoryManager) => {
      let long = false
      let short = false
      const _1mCandle = candles['1m']
      const _5mCandle = candles['5m']
      const _1hCandle = candles['1h']
      const _4hCandle = candles['4h']

      let mainCandle = _5mCandle
      if (this._options.use1m) {
        mainCandle = _1mCandle
      }
      // 设置中禁止做空
      const disableShort = this._options.disableShort
      const sarSmaSignal = mainCandle.sarSmaSignal()
      if (sarSmaSignal.long) {
        console.log(`${this._options.id} ${new Date()} SAR MA do long ++`)
        long = true
      } else if (!disableShort && sarSmaSignal.short && _4hCandle.macdTrendSignal().short) {
        console.log(`${this._options.id}  ${new Date()} SAR MA do short --`)
        short = true
      }
      
      return {
        long,
        short,
        priceOffset: this._options.priceOffset || 0,
      }
    })
  }
}

module.exports = Minute5Strategy
