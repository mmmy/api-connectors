
const FlowDataBase = require('../FlowDataBase')
const _ = require('lodash')

const buyRange = [0, 24]
const sellRange = [25, 49]

class BitmexDataSignal extends FlowDataBase {
  constructor(options) {
    super(options)
    this._checkOptions = {
      orderBook: {
        'XBTUSD': {
          check: true,
          maxSize: 2E6,
          priceGap: 8,
          precision: 0.51,
          rateTheshold: 2,               // totalBuySize / totalSellSize
          historySignals: [],
        },
        'ETHUSD': {
          check: true,
          maxSize: 2E6,
          priceGap: 0.5,
          precision: 0.051,
          historySignals: [],
          rateTheshold: 2,
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
      const { maxSize, priceGap, precision, historySignals, rateTheshold } = setting
      const ob = this.getOrderBook(symbol)
      if (!ob) {
        return
      }
      const bid0 = ob.getTopBidPrice2(0)
      const ask0 = ob.getTopAskPrice2(0)
      let buySide = false
      let sellSide = false
      // ask0 和 bid0 是连续的价格
      // 137.35 - 137.3 = 0.049999999
      if (ask0 - bid0 <= precision) {
        const bid1 = ob.getTopBidPrice2(maxSize)
        const ask1 = ob.getTopAskPrice2(maxSize)
        buySide = bid0 - bid1 >= priceGap
        sellSide = ask1 - ask0 >= priceGap
      }

      const lastIndex = ob.getLastBuyIndex()
      let sizeRate = -1
      let rateBuySignal = false
      let rateSellSignal = false
      if (lastIndex === 24) {
        const buyTotalSize = ob.sumSizeRange(buyRange)
        const sellTotalSize = ob.sumSizeRange(sellRange)
        sizeRate = buyTotalSize / sellTotalSize
        sizeRate = Math.round(sizeRate * 100) / 100
        if (sizeRate > rateTheshold) {
          rateBuySignal = true
        } else if (sizeRate < 1 / rateTheshold) {
          rateSellSignal = true
        }
        // console.log(symbol, (buyTotalSize / 1E6).toFixed(1), (sellTotalSize / 1E6).toFixed(1), ob._data[0].price, ob._data[49].price)
      }

      historySignals.push({
        bid0,
        ask0,
        buySide,
        sellSide,
        sizeRate,
        rateBuySignal,
        rateSellSignal,
      })
      if (historySignals.length > 9) {
        historySignals.shift()
      }
      if ((buySide || sellSide || rateBuySignal || rateSellSignal) && this._onOrderBookSignal ) {
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
