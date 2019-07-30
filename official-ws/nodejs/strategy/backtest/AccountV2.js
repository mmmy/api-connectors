
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
    this._minMaxPrices = { minP: null, maxP: null }
    this._bars = -1
    this._entryBars = -1

    this._amount = 0
    this._avgPrice = 0
    this._stopPrice = 0
    this._profitPrice = 0
    this._openTime = 0
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

  setStopPriceByPoint() {
    if (this.hasPosition()) {
      const longPosition = this._amount > 0
      this._stopPrice = longPosition ? this._avgPrice - 200 : this._avgPrice + 200
    }
  }

  setStopPrice(price) {
    this._stopPrice = price
    if (this._amount > 0 && this._stopPrice > this._avgPrice) {
      throw Error('long position stopPrice > avgPrice ?')
    }
  }

  setProfitPrice(price) {
    this._profitPrice = price
    if (this._amount > 0 && this._profitPrice < this._avgPrice) {
      throw Error('long position _profitPrice < _avgPrice ?')
    }
  }

  orderMarket(price, bar, amount, stopped) {
    const { timestamp, close, open, high, low } = bar
    this._lastTradeTime = new Date(timestamp)
    if (this._amount === 0) {
      this._avgPrice = price
      this._amount = amount
      this._minMaxPrices.minP = low
      this._minMaxPrices.maxP = high
      this._openTime = timestamp
      this._bars = 1
      // this.setStopPrice()
      return
    } else {
      const preAmount = this._amount
      const nextAmount = this._amount + amount
      // add postion
      if (this._amount * amount > 0) {
        this._avgPrice = (this._avgPrice * this._amount + price * amount) / nextAmount
        this._amount = nextAmount
        // reduce postion
      } else {
        const closeAmount = Math.min(Math.abs(this._amount), Math.abs(amount))
        let profit = 0
        // close short
        if (amount > 0) {
          profit = closeAmount * (this._avgPrice - price)
          // close short
        } else {
          profit = closeAmount * (price - this._avgPrice)
        }
        if (Math.abs(this._amount) <= Math.abs(amount)) {
          this._avgPrice = price
        }
        const wined = profit > 0
        this._amount = nextAmount
        console.log(this._openTime, timestamp, profit, amount)
        return {
          touched: true,
          wined,
          profit,
          stopped,
          openTime: this._openTime,
          timestamp,
          amount,
          preAmount,
          postionAmount: this._amount,
          price,
          entryBars: this._bars,
        }
      }
    }
  }

  updateMinMax(bar) {
    this._bars++
    this._minMaxPrices.minP = Math.min(this._minMaxPrices.minP, bar.low)
    this._minMaxPrices.maxP = Math.max(this._minMaxPrices.maxP, bar.high)
    // this.updateEntryBars()
  }

  updateEntryBars() {
    const { minP, maxP } = this._minMaxPrices
    const touched = this._long ? this._price >= minP : this._price <= maxP
    if (this._entryBars === -1 && touched) {
      this._entryBars = this._bars
    }
  }

  close(bar) {
    return this.liquidation(bar.close, bar)
  }

  closeMarket(bar) {
    return this.orderMarket(bar.close, bar, -this.getPostionAmount())
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

  shouldClosePosition(bar) {
    const result = this.shouldStopClosePosition(bar)
    if (result) {
      return result
    }
    return this.shouldTakeProfit(bar)
  }

  shouldStopClosePosition(bar) {
    const { timestamp, high, low } = bar
    if (this.hasPosition() && this._stopPrice) {
      this.updateMinMax(bar)
      const lossPrice = this._stopPrice
      const longPosition = this._amount > 0
      const lost = longPosition ? (low <= lossPrice) : (high >= lossPrice)
      if (lost) {
        return this.orderMarket(lossPrice, bar, -this.getPostionAmount(), lost)
      }
    }
  }

  shouldTakeProfit(bar) {
    const { timestamp, high, low } = bar
    if (this.hasPosition() && this._profitPrice) {
      // this.updateMinMax(bar)
      const longPosition = this._amount > 0
      const wined = longPosition ? (high > this._profitPrice) : (low < this._profitPrice)
      if (wined) {
        return this.orderMarket(this._profitPrice, bar, -this.getPostionAmount(), false)
      }
    }
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

  hasPosition() {
    return this._amount !== 0
  }

  getPostionAmount() {
    return this._amount
  }

  getUnreleasedProfitPercent(price) {
    if (this._amount > 0) {
      return (price - this._avgPrice) / this._avgPrice
    } else if (this._amount < 0) {
      return (this._avgPrice - price) / this._avgPrice
    }
  }
}

module.exports = Account
