
const Account = require('./Account')
const OrderBook = require('./OrderBook')
const Candles = require('./Candles')
const Candles4H = require('./Candles4H')
const RealtimeTradeDataManager = require('./RealtimeTradeDataManager')
const _ = require('lodash')

class Strategy {
  constructor(options) {
    this._options = {
      ...options,
      amount: 2000
    }
    this._periods = ['1m', '5m', '1h', '4h']

    this._candles = {}
    this._orderbook = null
    this._account = null
    this._tradeHistoryManager = null

    this.initCandles()
    this.initOrderBook()
    this.initAccount()
    this.initTradeHistory()
  }

  initTradeHistory() {
    this._tradeHistoryManager = new RealtimeTradeDataManager(this._options['tradeHistroy'])
  }

  initOrderBook() {
    this._orderbook = new OrderBook(this._options['orderbook'])
  }

  initAccount() {
    this._account = new Account(this._options['account'])
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

  updateCandlesRealTime(data) {
    this._periods.forEach(key => {
      this._candles[key].updateRealTimeCandle(data)
    })
  }

  updateOrderbook(data) {
    this._orderbook.update(data)
  }

  updateTradeHistoryData(data) {
    this._tradeHistoryManager.appendData(data)
  }

  setStrategy(strategy) {
    this._strategy = strategy
  }

  entry(price, long, tradePrice) {
    const { disableLong, disableShort } = this._options
    if (long && disableLong) {
      return
    }
    if (short && disableShort) {
      return
    }
    this._account.orderLimit(price, long, this._options.amount, tradePrice)
  }

  shouldLiquidation(price) {
    return this._account.shouldLiquidation(price)
  }
  // order book 必须watch
  doStrategy(price) {
    if (this._account.isReadyToOrder()) {
      const signal = this._strategy(price, this._candles, this._orderbook, this._tradeHistoryManager)
      //有的时候需要在当前的orderbook 上偏移一段价格来挂单, 这样对我们有利
      const priceOffset = signal.priceOffset || 0
      const strategyPrice = signal.strategyPrice
      
      if (signal.long) {
        var bidPrice = this._orderbook.getTopBidPrice()
        // 当策略 给出了一个合理的挂单价格, 那么需要取个最优值
        if (strategyPrice) {
          bidPrice = Math.min(bidPrice, strategyPrice)
        }        
        this.entry(bidPrice - priceOffset, true, price)
      } else if (signal.short) {
        var askPrice = this._orderbook.getTopAskPrice()
        // 同上
        if (strategyPrice) {
          askPrice = Math.max(askPrice, strategyPrice)
        }
        this.entry(askPrice + priceOffset, false, price)
      }
    }

    var result = this.shouldLiquidation(price)
    return result
  }

  getLastTrade() {
    return this._account.getLastTrade()
  }

  getAllOptions() {
    var orderbookOptions = this._orderbook.getOptions()
    var accountOptions = this._account.getOptions()
    return {
      ...this._options,
      orderbook: orderbookOptions,
      account: accountOptions,
    }
  }

  getAllTrades() {
    return this._account._tradeHistories
  }

  clearAllTrades() {
    this._account.clearAllTrades()
  }

  updateOptions(options) {
    this._options = {
      ...this.options,
      ...options
    }

    this._account.setOptions(this._options['account'])
    this._orderbook.setOptions(this._options['orderbook'])
  }

  updateOption(key, value) {
    console.log(typeof value)
    this._options[key] = value
    // _.set(this._options, key, value)
    return this._options[key]
  }

  getStrategyId() {
    return this._options.id
  }
}

module.exports = Strategy
