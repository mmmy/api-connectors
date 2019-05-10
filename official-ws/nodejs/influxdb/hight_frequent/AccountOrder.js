const DeltaParse = require('../../libForBrowser')
// ordStatus: 'Canceled' 取消的order 还在 _data中
class AccountOrder {
  constructor(options) {
    this._options = {
      ...options
    }
    this._CLIENT = {
      _data: {
        order: {
        }
      },
      _keys: {
        order: ["orderID"]
      }
    }
  }
  
  update(json, symbol) {
    symbol = symbol || 'XBTUSD'
    // 由于首次可能不是action=partial, 导致永远不能更新的bug
    if (!this._CLIENT._data.order[symbol]) {
      this._CLIENT._data.order[symbol] = []
    }
    DeltaParse.onAction(json.action, json.table, symbol, this._CLIENT, json)
    // console.log('account order test', symbol, this.getOrders(symbol))
  }

  getOrders(symbol = 'XBTUSD') {
     return (this._CLIENT._data.order[symbol] || []).filter(item => ['Canceled', 'Filled'].indexOf(item.ordStatus) === -1)
  }

  hasOrder(symbol = 'XBTUSD') {
    return this.getOrders(symbol).length > 0
  }

  getLimitOrders(long, symbol = 'XBTUSD') {
    return this.getOrders(symbol).filter(o => o.side === (long ? 'Buy' : 'Sell'))
  }
  // 默认是触发后平仓的限价止损
  getStopOrders(symbol = 'XBTUSD') {
    return this.getOrders(symbol).filter(o => o.ordType === 'Stop' && o.execInst.indexOf('Close') > -1)
  }
  // 可以开仓的止损， 追涨杀跌使用
  getStopOpenMarketOrders(symbol = 'XBTUSD') {
    return this.getOrders(symbol).filter(o => o.ordType === 'Stop' && o.execInst.indexOf('Close') === -1)
  }

  getReduceOnlyOrders(symbol = 'XBTUSD') {
    return this.getOrders(symbol).filter(o => o.execInst && o.execInst.indexOf('ReduceOnly') > -1)
  }

  getCurrentOrders(symbol = 'XBTUSD') {
    return this.getOrders(symbol)
  }

  getAllOrders() {
    let allOrders = []
    for (let key in this._CLIENT._data.order) {
      let orders = this.getOrders(key)
      if (orders.length > 0) {
        allOrders = allOrders.concat(orders)
      }
    }
    return allOrders
  }
}

module.exports = AccountOrder
