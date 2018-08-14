
const Strategy = require('../../Strategy')

class RsiBBStrategy extends Strategy {
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
      const use1m = this._options.use1m
      if (use1m) {
        mainCandle = _1mCandle
      }
      // 设置中禁止做空
      const disableShort = this._options.disableShort
      const RsiBBSignal = mainCandle.rsiBbReverseSignal() // 最好是缓存的, 要重构
      if (RsiBBSignal.long && _1hCandle.macdTrendSignal().long && (use1m ? _1mCandle.minMaxCloseFilter(25, 1000, 30) : true)) {
        console.log(`${this._options.id} ${new Date()} RSI BB do long ++`)
        long = true
      } else if (!disableShort && RsiBBSignal.short && _1hCandle.macdTrendSignal().short && (use1m ? _1mCandle.minMaxCloseFilter(25, 1000, 30) : true)) {
        console.log(`${this._options.id}  ${new Date()} RSI BB do short --`)
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

module.exports = RsiBBStrategy
