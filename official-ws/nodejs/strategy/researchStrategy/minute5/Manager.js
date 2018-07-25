const StategyManager = require('../../StrategyManager')
const MinuteStrategy = require('./MinuteStrategy')

class Manager extends StategyManager {
  addNewStrategy(options) {
    const s = new MinuteStrategy(options)
    this._list.push(s)
  }
}

module.exports = Manager