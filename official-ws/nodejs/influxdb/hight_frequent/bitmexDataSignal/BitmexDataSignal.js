
const FlowDataBase = require('../FlowDataBase')
const _ = require('lodash')

class BitmexDataSignal extends FlowDataBase {
  constructor(options) {
    super(options)
    this._checkOptions = {
      orderBook: {
        'XBTUSD': {
          check: true,
          maxSize: 5E5,
          priceGap: 5,
          precision: 0.5,
          historySignals: [],
        },
        'ETHUSD': {
          check: true,
          maxSize: 3E5,
          priceGap: 1,
          precision: 0.05,
          historySignals: [],
        },
      }
    }
    this._checkInterval = null
    this._onOrderBookSignal = null // func
    this.startCheckInterval()
  }

  startCheckInterval() {
    if (!this._checkInterval) {
      this._checkInterval = setInterval(() => {
        this.checkOrderBook()
      }, 2000)
    }
  }

  stopCheckInterval() {
    clearInterval(this._checkInterval)
    this._checkInterval = null
  }

  isCheckingInterval() {
    return !!this._checkInterval
  }

  checkOrderBook() {
    const orderBookSymobls = Object.getOwnPropertyNames(this._checkOptions.orderBook)
    orderBookSymobls.forEach(symbol => {
      const setting = this._checkOptions.orderBook[symbol]
      const { maxSize, priceGap, precision, historySignals } = setting
      const ob = this.getOrderBook(symbol)
      if (!ob) {
        return
      }
      const bid0 = ob.getTopBidPrice2(0)
      const ask0 = ob.getTopAskPrice2(0)
      let buySide = false
      let sellSide = false
      // ask0 和 bid0 是连续的价格
      if (ask0 - bid0 === precision) {
        const bid1 = ob.getTopBidPrice2(maxSize)
        const ask1 = ob.getTopAskPrice2(maxSize)
        buySide = bid0 - bid1 >= priceGap
        sellSide = ask1 - ask0 >= priceGap
      }
      historySignals.push({
        buySide,
        sellSide
      })
      if (historySignals.length > 9) {
        historySignals.shift()
      }
      if ((buySide || sellSide) && this._onOrderBookSignal ) {
        this._onOrderBookSignal(symbol, historySignals)
      }
    })
  }

  getCheckOptions() {
    return {
      checkInterval: this.isCheckingInterval(),
      ...this._checkOptions
    }
  }

  setCheckOption(path, value) {
    _.set(this._checkOptions, path, value)
  }

  getOrderBookSymbols() {
    return this._accountOrderBook.getSymbols()
  }

  getOrderBook(symbol) {
    return this._accountOrderBook.getOrderBook(symbol)
  }
}

module.exports = BitmexDataSignal
