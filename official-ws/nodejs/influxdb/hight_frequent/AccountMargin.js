const DeltaParse = require('../../libForBrowser')
class AccountMargin {
  constructor(options) {
    this._options = {
      ...options
    }

    this._CLIENT = {
      _data: {},
      _keys: {}
    }

    this._data = []
  }

  update(json, symbol) {
    symbol = symbol || 'XBTUSD'
    this._data = DeltaParse.onAction(json.action, json.table, symbol, this._CLIENT, json)
    // console.log('account position test', symbol, this.getCostPrice(symbol))
  }

  getMargin() {
    return this._data[0]
  }
}

module.exports = AccountMargin
