
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
      const orders = strategy.getAccountOrders()
      const position = strategy.getAccountPosition()
      return {
        options,
        orders,
        position
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
    return new Promise.reject('此接口还没完完成')
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
}
