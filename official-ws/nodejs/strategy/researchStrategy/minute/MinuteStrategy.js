
const Strategy = require('../../Strategy')

class MinuteStrategy extends Strategy {
  constructor(options) {
    super(options)
    this.initStratety()
  }

  initStratety() {
    this.setStrategy((price, candles, orderbook, tradeHistoryManager) => {
      let long = false
      let short = false
      const _1mCandle = candles['1m']
      const _1hCandle = candles['1h']
      var m1macdSignal = _1mCandle.macdTrendSignal()
      if (m1macdSignal.long && _1hCandle.macdTrendSignal().long && orderbook.getSignal().long) {
        long = true
      } else if (m1macdSignal.short && _1hCandle.macdTrendSignal().short && orderbook.getSignal().short) {
        short = true
      }
      return {
        long,
        short,
      }
    })
  }
}

module.exports = MinuteStrategy
