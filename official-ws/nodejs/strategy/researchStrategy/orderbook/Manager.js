const StategyManager = require('../../StrategyManager')
const OrderBookStrategy = require('./OrderBookStrategy')

class Manager extends StategyManager {
  addNewStrategy(options) {
    const s = new OrderBookStrategy(options)
    this._list.push(s)
  }
}

module.exports = Manager