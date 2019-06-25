
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

  getUserData(user) {
    return this.getAllUsersAccount().filter(item => item.options.user === user)
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

  orderMarket(user, symbol, orderQty, side = "Buy") {
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

  orderStop(user, symbol, orderQty, stopPx, side, offset, stop_close) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    if (!stopPx && offset) {
      offset = +offset
      const mainStrategy = this.getMainStrategy()
      if (!mainStrategy) {
        return Promise.reject('main strategy not exist')
      }
      const quote = mainStrategy.getLatestQuote(symbol)
      if (!quote) {
        return Promise.reject(`${symbol}'s quote not exit`)
      }
      stopPx = side == 'Buy' ? (quote.askPrice + offset) : (quote.bidPrice - offset)
    }
    return strategy.getOrderManager().getSignatureSDK().orderStop(symbol, orderQty, stopPx, side, stop_close)
  }
  // 市价止盈
  orderMarketIfTouched(user, symbol, orderQty, stopPx, side, stop_close) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().orderMarketTouched(symbol, orderQty, stopPx, side)
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

  getAllInstrument() {
    const mainStrategy = this.getMainStrategy()
    if (!mainStrategy) {
      return Promise.reject('main strategy not exist')
    }
    return Promise.resolve(mainStrategy.getAllInstrument())
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

  changeLeverage(user, symbol, leverage) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.getOrderManager().getSignatureSDK().changeLeverage(symbol, leverage)
  }
  // 止损开仓 自动跟踪前一根线的高低点, 5m
  updateOptions(user, options) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    strategy.updateOptions(options)
    return Promise.resolve(strategy.getOptions())
  }
  // period: 5m 1h
  orderStopOrderByLastCandle(user, symbol, period, qty, side) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return strategy.orderStopOrderByLastCandle(symbol, period, qty, side)
  }

  getAutoOrderSignalList(user) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return Promise.resolve(strategy.getAutoOrderSignalList())
  }

  addAutoOrderSignal(user, auto_order) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return Promise.resolve(strategy.addAutoOrderSignal(auto_order))
  }

  updateAutoOrderSignal(user, index, auto_order) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return Promise.resolve(strategy.updateAutoOrderSignal(index, auto_order))
  }

  deleteAutoOrderSignal(user, index) {
    const strategy = this.findStrategyByUser(user)
    if (!strategy) {
      return Promise.reject(`${user} strategy not exist`)
    }
    return Promise.resolve(strategy.deleteAutoOrderSignal(index))
  }

  getAllIndicatorValues() {
    const mainStrategy = this.getMainStrategy()
    return Promise.resolve(mainStrategy.getAllIndicatorValues())
  }
}
