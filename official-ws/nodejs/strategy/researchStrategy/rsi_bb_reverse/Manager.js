const StategyManager = require('../../StrategyManager')
const RsiBBStrategy = require('./RsiBBStrategy')

class Manager extends StategyManager {
  addNewStrategy(options) {
    const s = new RsiBBStrategy(options)
    this._list.push(s)
  }
}

module.exports = Manager
