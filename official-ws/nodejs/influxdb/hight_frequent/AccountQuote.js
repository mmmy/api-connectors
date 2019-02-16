const DeltaParse = require('../../libForBrowser')
class AccountQuote {
  constructor(options) {
    this._options = {
      ...options
    }

    this._CLIENT = {
      _data: {},
      _keys: {}
    }
  }

  update(json, symbol) {
    symbol = symbol || 'XBTUSD'
    let _data = DeltaParse.onAction(json.action, json.table, symbol, this._CLIENT, json)
    // json.action都是insert， 导致this._CLIENT._data[symbol]的长度很长
    // 只保留10条数据
    if (this._CLIENT._data.quote[symbol].length > 10) {
      this._CLIENT._data.quote[symbol] = this._CLIENT._data.quote[symbol].slice(0, 10)
    }
    // console.log('account quote test', symbol, this._CLIENT._data.quote[symbol].length, this._CLIENT._data.quote[symbol][0])
  }
  // 其实是orderBook level1
  getLatestQuote(symbol = 'XBTUSD') {
    const quotes = this._CLIENT._data.quote[symbol]
    if (quotes && quotes.length > 0) {
      return quotes[0]
    }
    return null
  }

  getAllLatestQuote() {
    let quotes = []
    for (let key in this._CLIENT._data.quote) {
      let quote = this.getLatestQuote(key)
      if (quote) {
        quotes.push(quote)
      }
    }
    return quotes
  }
}

module.exports = AccountQuote
