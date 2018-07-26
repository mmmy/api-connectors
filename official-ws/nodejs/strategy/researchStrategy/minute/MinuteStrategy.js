
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
      /* 这个策略不可取 胜率只有40%
      var m1macdSignal = _1mCandle.macdTrendSignal()
      if (m1macdSignal.long && _1hCandle.macdTrendSignal().long && orderbook.getSignal().long) {
        long = true
      } else if (m1macdSignal.short && _1hCandle.macdTrendSignal().short && orderbook.getSignal().short) {
        short = true
      }
      */
     var m1macdSignal = _1mCandle.macdTrendSignal()
     if (m1macdSignal.long && _1hCandle.macdTrendSignal().long && orderbook.getSignal().long) {
       short = true
     } else if (m1macdSignal.short && _1hCandle.macdTrendSignal().short && orderbook.getSignal().short) {
       long = true
     }
     
     /*比上面的 有 1m的策略胜率有所提升
      var h1macdSignal = _1hCandle.macdTrendSignal()
      if (h1macdSignal.long && orderbook.getSignal().long) {
        long = true
      } else if (h1macdSignal.short && orderbook.getSignal().short) {
        short = true
      }
      */
      return {
        long,
        short,
      }
    })
  }
}

module.exports = MinuteStrategy
