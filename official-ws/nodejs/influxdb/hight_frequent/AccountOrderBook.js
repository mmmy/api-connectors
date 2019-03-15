const OrderBook = require('../../strategy/researchOrderbookL2/OrderBookL2Trade')

class AccountOrderBook {
  constructor(options) {         // may have 'ETHUSD':{} options
    this._options = {
      ...options
    }
    this._books = {}
  }
  update(json, symbol) {
    if (!this._books[symbol]) {
      this._books[symbol] = new OrderBook(this._options[symbol])
    }
    this._books[symbol].update(json, symbol)
  }
  getSymbols() {
    return Object.getOwnPropertyNames(this._books)
  }
  getOrderBook(symbol) {
    return this._books[symbol]
  }
}

module.exports = AccountOrderBook