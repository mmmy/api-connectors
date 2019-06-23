
const BackTest = require('../BackTest')
const AccountV2 = require('../AccountV2')


class BackTestRsiDivergence extends BackTest {
  constructor(options) {
    super(options)
    this._accout = new AccountV2(this._options['account'])

    this.initStrategy()
  }

  initStrategy() {
    this.setStrategy((bar, candles) => {
      const longPriceLen = this._options.longPriceLen || -1             // 5min: 6, 1min: 50  // disable: -1
      const longMaxPriceDiff = this._options.longMaxPriceDiff || 30     // 1min: 47
      const longMinPriceDiff = this._options.longMinPriceDiff || 0      // 1min: 20

      const shortPriceLen = this._options.longPriceLen || -1             // 1min: 50 // disable: -1
      const shortMaxPriceDiff = this._options.shortMaxPriceDiff || 30   // 1min: 47
      const shortMinPriceDiff = this._options.shortMinPriceDiff || 0   // 1min: 20

      const longRateLen = this._options.longRateLen || -1
      const longPriceRateMin = this._options.longPriceRateMin || 0.6
      const longPriceRateMax = this._options.longPriceRateMax || 2

      const shortRateLen = this._options.shortRateLen || -1
      const shortPriceRateMin = this._options.shortPriceRateMin || 0.1
      const shortPriceRateMax = this._options.shortPriceRateMax || 0.3

      let long = false
      let short = false
      const _5mCandle = candles['5m']
      let mainCandle = _5mCandle

      const rsiDivergenceSignal = mainCandle.rsiDivergenceSignal(false, 10, 24, 20, 83)

      const disableShort = this._options.disableShort
      const disableLong = this._options.disableLong
      if (
        !disableLong &&
        rsiDivergenceSignal.long
      ) {
        // console.log(bar.timestamp, bar.close)
        const trendSignal = this.get1dMacdTrendSignal()
        if (trendSignal.long) {
          long = true
        }
      } else if (
        !disableShort &&
        rsiDivergenceSignal.short
      ) {
        const trendSignal = this.get1dMacdTrendSignal()
        if (trendSignal.short) {
          short = true
        }
      }
      let strategyPrice = null

      return {
        long,
        short
      }
    })

    this._closeSignal = () => {
      const candleManager5m = this.getCandleByPeriod('5m')
      const rsiDivergenceSignal = candleManager5m.rsiDivergenceSignal(false, 10, 24, 30, 70)
      return rsiDivergenceSignal
    }

    this._onUpdateBar['5m'] = this.readBar5m.bind(this)
  }

  readBar5m(bar) {
    // const signal = this._strategy(bar, this._candles)
    // return
    const hasStopOpenOrder = this.hasStopOpenOrder()
    if (hasStopOpenOrder) {
      if (this._highsToBuy.ordering && this.isHigh1('5m')) {
        if (this._highsToBuy.remains === 1) {
          // has bought
          this.orderMarketPrevHighLow('5m', bar, 1)
          this._highsToBuy.ordering = false
        } else {
          this._highsToBuy.remains = this._highsToBuy.remains - 1
        }
      }
      if (this._lowsToSell.ordering && this.isLow1('5m')) {
        if (this._lowsToSell.remains === 1) {
          // has bought
          this.orderMarketPrevHighLow('5m', bar, -1)
          this._lowsToSell.ordering = false
        } else {
          this._lowsToSell.remains = this._lowsToSell.remains - 1
        }
      }
    } else {
      if (!this._accout.hasPosition()) {
        const signal = this._strategy(bar, this._candles)
        if (signal.long) {
          this.startBuyHigh(2)
        }
        if (signal.short) {
          this.startSellLow(2)
        }
      } else {
        // close trade
        const closeSignal = this._closeSignal(bar, this._candles)
        if (closeSignal.long && this._accout.getPostionAmount() < 0) {
          const result = this._accout.closeMarket(bar)
          if (result) {
            this._tradeHistory.push(result)
          }
        }
        if (closeSignal.short && this._accout.getPostionAmount() > 0) {
          const result = this._accout.closeMarket(bar)
          if (result) {
            this._tradeHistory.push(result)
          }
        }
      }
    }
    // const result = this._accout.shouldLiquidation(bar)
  }

  orderMarketPrevHighLow(period, bar, amount) {
    const { high, low } = this.getHistoryCandleByPeriod(period, 2)
    this.orderMarket(amount > 0 ? (high + 0.5) : (low - 0.5), bar, amount)
  }

  orderMarket(price, bar, amount) {
    return this._accout.orderMarket(price, bar, amount)
  }

  isHigh1(period) {
    const candleManager = this.getCandleByPeriod(period)
    const { high1 } = candleManager.highlow1Signal()
    return high1
  }

  isLow1(period) {
    const candleManager = this.getCandleByPeriod(period)
    const { low1 } = candleManager.highlow1Signal()
    return low1
  }

  getCandleByPeriod(period) {
    return this._candles[period]
  }

  getHistoryCandleByPeriod(period, bars) {
    return this.getCandleByPeriod(period).getHistoryCandle(bars)
  }

  get1dMacdTrendSignal() {
    const candleManager = this._candles['1d']
    const macdTrendSignal = candleManager.macdTrendSignal(false)
    return macdTrendSignal
  }
}

module.exports = BackTestRsiDivergence