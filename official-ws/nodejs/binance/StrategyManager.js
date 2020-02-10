const BiananceManager = require('./Manager')

module.exports = class StrategyManager {
  constructor(options) {
    this._options = {
      ...options
    }
    this._list = []
  }

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

    const newStrategy = new BiananceManager(options)
    this._list.push(newStrategy)
    return newStrategy
  }

  getUserData(user) {
    return this.getAllUsersAccount().filter(item => item.options.user === user)[0]
  }

  getAllUsersAccount() {
    const users = this._list.map(strategy => {
      const options = strategy.getOptions()
      const accountData = strategy.getAccountData()
      const exchangeInfo = strategy.getExchangeInfo()
      // const marginHistory = strategy.getMarginHistory()
      return {
        options,
        accountData,
        exchangeInfo,
        // marginHistory,
      }
    })
    return users
  }

  closePositionMarket(user, symbol) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.closePositionMarket(symbol)
  }

  findStrategyByUser(user) {
    return this._list.filter(s => s.getOptions().user === user)[0]
  }

  deleteOrder(user, symbol, orderID) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getSignatureSDK().deleteOrder(symbol, orderID)
  }

  updateOption(user, path, value) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    strategy.updateOption(path, value)
    return Promise.resolve(strategy.getOptions())
  }

  updateOptions(user, options) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    strategy.updateOptions(options)
    return Promise.resolve(strategy.getOptions())
  }

  orderLimitWithStop(user, data) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)      
    }
    return strategy.orderLimitWithStop(data)
  }
}