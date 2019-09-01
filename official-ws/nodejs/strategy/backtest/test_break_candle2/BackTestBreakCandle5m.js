// breakCandle 重构版本
const BackTestSymbol = require('../BackTestSymbol')
const AccountV2 = require('../AccountV2')


class BackTestBreakCandle5m extends BackTestSymbol {
  constructor(options) {
    super(options)
    this._accout = new AccountV2(this._options['account'])

    this.initStrategy()
  }

  initStrategy() {
    this.setStrategy((bar, candles) => {
      const { highVol, useAdx, len, upVol } = this._options

      let long = false
      let short = false
      const _5mCandle = this.getCandle('XBTUSD', '5m')
      const _1hCandle = this.getCandle('XBTUSD', '1h')
      const _1dCandle = this.getCandle('XBTUSD', '1d')
      let mainCandle = _5mCandle

      const signal = mainCandle.isLastBarTrend(len)

      const disableShort = this._options.disableShort
      const disableLong = this._options.disableLong
      if (
        !disableLong &&
        signal.long
      ) {
        // const highVolFilter = highVol ? _1hCandle.isUpVol(10, 3) : true
        const upVolFilter = upVol ? _1hCandle.isUpVol(10, 3) : true
        const highVolFilter = highVol ? _5mCandle.isHighVol(len, 3) : true
        const adxFilter = useAdx ? _1dCandle.adxSignal(14, false).long : true
        // console.log(bar.timestamp, bar.close)
        // const trendSignal = this.get1dMacdTrendSignal()
        // const filterS = this.getMacdDepartSignal('1h')
        // if (filterS.long) {

        // if (isHighBoDong && !mainCandle.isCurrentHighestLowestClose(false, 300)) {
        if (highVolFilter && adxFilter && upVolFilter) {
          long = true
        }
        // if (!_1hCandle.isCurrentHighestLowestClose(false, 48) && !mainCandle.isCurrentHighestLowestClose(false, 300)) {
        //   long = true
        // }
      } else if (
        !disableShort &&
        signal.short
      ) {
        const upVolFilter = upVol ? _1hCandle.isUpVol(10, 3) : true
        const highVolFilter = highVol ? _5mCandle.isHighVol(len, 3) : true
        const adxFilter = useAdx ? _1dCandle.adxSignal(14, false).short : true
        // const isStrongLong = _1dCandle.isStrongLong()
        // const trendSignal = this.get1dMacdTrendSignal()
        // const filterS = this.getMacdDepartSignal('1h')
        // if (filterS.short) {
        // if (trendSignal.short) {
        if (highVolFilter && adxFilter && upVolFilter) {
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
      return {
        long: false,
        short: false
      }
      // const candleManager5m = this.getCandleByPeriod('5m')
      // const rsiDivergenceSignal = candleManager5m.rsiDivergenceSignal(false, 10, 24, 24, 30, 70)
      // return rsiDivergenceSignal
    }

    this._onUpdateBar['XBTUSD']['5m'] = this.readBar5m.bind(this)
  }

  readBar5m(symbol, period, bar) {
    // const signal = this._strategy(bar, this._candles)
    // return
    this.checkCandle(symbol)
    const hasStopOpenOrder = this.hasStopOpenOrder()
    if (hasStopOpenOrder) {
      if (this._highsToBuy.ordering && this.isHigh1(symbol, '5m')) {
        if (this._highsToBuy.remains === 1) {
          // has bought
          this.orderMarketPrevHighLow(symbol, '5m', bar, this._highsToBuy.amount)
          this.setPositionStop(symbol, true)
          this.setPositionProfit(symbol, true)
          this._highsToBuy.ordering = false
        } else {
          this._highsToBuy.remains = this._highsToBuy.remains - 1
        }
      }
      if (this._lowsToSell.ordering && this.isLow1(symbol, '5m')) {
        if (this._lowsToSell.remains === 1) {
          // has bought
          this.orderMarketPrevHighLow('5m', bar, this._lowsToSell.amount)
          this.setPositionStop(symbol, false)
          this.setPositionProfit(symbol, false)
          this._lowsToSell.ordering = false
        } else {
          this._lowsToSell.remains = this._lowsToSell.remains - 1
        }
      }
    } else if (this._waitingForOrderBreak.long || this._waitingForOrderBreak.short) {
      const stochOverSignal = this.getCandle(symbol, '5m').stochOverTradeSignal(9, 3, 30, 70)
      if (stochOverSignal.long && this._waitingForOrderBreak.long) {
        this.startBuyHigh(4, 1)
        this._waitingForOrderBreak.long = false
      }
      if (stochOverSignal.short && this._waitingForOrderBreak.short) {
        this.startSellLow(4, -1)
        this._waitingForOrderBreak.short = false
      }
    } else {
      if (!this._accout.hasPosition()) {
        const signal = this._strategy(bar, this._candles)
        if (signal.long) {
          this._waitingForOrderBreak.long = true
          // this._openLongSignalStopPrice = this._5mCandle.get
        }
        if (signal.short) {
          this._waitingForOrderBreak.short = true
        }
      } else {
        // 记录持仓K线数
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
    // stop market or takeProfit
    const result = this._accout.shouldClosePosition(bar)
    if (result) {
      this._tradeHistory.push(result)
    }
  }

  setPositionStop(symbol, long) {
    const { len } = this._options
    const { maxHigh, minLow } = this.getCandle(symbol, '5m').getMinMaxHighLow(len)
    this._accout.setStopPrice(long ? minLow : maxHigh)
  }

  setPositionProfit(symbol, long) {
    const { len } = this._options
    const { high, low } = this.getHistoryCandleByPeriod(symbol, '5m', 2)
    const { maxHigh, minLow } = this.getCandle(symbol, '5m').getMinMaxHighLow(len)
    let profit = (maxHigh - minLow) * 1
    profit = Math.round(profit * 2) / 2
    // this._accout.setProfitPrice(long ? (high + maxHigh - minLow) : (low - maxHigh + minLow))
    this._accout.setProfitPrice(long ? (low + profit) : (high - profit))
  }

  orderMarketPrevHighLow(symbol, period, bar, amount) {
    const { high, low } = this.getHistoryCandleByPeriod(symbol, period, 2)
    this.orderMarket(amount > 0 ? (high + 0.5) : (low - 0.5), bar, amount)
  }

  orderMarket(price, bar, amount) {
    return this._accout.orderMarket(price, bar, amount)
  }

  isHigh1(symbol, period) {
    const candleManager = this.getCandle(symbol, period)
    const { high1 } = candleManager.highlow1Signal()
    return high1
  }

  isLow1(symbol, period) {
    const candleManager = this.getCandle(symbol, period)
    const { low1 } = candleManager.highlow1Signal()
    return low1
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
}

module.exports = BackTestBreakCandle5m