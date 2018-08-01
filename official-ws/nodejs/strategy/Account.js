
var SignatureSDK = require('./signatureSDK')
const notifyPhone = require('./notifyPhone').notifyPhone


var winston = require('winston')

const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.File({ filename: './bitmex-account-error.log', level: 'error' })
  ]
})

function Account(options) {
  this.setOptions(options)
  this.signatureSDK = new SignatureSDK(this._options)
  this._inTrading= false
  this._hasPosition = false
  this._price = null
  this._amount = 0
  this._long = false
  this._lastTradeTime = 0
  this._stopLoss = {
    retryTimes: 0,
    // see README
    response: {},  //orderID, stopPx
  }
  this._stopLossLimit = {
    retryTimes: 0,
    response: {}
  }
  this._stopProfit = {
    retryTimes: 0,
    response: {}
  }
  this._orderLimit = {
    response: {}
  }
  this._deleteUselessOrderTimes = 0
  this._tradeHistories = []
  this._minMaxPrices = []  // 记录整个持仓时间内的最高和最低价格
  this._wins = 0
  this._fails = 0
}

Account.prototype.setOptions = function(options) {
  this._options = {
    notify: false,
    log: false,
    test: true,
    loss: '-0.3%',          // price or percentage: -5 or '-0.2%'
    profit: '0.3%',
    shortProfit: null,        // 注意shortProfit如果没有设置就用profit
    frequenceLimit: 5,       // 5分钟最多交易一次
    ...options
  }
}

Account.prototype.beforeOrderLimit = function(price) {
  this._stopLoss.retryTimes = 0
  this._stopLoss.response = {}

  this._stopLossLimit.retryTimes = 0
  this._stopLossLimit.response = {}
  
  this._stopProfit.retryTimes = 0
  this._stopProfit.response = {}
  this._deleteUselessOrderTimes = 0

  this._minMaxPrices = [price, price]
}
// 注意这个price, 应该是来源于orderbook, 而不是最新的成交价, 因为需要挂单
// price 可以在当前成交价的基础上偏移 一段价格比如 $5 $10
// 注意limit挂单之后, 不一定会成交, 成交的数量也是不定的, 故一定时间后应该取消该订单, 并查询真实的仓位
Account.prototype.orderLimit = function(price, long, amount, tradePrice/*真实价格*/) {
  this._inTrading = true
  this._long = long
  // 这点很重要, 万一没有一次性成功, 那么直接放弃这次机会, 以防, 重复下订单!!!
  this._lastTradeTime = new Date()
  this.beforeOrderLimit(tradePrice)

  if (this._options.test) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this._price = price
        this._hasPosition = true
        this._inTrading = false
        this._amount = amount
        this.notify(`account long: ${long}, ${price}`)
        resolve()
      }, 10)
    })
  }

  return new Promise((resolve, reject) => {
    this.signatureSDK.orderLimit(amount, long ? 'Buy' : 'Sell', price).then((json) => {
      this._inTrading = false
      this._hasPosition = true
      // this._price = +json.avgPx
      this._price = price
      this._amount = amount
      this._orderLimit.response = json
      // 同时设置两个止损, 一个是市价, 一个是限价, 这就看运气了
      this.orderStop()
      this.orderStopLimit()
      this.orderProfitLimitTouched()
      this.notify(`orderLimitOK${json.avgPx}(${price})`)
      console.log('Account.prototype.orderLimit 成功了')
      // 60分钟后取消没有成交的, 所以最终的_amount 是<= amount
      this.timeCancelOrderLimit(60)
      resolve(json)
    }).catch(err => {
      this._inTrading = false
      this._hasPosition = false
      var msg = 'ordLim败' + err
      this.notify(msg)
      console.log(msg)
      logger.error(msg)
      reject(err)
    })
  })
}
// when orderLimit success
// 限价止损, 手续费是负数
Account.prototype.orderStopLimit = function() {
  const { stopPrice, price } = this.getLossLimitPrices()

  this.signatureSDK.orderStopLimit(this._amount, stopPrice, this._long ? 'Sell' : 'Buy', price).then((json) => {
    this._stopLossLimit.retryTimes = 0
    // test ok
    this._stopLossLimit.response = json
  }).catch(err => {
    if (this._stopLossLimit.retryTimes < 4) {
      // this.notify('OrderStop err ' + err)
      this._stopLossLimit.retryTimes += 1
      setTimeout(() => {
        this.orderStopLimit()
      }, 2000)
    } else {
      var msg = 'ordStLimit败了手执' + err
      this.notify(msg)
      console.log(msg)
      logger.error(msg)
    }
  })
}
// 注意, 止损要用市价止损, 虽然会损失0.0075的手续费, 如果使用限价, 很有可能爆仓!
Account.prototype.orderStop = function() {
  const { marketPrice } = this.getLossLimitPrices()
  this.signatureSDK.orderStop(this._amount, marketPrice, this._long ? 'Sell' : 'Buy').then((json) => {
    this._stopLoss.retryTimes = 0
    // test ok
    this._stopLoss.response = json
  }).catch(err => {
    if (this._stopLoss.retryTimes < 4) {
      // this.notify('OrderStop err ' + err)
      this._stopLoss.retryTimes += 1
      setTimeout(() => {
        this.orderStop()
      }, 2000)
    } else {
      var msg = 'OrderStop 失败了, 请手动执行' + err
      this.notify(msg)
      console.log(msg)
      logger.error(msg)
    }
  })
}
// offset is number or string with %
Account.prototype._calcOffsetPrice = function(offset) {
  const positionPrice = this._price
  if (typeof offset == 'string' && offset.indexOf('%') > -1) {
    var offsetPrice = positionPrice * parseFloat(offset) / 100
    offsetPrice = Math.round(offsetPrice * 2) / 2 // 0.5的倍数
    return offsetPrice
  } else if (parseFloat(offset) === +offset) {
    return +offset
  } else {
    throw `不正确的stop值:${offset}`
  }
}

