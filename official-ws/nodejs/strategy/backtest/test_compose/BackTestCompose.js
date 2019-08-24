
const BackTest = require('../BackTest')
const AccountV2 = require('../AccountV2')


class BackTestCompose extends BackTest {
  constructor(options) {
    super(options)
    this._accout = new AccountV2(this._options['account'])

    this.initStrategy()
  }

  initStrategy() {
    this.setStrategy((bar, candles) => {

      const { downVol, disableLong, disableShort, lowDayBodong, rsi, high5mBodong } = this._options

      let long = false
      let short = false
      const _5mCandle = candles['5m']
      const _1hCandle = candles['1h']
      const _1dCandle = candles['1d']
      let mainCandle = _5mCandle

      // const swingSignal = _1hCandle.stochOverTradeSignal(9, 3, 30, 70)
      const swingSignal = _1hCandle.pinBarOpenSignal(5)
      // const swingSignal = _5mCandle.pinBarOpenSignal(20, true)

      if (
        !disableLong &&
        swingSignal.long
      ) {
        // const dayRsiFilter = _1dCandle.getLastRsi(12) < 60
        const downVolFilter = downVol ? _1hCandle.isDownVolEma(10, 5) : true
        // const lowVolFilter = lowVol ? _5mCandle.isLatestLowVol(50, 12, 1) : true
        // const lowVolFilter = lowVol ? _1hCandle.isLatestLowVol(50, 4, 1) && _5mCandle.isLowVol(50, 3) : true
        const lowBoDongFilter = lowDayBodong ? _1dCandle.isAdxHigh(14, true) : true
        // const highestLowestRsi = _1hCandle.getHighestLowestRsi(10, 10)
        const rsiFilter = rsi ? _1hCandle.getHighestLowestRsi(10, 10).lowest > 31 : true
        const high5mBodongFilter = high5mBodong ? _5mCandle.bollWidthPercent() > 0.03 : true
        // console.log(bar.timestamp, bar.close)
        // const trendSignal = this.get1dMacdTrendSignal()
        // const filterS = this.getMacdDepartSignal('1h')
        // if (filterS.long) {

        // 这个很牛逼
        // if (isHighBoDong && !mainCandle.isCurrentHighestLowestClose(false, 300)) {
        if (high5mBodongFilter && lowBoDongFilter && downVolFilter && rsiFilter) {
          long = true
        }
        // if (!_1hCandle.isCurrentHighestLowestClose(false, 48) && !mainCandle.isCurrentHighestLowestClose(false, 300)) {
        //   long = true
        // }
      } else if (
        !disableShort &&
        swingSignal.short
      ) {
        // const isLowVol = _5mCandle.isLowVol(50, 3)
        const lowVolFilter = lowVol ? _1hCandle.isLatestLowVol(50, 4, 1) && _5mCandle.isLowVol(50, 3) : true
        // const lowVolFilter = lowVol ? _5mCandle.isLatestLowVol(50, 12, 4) : true

        // const isHighBoDong = _1dCandle.isAdxHigh(14)
        // const isStrongLong = _1dCandle.isStrongLong()
        // const trendSignal = this.get1dMacdTrendSignal()
        // const filterS = this.getMacdDepartSignal('1h')
        // if (filterS.short) {
        // if (trendSignal.short) {
        if (lowVolFilter && !mainCandle.isCurrentHighestLowestClose(true, 300)) {

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
      // const rsiDivergenceSignal = candleManager5m.macdSwingSignal(false)
      // pinbar close
      // const short = candleManager5m.isPaStrongTrendBar(true) || candleManager5m.getLastRsi(12) > 70// || candleManager5m.isLowestHighestPinBar(false, 5)
      // const short = candleManager5m.isLowestHighestPinBar(false, 5)// || candleManager5m.getLastRsi(12) > 70,
      const short = candleManager5m.getLastRsi(12) > 70
      return {
        long: false,
        short: short
      }
    }

    this._onUpdateBar['5m'] = this.readBar5m.bind(this)
  }

  readBar5m(bar) {
    // const signal = this._strategy(bar, this._candles)
    // return
    // this.checkCandle()
    const hasStopOpenOrder = this.hasStopOpenOrder()
    if (hasStopOpenOrder) {
      if (this._highsToBuy.ordering && this.isHigh1('5m')) {
        if (this._highsToBuy.remains === 1) {
          // has bought
          this.orderMarketPrevHighLow('5m', bar, this._highsToBuy.amount)
          this._highsToBuy.ordering = false
        } else {
          this._highsToBuy.remains = this._highsToBuy.remains - 1
        }
      }
      if (this._lowsToSell.ordering && this.isLow1('5m')) {
        if (this._lowsToSell.remains === 1) {
          // has bought
          this.orderMarketPrevHighLow('5m', bar, this._lowsToSell.amount)
          this._lowsToSell.ordering = false
        } else {
          this._lowsToSell.remains = this._lowsToSell.remains - 1
        }
      }
    } else {
      if (!this._accout.hasPosition()) {
        const signal = this._strategy(bar, this._candles)
        if (signal.long) {
          this.startBuyHigh(2, 1)
        }
        if (signal.short) {
          this.startSellLow(2, -1)
        }
      } else {
        this._accout.updateMinMax(bar)
        // close trade
        if (this._accout.getUnreleasedProfitPercent(bar.close) < 0.01) {
          const signal = this._strategy(bar, this._candles)
          const positionAmount = this._accout.getPostionAmount()
          if (signal.long && positionAmount < 1) {
            const positionTime = new Date(bar.timestamp) - new Date(this._accout._openTime)
            console.log('and long long', positionTime / (60000))
            this.startBuyHigh(2, 1 - positionAmount)
          }
        }
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
    // stop market
    const result = this._accout.shouldStopClosePosition(bar)
    if (result) {
      this._tradeHistory.push(result)
    }
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

  getMacdDepartSignal(period) {
    const candleManager = this._candles[period]
    const signal = candleManager.macdDepartSignal(false)
    return signal
  }

  checkCandle() {
    const candle5m = this.getCandleByPeriod('5m')
    const candle1h = this.getCandleByPeriod('1h')
    const candle1d = this.getCandleByPeriod('1d')
    const timestamp5m = candle5m.getHistoryCandle(1).timestamp
    const timestamp1h = candle1h.getHistoryCandle(1).timestamp
    const timestamp1d = candle1d.getHistoryCandle(1).timestamp
    const gap5m1h = new Date(timestamp5m) - new Date(timestamp1h)
    const gap5m1d = new Date(timestamp5m) - new Date(timestamp1d)
    if (gap5m1h < 3600000 || gap5m1h > (3600000 * 2)) {
      console.log(`1h data timestamp not valide: ${gap5m1h / 60000}`)
      throw new Error(`1h data timestamp not valide: ${gap5m1h / 60000}`)
    }
    if (gap5m1d < 24 * 3600000 || gap5m1d > 24 * 3600000 * 2) {
      console.log(`1d data timestamp not valide: ${gap5m1d / (24 * 3600000)}`)
      throw new Error(`1d data timestamp not valide: ${gap5m1d / (24 * 3600000)}`)
    }
  }
}

module.exports = BackTestCompose