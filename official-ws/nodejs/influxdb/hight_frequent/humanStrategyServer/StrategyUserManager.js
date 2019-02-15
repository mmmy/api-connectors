
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
      return {
        options,
        orders,
        positions
      }
    })
    return users
  }

  orderMarket(user, orderQty, side="Buy") {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().orderMarket(orderQty, side)
  }
  // auto_price, 获得最优的price
  orderLimit(user, orderQty, side, price, auto_price) {
    if (!price && auto_price) {
      return Promise.reject('auto_price 参数还没完完成')
    }
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().orderLimit(orderQty, side, price)
  }

  orderReduceOnlyLimit(user, orderQty, side, price) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().orderReduceOnlyLimit(orderQty, side, price)
  }

  orderStop(user, orderQty, stopPx, side) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().orderStop(orderQty, stopPx, side)
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

  closePositionMarket(user) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().closePositionMarket()
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

  getBidAsk(level) {
    const mainStrategy = this.getMainStrategy()
    if (!mainStrategy) {
      return Promise.reject('main strategy not exist')
    }
    return Promise.resolve(mainStrategy.getBidAsk(level))
  }

  getMainStrategy() {
    return this._list.filter(s => s.getOptions().main)[0]
  }
}