Account.prototype.getLossLimitPrices = function() {
  const loss = this._options.loss
  const offsetP = this._calcOffsetPrice(loss)
  const marketPrice = this._price + (this._long ? offsetP : -offsetP)
  const stopPrice = marketPrice + (this._long ? 0.5 : -0.5)
  const price = stopPrice + (this._long ? 0.5 : -0.5)
  return {
    stopPrice,
    price,
    marketPrice
  }
}

Account.prototype.getProfitLimitPrices = function() {
  let profit = this._options.profit
  // 有的时候做空需要不同的参数
  if (!this._long && this._options.shortProfit) {
    profit = this._options.shortProfit
  }
  const offsetP = this._calcOffsetPrice(profit)
  const price = this._price + (this._long ? offsetP : -offsetP)
  const stopPrice = price + (this._long ? -0.5 : 0.5)
  return {
    stopPrice,
    price
  }
}

// 止盈用限价, 虽然不一定会触发, 但是胜率比较高
Account.prototype.orderProfitLimitTouched = function() {
  // TODO: test
  const { stopPrice, price } = this.getProfitLimitPrices()
  var side = this._long ? 'Sell' : 'Buy'
  this.signatureSDK.orderProfitLimitTouched(this._amount, stopPrice, side, price).then((json) => {
    this._stopProfit.retryTimes = 0
    // test ok
    this._stopProfit.response = json
  }).catch(err => {
    if (this._stopProfit.retryTimes < 4) {
      // this.notify('orderTouched err ' + err)
      this._stopProfit.retryTimes += 1
      setTimeout(() => {
        this.orderProfitLimitTouched()
      }, 2000)
    } else {
      var msg = 'OrdTouch败请手动' + err
      this.notify(msg)
      console.log(msg)
      logger.error(msg)
    }
  })
}

