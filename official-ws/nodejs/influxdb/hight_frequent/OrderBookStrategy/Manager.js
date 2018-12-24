
const StategyManagerBase = require('../StrategyManagerBase')
const Strategy = require('./OrderBookStrategy')

class Manager extends StategyManagerBase {
  addNewStrategy(options) {
    const s = new Strategy(options)
    this._list.push(s)
  }
}

module.exports = Manager
