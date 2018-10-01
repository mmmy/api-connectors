
class Account {
  constructor() {
    this._options = {
      loss: -30,
      profit: 37,
    }
    this._hasPosition = false
    this._price = null
    this._long = true
  }

  order(bar, long) {
    const { timestamp, close, open } = bar
    if (!this._hasPosition) {
      this._lastTradeTime = new Date(timestamp)
      this._price = open
      this._hasPosition = true
      this._long = long
    }
  }

  liquidation(wined, price, bar) {
    const { timestamp } = bar
    this._hasPosition = false
    var timePassed = new Date(timestamp) - this._lastTradeTime
    var minute = timePassed / (60 * 1000)
    var minute = Math.round(minute * 10) / 10

    return {
      wined,
      minute,
      long: this._long,
      entryPrice: this._price,
      exitPrice: price,
      profit: wined ? this._options.profit : this._options.loss,
      startTime: this._lastTradeTime,
      endtTime: bar.timestamp,
    }
  }

  getProfitLimitPrices() {
    let profit = this._options.profit
    return this._price + (this._long ? profit : -profit)
  }

  getLossLimitPrices() {
    let loss = this._options.loss
    return this._price + (this._long ? loss : -loss)
  }

  shouldLiquidation(bar) {
    const { timestamp, high, low } = bar
    if (this._hasPosition) {
      const lossPrice = this.getLossLimitPrices()
      const profitPrice = this.getProfitLimitPrices()
      const long = this._long
      const lossed = long ? (low <= lossPrice) : (low >= lossPrice)
      const wined = long ? (high > profitPrice) : (high < profitPrice)
      if (lossed || wined) {
        return this.liquidation(wined, wined ? profitPrice : lossPrice, bar)
      }
    }
  }

  isReadyToOrder() {
    return !this._hasPosition
  }
}

module.exports = Account
