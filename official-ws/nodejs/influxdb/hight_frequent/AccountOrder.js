const DeltaParse = require('../../libForBrowser')
// ordStatus: 'Canceled' 取消的order 还在 _data中
class AccountOrder {
  constructor(options) {
    this._options = {
      ...options
    }
    this._data = []
  
    this._CLIENT = {
      _data: {},
      _keys: {}
    }
  }

  update(json) {
    this._data = DeltaParse.onAction(json.action, json.table, 'XBTUSD', this._CLIENT, json)
    .filter(item => item.ordStatus !== 'Canceled')
  }

  hasOrder() {
    return this._data.length > 0
  }

  getLimitOrders(long) {
    return this._data.filter(o => o.side === (long ? 'Buy' : 'Sell'))
  }

  getStopOrders() {
    return this._data.filter(o => o.ordType === 'Stop')
  }
}

module.exports = AccountOrder
