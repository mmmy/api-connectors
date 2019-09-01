
const Account = require('./Account')
const Candles = require('../../strategy/Candles')
const statisticTrades = require('./utils').statisticTrades

class BackTestSymbol {
  constructor(options) {
    this._options = {
      ...options
    }
    this._tradeHistory = []
    this._accout = new Account(this._options['account'])
    this._periods = ['1m', '5m', '1h', '1d']
    this._candles = {}
    this._highsToBuy = { ordering: false, remains: 0, amount: 1 }  // 高N买
    this._lowsToSell = { ordering: false, remains: 0, amount: -1 }   // 低N卖
    this._onUpdateBar = {
      'XBTUSD': {},
      'ETHUSD': {},
    }
    this._waitingForOrderBreak = { long: false, short: false }
    // this.initCandles()
    this._candleCount = {

    }
  }

  // initCandles() {
  //   this._periods.forEach(key => {
  //     // 四小时线是合成的
  //     let candle = null
  //     if (key === '4h') {
  //       candle = new Candles4H(this._options[key])
  //     } else {
  //       candle = new Candles(this._options[key])
  //     }
  //     this._candles[key] = candle
  //   })
  // }

  initCandleIfNeed(symbol, period) {
    if (!this._candles[symbol]) {
      this._candles[symbol] = {}
      this._candleCount[symbol] = this._candleCount[symbol] || {}
      this._onUpdateBar[symbol] = this._onUpdateBar[symbol] || {}
    }
    if (!this._candles[symbol][period]) {
      this._candles[symbol][period] = new Candles()
    }
  }

  getCandle(symbol, period) {
    return this._candles[symbol] && this._candles[symbol][period]
  }

  hasStopOpenOrder() {
    return this._highsToBuy.ordering || this._lowsToSell.ordering
  }

  startBuyHigh(times = 1, amount) {
    if (this._highsToBuy.ordering) {
      console.warn('this._highsToBuy.ordering = true')
    }
    this._highsToBuy.ordering = true
    this._highsToBuy.remains = times
    this._highsToBuy.amount = amount
  }

  startSellLow(times = 1, amount) {
    if (this._lowsToSell.ordering) {
      console.warn('this._lowsToSell.ordering = true')
    }
    this._lowsToSell.ordering = true
    this._lowsToSell.remains = times
    this._lowsToSell.amount = amount
  }

  setCandleHistory(symbol, period, list) {
    this.initCandleIfNeed(symbol, period)
    this._candles[symbol][period].setHistoryData(list)
    this._candleCount[symbol][period] = this._candleCount[symbol][period] || list.length
  }

  updateCandleLastHistory(symbol, period, data) {
    // console.log('updateCandleLastHistory', period, data)
    this.getCandle(symbol, period).updateLastHistory(data)
    // this._candles[period].checkData()
    const cb = this._onUpdateBar[symbol][period]
    cb && cb(symbol, period, data)
    if (!this._candleCount[symbol][period]) {
      this._candleCount[symbol][period] = 0
    }
    this._candleCount[symbol][period]++
  }

  setStrategy(strategy) {
    this._strategy = strategy
  }

  entry(bar, long) {
    this._accout.order(bar, long)
  }

  orderStop(bar, long) {
    this._accout.orderStop(bar, long)
  }

  readBar(bar) {
    const signal = this._strategy(bar, this._candles)
    if (this._accout.isReadyToOrder()) {
      if (signal.long || signal.short) {
        this.entry(bar, signal.long)
      }
    } else {
      // close trade
      if (signal.close) {
        this._accout.close(bar)
      }
    }
    const result = this._accout.shouldLiquidation(bar)
    if (result) {
      this._tradeHistory.push(result)
    }
  }

  getTrades() {
    return this._tradeHistory
  }

  // 統計
  statistic() {
    return statisticTrades(this._tradeHistory)
  }

  getHistoryCandleByPeriod(symbol, period, bars) {
    return this.getCandle(symbol, period).getHistoryCandle(bars)
  }

  getPrecision(symbol) {
    const PRECISION = {
      'XBTUSD': 0.5,
      'ETHUSD': 0.05,
    }
    let p = PRECISION[symbol]
    if (!p) {
      throw `${symbol} 's precision not exist?`
    }
    return p
  }

  checkCandle(symbol) {
    const candle5m = this.getCandle(symbol, '5m')
    const candle1h = this.getCandle(symbol, '1h')
    const candle1d = this.getCandle(symbol, '1d')
    if (!candle5m || !candle1h || !candle1d) {
      throw Error('no data...')
    }
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

module.exports = BackTestSymbol
