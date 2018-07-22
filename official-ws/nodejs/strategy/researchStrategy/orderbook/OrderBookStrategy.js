var common = require('../../common')

const Strategy = require('../../Strategy')

class OrderBookStrategy extends Strategy {
  constructor(options) {
    options = {
      account: {loss: -2, profit: 2, frequenceLimit: 0.1 },
      ...options
    }
    super(options)
    this.initStrategy()
  }

  initStrategy() {
    this.setStrategy((price, candles, orderbook, tradeHistoryManager) => {
      let long = false
      let short = false
      var orderbookSignal = orderbook.getSignal()
      if (orderbookSignal.long) {
        console.log(`${this._options.id} Ob do long ++`)
        long = true
      } else if (orderbookSignal.short) {
        console.log(`${this._options.id} Ob do long --`)
        short = true
      }

      return {
        long,
        short
      }
    })

  }
  doStrategy(price) {
    var result = super.doStrategy(price)
    if (result) {
      var lastTrade = this.getLastTrade()
      var wf = lastTrade.winsFails
      if (lastTrade.win) {
        common.consoleGreen(`${this._options.id} ${wf[0]}/${wf[1]}`, lastTrade)
      } else {
        common.consoleRed(`${this._options.id} ${wf[0]}/${wf[1]}`, lastTrade)
      }
    }
  }
}

module.exports = OrderBookStrategy