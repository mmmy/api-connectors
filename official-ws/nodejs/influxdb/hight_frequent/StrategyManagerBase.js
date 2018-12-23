
class StrategyManagerBase {
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

  listenJson() {
    this.applyStrategyFunc('listenJson', arguments)
  }

  setCandles1mHistory() {
    this.applyStrategyFunc('setCandles1mHistory', arguments)
  }

  getStragetiesInfo() {
    const list = this._list.map(item => {
      return {
        options: item.getAllOptions(),
        trades: item.getAllTrades(),
        currentPostion: item.getCurrentPostion(),
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

  updateOptionById(id, body) {
    var strategy = this.getStratgyById(id)
    if (strategy) {
      return strategy.updateOption(body.key, body.value)
    }
  }

  getStratgyInfoById(id) {
    var strategy = this.getStratgyById(id)
    if (strategy) {
      return {
        options: strategy.getAllOptions(),
        trades: strategy.getAllTrades(),
        currentPostion: strategy.getCurrentPostion(),
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

  getCandlesById(id, period) {
    var strategy = this.getStratgyById(id)
    if (strategy) {
      return strategy.getCandlesByPeriod(period)
    }
  }

  stats() {
    return this._list.map(s => {
      return s.stats()
    })
  }

  getLastBacktestPositions() {
    return this._list.map(s => {
      return s.getLastBacktestPositions()
    })
  }
}

module.exports = StrategyManagerBase
