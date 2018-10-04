
class Account {
  constructor(options) {
    this._options = {
      loss: 0,
      profit: 0,
      ...options,
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
  // 暂时无用
  exit(profit, loss, bar) {
    if (this._hasPosition) {
      const long = this._long
      const profitPrice = this._price + (long ? profit : -profit)
      const lossPrice = this._price + (long ? loss : -loss)
      const lossed = long ? (low <= lossPrice) : (low >= lossPrice)
      const wined = long ? (high > profitPrice) : (high < profitPrice)
      if (lossed || wined) {
        return this.liquidation(wined ? profitPrice : lossPrice, bar)
      }
    }
  }

  close(bar) {
    this.liquidation(bar.close, bar)
  }

  liquidation(price, bar) {
    const { timestamp } = bar
    this._hasPosition = false
    var timePassed = new Date(timestamp) - this._lastTradeTime
    var minute = timePassed / (60 * 1000)
    var minute = Math.round(minute * 10) / 10
    const profit = this._long ? (price - this._price) : (this._price - price)
    const wined = profit > 0

    return {
      wined,
      minute,
      profit,
      long: this._long,
      entryPrice: this._price,
      exitPrice: price,
      startTime: this._lastTradeTime,
      endtTime: bar.timestamp,
    }
  }

  getProfitLimitPrices() {
    let profit = this._options.profit
    return profit ? this._price + (this._long ? profit : -profit) : -1
  }

  getLossLimitPrices() {
    let loss = this._options.loss
    return loss ? this._price + (this._long ? loss : -loss) : -1
  }

  shouldLiquidation(bar) {
    const { timestamp, high, low } = bar
    if (this._hasPosition) {
      const lossPrice = this.getLossLimitPrices()
      const profitPrice = this.getProfitLimitPrices()
      const long = this._long
      let lossed = false
      if (lossPrice > 0) {
        lossed = long ? (low <= lossPrice) : (low >= lossPrice)
      }
      let wined = false
      if (profitPrice > 0) {
        wined = long ? (high > profitPrice) : (high < profitPrice)
      }
      if (lossed || wined) {
        return this.liquidation(wined ? profitPrice : lossPrice, bar)
      }
    }
  }

  isReadyToOrder() {
    return !this._hasPosition
  }
}

module.exports = Account
