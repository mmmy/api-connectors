
class BackTestManager {
  constructor() {
    this._list = []
  }

  addNewStrategy(s) {
    this._list.push(s)
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

  readBar() {
    this.applyStrategyFunc('readBar', arguments)
  }

  getAllTrades(trades) {
    return this._list.map((s, i) => {
      return {
        id: s._options.id,
        index: i,
        trades: trades ? s.getTrades() : undefined,
        statistic: s.statistic()
      }
    })
  }
}

module.exports = BackTestManager
