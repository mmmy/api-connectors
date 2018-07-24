
class StrategyManager {
  constructor(options) {
    this._options = {
      ...options
    }
    this._list = []
  }

  applyStrategyFunc(name, args) {
    this._list.forEach(s => {
      s[name].apply(s, args)
    })
  }

  setCandleHistory() {
    this.applyStrategyFunc('setCandleHistory', arguments)
  }

  updateCandleLastHistory() {
    this.applyStrategyFunc('updateCandleLastHistory', arguments)
  }

  updateCandlesRealTime() {
    this.applyStrategyFunc('updateCandlesRealTime', arguments)
  }

  updateOrderbook() {
    this.applyStrategyFunc('updateOrderbook', arguments)
  }

  updateTradeHistoryData() {
    this.applyStrategyFunc('updateTradeHistoryData', arguments)
  }

  doStrategy() {
    this.applyStrategyFunc('doStrategy', arguments)
  }

  getStragetiesInfo() {
    const list = this._list.map(item => {
      return {
        options: item.getAllOptions(),
        trades: item.getAllTrades()
      }
    })
    return list
  }

  getStratgyById(id) {
    for (var i=0; i<this._list.length; i++) {
      var s = this._list[i]
      if (s.getStrategyId() === id) {
        return s
      }
    }
  }

  clearTradesById(id) {
    var strategy = this.getStratgyById(id)
    if (strategy) {
      strategy.clearAllTrades()
    }
  }

  updateOptionsById(id, options) {
    var strategy = this.getStratgyById(id)
    if (strategy) {
      strategy.updateOptions(options)
    }
  }

  getStratgyInfoById(id) {
    var strategy = this.getStratgyById(id)
    if (strategy) {
      return {
        options: strategy.getAllOptions(),
        trades: strategy.getAllTrades()
      }
    }
  }

  deleteStrategyById(id) {
    var strategy = this.getStratgyById(id)
    var index = this._list.indexOf(strategy)
    if (index > -1) {
      this._list.splice(index, 1)
      return true
    }
    return false
  }
}

module.exports = StrategyManager
