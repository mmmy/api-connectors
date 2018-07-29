
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
      const _1mCandle = candles['5m']
      const _1hCandle = candles['1h']
      const _4hCandle = candles['4h']
      
      
      return {
        long,
        short,
      }
    })
  }
}

module.exports = Minute5Strategy
