
const Account = require('./Account')
const Candles = require('../../strategy/Candles')
const statisticTrades = require('./utils').statisticTrades

class BackTest {
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
    this._onUpdateBar = {}
    this._waitingForOrderBreak = { long: false, short: false }
    this.initCandles()
    this._candleCount={

    }
  }

  initCandles() {
    this._periods.forEach(key => {
      // 四小时线是合成的
      let candle = null
      if (key === '4h') {
        candle = new Candles4H(this._options[key])
      } else {
        candle = new Candles(this._options[key])
      }
      this._candles[key] = candle
    })
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

  setCandleHistory(period, list) {
    this._candles[period].setHistoryData(list)
    this._candleCount[period] = this._candleCount[period] || list.length
  }

  updateCandleLastHistory(period, data) {
    // console.log('updateCandleLastHistory', period, data)
    this._candles[period].updateLastHistory(data)
    // this._candles[period].checkData()
    const cb = this._onUpdateBar[period]
    cb && cb(data)
    if (!this._candleCount[period]) {
      this._candleCount[period] = 0
    }
    this._candleCount[period] ++
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
}

module.exports = BackTest
