
class Account {
  constructor(options) {
    this._options = {
      loss: 0,
      profit: 0,
      orderPrecie: 0.5,       // 挂单精确度btc 0.5, eth 0.02
      ...options,
    }
    this._hasPosition = false
    this._price = null
    this._long = true
    this._minMaxPrices = {minP:null, maxP:null}
    this._bars = -1
    this._entryBars = -1
  }

  order(bar, long) {
    const { timestamp, close, open, high, low } = bar
    if (!this._hasPosition) {
      const priceOffset = this._options.priceOffset || 0
      this._lastTradeTime = new Date(timestamp)
      this._price = open + (long ? -priceOffset : priceOffset)
      this._hasPosition = true
      this._long = long
      this._minMaxPrices.minP = low
      this._minMaxPrices.maxP = high
      this._bars = 1
      this._entryBars = -1
      this.updateEntryBars()
    }
  }
  updateMinMax(bar) {
    this._bars ++
    this._minMaxPrices.minP = Math.min(this._minMaxPrices.minP, bar.low)
    this._minMaxPrices.maxP = Math.max(this._minMaxPrices.maxP, bar.high)
    this.updateEntryBars()
  }

  updateEntryBars() {
    const {minP, maxP} = this._minMaxPrices
    const touched = this._long ? this._price >= minP : this._price <= maxP
    if (this._entryBars === -1 && touched) {
      this._entryBars = this._bars
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
    const touched = this._entryBars > -1

    return {
      touched,
      wined,
      minute,
      profit,
      entryBars: this._entryBars,
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
      this.updateMinMax(bar)
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
