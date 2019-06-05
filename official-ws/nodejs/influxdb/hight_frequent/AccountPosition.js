const DeltaParse = require('../../libForBrowser')
class AccountPosition {
  constructor(options) {
    this._options = {
      ...options
    }

    this._CLIENT = {
      _data: { position: {} },
      _keys: {}
    }
  }

  update(json, symbol) {
    symbol = symbol || 'XBTUSD'
    // 由于首次可能不是action=partial, 导致永远不能更新的bug
    if (!this._CLIENT._data.position[symbol]) {
      this._CLIENT._data.position[symbol] = []
    }
    let _data = DeltaParse.onAction(json.action, json.table, symbol, this._CLIENT, json)
    // console.log('account position test', symbol, this.getCostPrice(symbol))
  }

  getPositionData(symbol = 'XBTUSD') {
    //永远长度为1， 即使是空仓也会有上次的交易信息??
    const position = this._CLIENT._data.position[symbol]
    return position ? position[0] : {}
  }

  hasPosition(symbol = 'XBTUSD') {
    return !!(this.getCurrentQty(symbol) && this.getCostPrice(symbol))
  }

  getPosition(symbol = 'XBTUSD') {
    return this.getPositionData(symbol) || {}
  }

  getCurrentQty(symbol = 'XBTUSD') {
    return this.getPosition(symbol).currentQty || 0
  }
  // 如果为null, 为空仓
  getCostPrice(symbol = 'XBTUSD') {
    return this.getPosition(symbol).avgCostPrice
  }
  // 返回仓位 不为零 的 position
  getAllPositions() {
    let allPositions = []
    for (let key in this._CLIENT._data.position) {
      if (this.hasPosition(key)) {
        allPositions.push(this.getPosition(key))
      }
    }
    return allPositions
  }
}

module.exports = AccountPosition