// 弃用
/*
Account.prototype.profitLimitTouched = function() {
  var price = this._price + this._price * (this._long ? PROFIT : -PROFIT)
  price = Math.round(price * 2) / 2
  this.signatureSDK.profitLimitTouched(this._amount, price, this._long ? 'Sell' : 'Buy').then((json) => {
    this._stopProfit.retryTimes = 0
    // test ok
    this._stopProfit.response = json
  }).catch(err => {
    if (this._stopProfit.retryTimes < 4) {
      // this.notify('orderTouched err ' + err)
      this._stopProfit.retryTimes += 1
      setTimeout(() => {
        this.profitLimitTouched()
      }, 2000)
    } else {
      var msg = 'OrderTouched 失败了, 请手动执行' + err
      this.notify(msg)
      console.log(msg)
      logger.error(msg)
    }
  })
}
*/

Account.prototype.deleteStopOrder = function(orderID) {
  this.signatureSDK.deleteOrder(orderID).then(json => {
    this._deleteUselessOrderTimes = 0
    console.log('Account.prototype.deleteOrder OK')
  }).catch(err => {
    if (this._deleteUselessOrderTimes < 4) {
      console.log(err)
      this._deleteUselessOrderTimes += 1
      setTimeout(() => {
        this.deleteStopOrder(orderID)
      }, 2000)
    } else {
      var msg = 'delstopord败请手' + err
      this.notify(msg)
      console.log(msg)
      logger.error(msg)
    }
  })
}

Account.prototype.getLastTrade = function() {
  return this._tradeHistories[this._tradeHistories.length - 1]
}

// 触发结算了
Account.prototype.liquidation = function(price, mock) {
  this._inTrading = false
  this._hasPosition = false
  var timePassed = new Date() - this._lastTradeTime
  var minute = timePassed / (60 * 1000)
  var minute = Math.round(minute * 10) / 10
  var isWin = this._long ? (price > this._price) : (price < this._price)

  if (isWin) {
    this._wins++
  } else {
    this._fails++
  }
  
  this.notify(`win: ${isWin}, ${this._price} -> ${price} ${mock ? '模拟': '真实'} ${minute}m`)
  var earn = (this._long ? (price - this._price) : (this._price - price)) / this._price

  this._tradeHistories.push({
    startTime: this._lastTradeTime,
    endTime: new Date(),
    minute: minute,
    amount: this._amount,
    long: this._long,
    price: this._price,
    endPrice: price,
    earn: earn,
    minPrice: this._minMaxPrices[0],
    maxPrice: this._minMaxPrices[1],
    loss: this._options.loss,
    profit: (!this._long && this._options.shortProfit) || this._options.profit,
    win: isWin,
    winsFails: [this._wins, this._fails]
  })

  
  if (this._tradeHistories.length > 5000) {
    this._tradeHistories.shift()
  }
}

