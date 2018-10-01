
const Account = require('./Account')
const Candles = require('../../strategy/Candles')

class BackTest {
  constructor(options) {
    this._options = {
      ...options
    }
    this._tradeHistory = []
    this._accout = new Account(this._options['account'])
    this._periods = ['1m', '5m', '1h', '1d']
    this._candles = {}
    this.initCandles()

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

  setCandleHistory(period, list) {
    this._candles[period].setHistoryData(list)
  }

  updateCandleLastHistory(period, data) {
    // console.log('updateCandleLastHistory', period, data)
    this._candles[period].updateLastHistory(data)
    this._candles[period].checkData()
  }

  setStrategy(strategy) {
    this._strategy = strategy
  }

  entry(bar, long) {
    this._accout.order(bar, long)
  }

  readBar(bar) {
    if (this._accout.isReadyToOrder()) {
      const signal = this._strategy(bar, this._candles)
      if (signal.long || signal.short) {
        this.entry(bar, signal.long)
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
    let netProfit = 0,
        winRate = 0,
        total = this._tradeHistory.length,
        maxBack = 0,
        avgHoldMinute = 0
    
    let wins = 0
    let sumMinute = 0
    let backList = [0]
    this._tradeHistory.forEach((t, i) => {
      const { wined, minute, profit } = t
      if (wined) {
        wins ++
      }
      sumMinute += minute
      netProfit += profit
      if (i > 0) {
        let backLen = backList.length
        let back = backList[backLen - 1] + profit
        back = Math.min(0, back)
        backList.push(back)
      }
    })
    maxBack = Math.min.apply(null, backList)
    winRate = (wins / total).toFixed(4)
    avgHoldMinute = Math.round(sumMinute / total)

    return {
      total,
      netProfit,
      winRate,
      maxBack,
      avgHoldMinute,
    }
  }
}

module.exports = BackTest
