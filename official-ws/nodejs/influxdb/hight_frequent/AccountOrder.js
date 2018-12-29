const DeltaParse = require('../../libForBrowser')
// ordStatus: 'Canceled' 取消的order 还在 _data中
class AccountOrder {
  constructor(options) {
    this._options = {
      ...options
    }
    this._data = []
    // 由于首次可能不是action=partial, 导致永远不能更新的bug
    this._CLIENT = {
      _data: {
        order: {
          'XBTUSD': []
        }
      },
      _keys: {
        order: ["orderID"]
      }
    }
  }

  update(json) {
    this._data = DeltaParse.onAction(json.action, json.table, 'XBTUSD', this._CLIENT, json)
    .filter(item => ['Canceled', 'Filled'].indexOf(item.ordStatus) === -1)
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

  getReduceOnlyOrders() {
    return this._data.filter(o => o.execInst && o.execInst.indexOf('ReduceOnly') > -1)
  }
}

module.exports = AccountOrder