Account.prototype.updateMinMaxPrices = function(price) {
  this._minMaxPrices[0] = Math.min(this._minMaxPrices[0], price)
  this._minMaxPrices[1] = Math.max(this._minMaxPrices[1], price)
}
// 每次价格更新的时间都要调用
Account.prototype.shouldLiquidation = function(price) {
  if (this._price && this._hasPosition && !this._inTrading) {
    this.updateMinMaxPrices(price)
    var _lastTradeTime = this._lastTradeTime
    var long = this._long
    var lossOrderID = this._stopLoss.response.orderID
    var lossLimitOrderID = this._stopLossLimit.response.orderID
    var profitOrderID = this._stopProfit.response.orderID
    // 市价止损的 和限价止损的, 
    if(lossOrderID || lossLimitOrderID) {
      var stopLossLimitPrice = this._stopLossLimit.response.stopPx
      var triggerStopLoss = long ? (price <= stopLossLimitPrice) : (price >= stopLossLimitPrice)
      if (triggerStopLoss) {
        // 注意触发止盈止损后, 一定要取消订单, 因为3分钟内可能就已经这里就执行, 而订单可以还在, 导致重大bug
        this.cancelOrderLimitIfNeed()
        this.liquidation(price, false)
        if (profitOrderID) {
          this.deleteStopOrder(profitOrderID)
          // 四分钟后取消这两个order, 尴尬了, 因为不知道触发了哪一个.
          setTimeout(() => {
            this.deleteStopOrder(lossOrderID)
            this.deleteStopOrder(lossLimitOrderID)
          }, 4 * 60 * 1000)
        }
        // 暂时无用
        return {win: false}
      }
    }
    // 由于是限价, 所以, 价格要穿过limit价格, 才认为已经止ying平仓
    if (profitOrderID) {
      var profitPrice = this._stopProfit.response.price
      var triggerProfit = long ? (price > profitPrice) : (price < profitPrice)
      if (triggerProfit) {
        // 同上
        this.cancelOrderLimitIfNeed()
        this.liquidation(price, false)
        if (lossOrderID) {
          this.deleteStopOrder(lossOrderID)
        }
        if (lossLimitOrderID) {
          this.deleteStopOrder(lossLimitOrderID)
        }
        return {win: true}
      }
    }
    // for test
    const profitPrices = this.getProfitLimitPrices()
    const lossPrices = this.getLossLimitPrices()
    const lossed = this._long ? (price <= lossPrices.stopPrice) : (price >= lossPrices.stopPrice)
    const wined = this._long ? (price > profitPrices.price) : (price < profitPrices.price)

    if (lossed || wined) {
      // console.log(`模拟stop, win: ${wined}`)
      this.liquidation(wined ? profitPrices.price : lossPrices.marketPrice, true)
      return {win: wined}
    }
    return false
  }
  return false
}

Account.prototype.isReadyToOrder = function() {
  // 5分钟之内最多一次
  var frequenceLimit = (new Date() - this._lastTradeTime) > this._options.frequenceLimit * 60 * 1000
  return !this._inTrading && !this._hasPosition && frequenceLimit
}

Account.prototype.isReadyToLiquidation = function() {
  return !this._inTrading && this._hasPosition
}

Account.prototype.notify = function(msg) {
  if (this._options.log) {
    console.log(msg)
  }
  if (this._options.notify) {
    notifyPhone(msg)
  }
}
// 注意挂单后应该 在 N 分钟内完成, 否则应该取消, minute 不能超过5分钟
// 这个功能是否需要, 应该放到配置中, 目前的策略, 应该放长一点
Account.prototype.timeCancelOrderLimit = function(minute = 60) {
  var cancelTimes = 0
  var orderID = this._orderLimit.response.orderID
  var cancelFunc = () => {
    this.signatureSDK.deleteOrder(orderID).then(json => {
      this.notify('取消了orderLimit,请看position')
    }).catch(err => {
      if (cancelTimes < 4) {
        cancelTimes ++
        setTimeout(() => {
          cancelFunc()
        }, 2000)
      } else {
        this.notify('取消orderLimit失败,请看position')
      }
    })
  }
  
  setTimeout(() => {
    cancelFunc()
  }, minute * 60 * 1000)
}

Account.prototype.cancelOrderLimitIfNeed = function() {
  if (new Date() - this._lastTradeTime < 3 * 60 * 1000) {
    this.timeCancelOrderLimit(0)
  }
}

Account.prototype.getRealPosition = function() {
  return new Promise((resolve, reject) => {
    this.signatureSDK.getPosition().then(json => {
      resolve(json)
    }).catch(err => {
      reject(err)
    })
  })
}

Account.prototype.getOptions = function() {
  return this._options
}

Account.prototype.clearAllTrades = function() {
  this._tradeHistories = []
}

module.exports = Account
