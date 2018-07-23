
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
}

module.exports = StrategyManager