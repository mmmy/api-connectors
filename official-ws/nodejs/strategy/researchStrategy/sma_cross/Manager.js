const StategyManager = require('../../StrategyManager')
const SmaCrossStrategy = require('./SmaCrossStrategy')

class Manager extends StategyManager {
  addNewStrategy(options) {
    const s = new SmaCrossStrategy(options)
    this._list.push(s)
  }
}

module.exports = Manager
