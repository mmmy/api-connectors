const StategyManager = require('../../StrategyManager')
const SuijiStrategy = require('./SuijiStrategy')

class Manager extends StategyManager {
  addNewStrategy(options) {
    const s = new SuijiStrategy(options)
    this._list.push(s)
  }
}

module.exports = Manager