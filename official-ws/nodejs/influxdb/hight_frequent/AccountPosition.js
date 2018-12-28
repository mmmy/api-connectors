const DeltaParse = require('../../libForBrowser')
// _data 永远长度为1， 即使是空仓也会有上次的交易信息
class AccountPosition {
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
  }

  hasPosition() {
    return !!(this.getCurrentQty() && this.getCostPrice())
  }

  getPosition() {
    return this._data[0] || {}
  }

  getCurrentQty() {
    return this.getPosition().currentQty || 0
  }
  // 如果为null, 为空仓
  getCostPrice() {
    return this.getPosition().avgCostPrice
  }
}

module.exports = AccountPosition
