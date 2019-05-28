const DeltaParse = require('../../libForBrowser')
class AccountInstrument {
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
    // console.log('account instrument', symbol, this._CLIENT._data.instrument[symbol].length, this.getInstrument(symbol).symbol)
  }
  // 其实是orderBook level1
  getInstrument(symbol = 'XBTUSD') {
    return this._CLIENT._data.instrument[symbol] && this._CLIENT._data.instrument[symbol][0]
  }

  getAllInstrument() {
    let instruments = []
    for (let key in this._CLIENT._data.instrument) {
      let instrument = this.getInstrument(key)
      if (instrument) {
        instruments.push(instrument)
      }
    }
    return instruments
  }
}

module.exports = AccountInstrument
