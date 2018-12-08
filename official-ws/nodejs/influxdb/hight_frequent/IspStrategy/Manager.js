
const StategyManagerBase = require('../StrategyManagerBase')
const Strategy = require('./IspStrategy')

class Manager extends StategyManagerBase {
  addNewStrategy(options) {
    const s = new Strategy(options)
    this._list.push(s)
  }
}

module.exports = Manager
