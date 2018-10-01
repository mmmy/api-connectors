
const BackTest = require('../BackTest')

class BackTestSma extends BackTest {
  constructor(options) {
    super(options)
    this.initStrategy()
  }

  initStrategy() {
    this.setStrategy((bar, candles) => {
      let long = false
      let short = false
      const _5mCandle = candles['5m']
      let mainCandle = _5mCandle
      const smaCrossSignal = mainCandle.smaCrossSignal()
      if (smaCrossSignal.long) {
        long = true
      } else if (smaCrossSignal.short) {
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