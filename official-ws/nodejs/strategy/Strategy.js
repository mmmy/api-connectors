
const Account = require('./Account')
const OrderBook = require('./OrderBook')
const Candles = require('./Candles')
const RealtimeTradeDataManager = require('./RealtimeTradeDataManager')

const defaultAmount = 2000

class Strategy {
  constructor(options) {
    this._options = {...options}
    this._periods = ['1m', '5m', '1h']

    this._candles = {}
    this._orderBook = null
    this._accont = null
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
    this._orderBook = new OrderBook(this._options['orderbook'])
  }

  initAccount() {
    this._accont = new Account(this._options['account'])
  }

  initCandles() {
    this._periods.forEach(key => {
      this._candles[key] = new Candles(this._options[key])
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
    this._orderBook.update(data)
  }

  updateTradeHistoryData(data) {
    this._tradeHistoryManager.appendData(data)
  }

  setStrategy(strategy) {
    this._strategy = strategy
  }

  entry(price, long) {
    this._accont.orderLimit(price, long, this._options.amount || defaultAmount)
  }

  shouldLiquidation(price) {
    return this._accont.shouldLiquidation(price)
  }
  // order book 必须watch
  doStrategy(price) {
    if (this._accont.isReadyToOrder()) {
      const signal = this._strategy(price, this._candles, this._orderBook, this._tradeHistoryManager)
      if (signal.long) {
        var bidPrice = this._orderbook.getTopBidPrice()        
        this.entry(bidPrice, true)
      } else if (signal.short) {
        var askPrice = this._orderBook.getTopAskPrice()
        this.entry(askPrice, false)
      }
    }

    var result = this.shouldLiquidation(price)
    return result
  }

  getLastTrade() {
    return this._accont.getLastTrade()
  }

  getAllOptions() {
    var orderbookOptions = this._orderBook.getOptions()
    var accountOptions = this._accont.getOptions()
    return {
      ...this._options,
      orderbook: orderbookOptions,
      account: accountOptions,
    }
  }

  getAllTrades() {
    return this._accont._tradeHistories
  }
}

module.exports = Strategy
