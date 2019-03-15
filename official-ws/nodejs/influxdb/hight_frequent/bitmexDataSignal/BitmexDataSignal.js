
const FlowDataBase = require('../FlowDataBase')
const _ = require('lodash')

class BitmexDataSignal extends FlowDataBase {
  constructor(options) {
    super(options)
    this._checkOptions = {
      orderBook: {
        'XBTUSD': {
          check: false,
          maxSize: 5E6,
          priceGap: 5,
        },
        'ETHUSD': {
          check: false,
          maxSize: 3E6,
          priceGap: 1,
        },
      }
    }
    this._checkInterval = null
  }

  startCheckInterval() {
    if (!this._checkInterval) {
      this._checkInterval = setInterval(() => {
        this.checkOrderBook()
      }, 1000)
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
}

module.exports = BitmexDataSignal
