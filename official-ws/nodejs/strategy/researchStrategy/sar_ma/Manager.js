const StategyManager = require('../../StrategyManager')
const SarMaStrategy = require('./SarMaStrategy')

class Manager extends StategyManager {
  addNewStrategy(options) {
    const s = new SarMaStrategy(options)
    this._list.push(s)
  }
}

module.exports = Manager
