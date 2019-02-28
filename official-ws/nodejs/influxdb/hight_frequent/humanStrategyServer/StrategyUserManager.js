
const createStratey = require('./createStratey')

module.exports = class StrategyUserManager {
  constructor(options) {
    this._options = {
      ...options
    }
    this._list = []
  }
  /**
   * requires:
  {
    user,
    apiKey,
    apiSecret,
  }
   */
  addStrategy(options) {
    if (!options.user) {
      console.error('user is required')
      return
    }
    const users = this._list.map(strategy => strategy.getOptions().user)
    console.log(users)
    if (users.indexOf(options.user) > -1) {
      console.error('user exist')
      return
    }
    const newStrategy = createStratey(options)
    this._list.push(newStrategy)
    return newStrategy
  }

  getAllUsersAccount() {
    const users = this._list.map(strategy => {
      const options = strategy.getOptions()
      const orders = strategy.getAccountAllOrders()
      const positions = strategy.getAccountAllPositions()
      const margin = strategy.getAccountMargin()
      return {
        options,
        orders,
        margin,
        positions,
      }
    })
    return users
  }

  orderMarket(user, symbol, orderQty, side="Buy") {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().orderMarket(symbol, orderQty, side)
  }
  // auto_price, 获得最优的price
  orderLimit(user, symbol, orderQty, side, price, auto_price) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    if (auto_price) {
      const mainStrategy = this.getMainStrategy()
      if (!mainStrategy) {
        return Promise.reject('main strategy not exist')
      }
      const quote = mainStrategy.getLatestQuote(symbol)
      if (!quote) {
        return Promise.reject(`${symbol}'s quote not exit`)
      }
      price = side == 'Buy' ? quote.bidPrice : quote.askPrice
    }
    return strategy.getOrderManager().getSignatureSDK().orderLimit(symbol, orderQty, side, price)
  }

  orderReduceOnlyLimit(user, symbol, orderQty, side, price) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().orderReduceOnlyLimit(symbol, orderQty, side, price)
  }

  orderStop(user, symbol, orderQty, stopPx, side) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().orderStop(symbol, orderQty, stopPx, side)
  }

  deleteOrder(user, orderID) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().deleteOrder(orderID)
  }

  deleteOrderAll(user) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().deleteOrderAll()
  }

  closePositionMarket(user, symbol) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().closePositionMarket(symbol)
  }

  findStrategyByUser(user) {
    return this._list.filter(s => s.getOptions().user === user)[0]
  }

  updateOrder(user, params) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().updateOrder(params)
  }
  // todo: 此接口还有问题
  getBidAsk(level) {
    const mainStrategy = this.getMainStrategy()
    if (!mainStrategy) {
      return Promise.reject('main strategy not exist')
    }
    return Promise.resolve(mainStrategy.getBidAsk(level))
  }

  getAllLatestQuote() {
    const mainStrategy = this.getMainStrategy()
    if (!mainStrategy) {
      return Promise.reject('main strategy not exist')
    }
    return Promise.resolve(mainStrategy.getAllLatestQuote())
  }

  getMainStrategy() {
    return this._list.filter(s => s.getOptions().main)[0]
  }

  getAccountMargin() {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return Promise.resolve(strategy.getAccountMargin())
  }
}
