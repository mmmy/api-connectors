
var signatureSDK = require('./signatureSDK')
const notifyPhone = require('./notifyPhone').notifyPhone


var winston = require('winston')

const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.File({ filename: './bitmex-account-error.log', level: 'error' })
  ]
})


const STOP = -0.002
const PROFIT = 0.0025

function Account(notify, test) {
  this._inTrading= false
  this._hasPosition = false
  this._price = null
  this._amount = 0
  this._long = false
  this._notify = notify
  this._test = test
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
}

Account.prototype.resetStops = function() {
  this._stopLoss.retryTimes = 0
  this._stopLoss.response = {}

  this._stopLossLimit.retryTimes = 0
  this._stopLossLimit.response = {}
  
  this._stopProfit.retryTimes = 0
  this._stopProfit.response = {}
  this._deleteUselessOrderTimes = 0
}
// 注意这个price, 应该是来源于orderbook, 而不是最新的成交价, 因为需要挂单
// 注意limit挂单之后, 不一定会成交, 成交的数量也是不定的, 故一定时间后应该取消该订单, 并查询真实的仓位
Account.prototype.orderLimit = function(price, long, amount) {
  this._inTrading = true
  this._long = long
  // 这点很重要, 万一没有一次性成功, 那么直接放弃这次机会, 以防, 重复下订单!!!
  this._lastTradeTime = new Date()
  this.resetStops()
  if (this._test) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this._price = price
        this._hasPosition = true
        this._inTrading = false
        this.notify(`account long: ${long}, ${price}`)
        resolve()
      }, 1000)
    })
  }

  return new Promise((resolve, reject) => {
    signatureSDK.orderLimit(amount, long ? 'Buy' : 'Sell', price).then((json) => {
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
      // 三分钟后取消没有成交的, 所以最终的_amount 是<= amount
      this.timeCancelOrderLimit(3)
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
  var stopPrice = this._price + this._price * (this._long ? STOP : -STOP)
  stopPrice = Math.round(price * 2) / 2
  var price = stopPrice + (this._long ? 0.5 : -0.5)
  signatureSDK.orderStopLimit(this._amount, stopPrice, this._long ? 'Sell' : 'Buy', price).then((json) => {
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
  var price = this._price + this._price * (this._long ? STOP : -STOP)
  price = Math.round(price * 2) / 2 + (this._long ? -0.5 : 0.5)
  signatureSDK.orderStop(this._amount, price, this._long ? 'Sell' : 'Buy').then((json) => {
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
// 止盈用限价, 虽然不一定会触发, 但是胜率比较高
Account.prototype.orderProfitLimitTouched = function() {
  var stopPrice = this._price + this._price * (this._long ? PROFIT : -PROFIT)
  stopPrice = Math.round(stopPrice * 2) / 2
  var price = stopPrice + (this._long ? 0.5 : -0.5)
  var side = this._long ? 'Sell' : 'Buy'
  signatureSDK.orderProfitLimitTouched(this._amount, stopPrice, side, price).then((json) => {
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
Account.prototype.profitLimitTouched = function() {
  var price = this._price + this._price * (this._long ? PROFIT : -PROFIT)
  price = Math.round(price * 2) / 2
  signatureSDK.profitLimitTouched(this._amount, price, this._long ? 'Sell' : 'Buy').then((json) => {
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

Account.prototype.deleteStopOrder = function(orderID) {
  signatureSDK.deleteOrder(orderID).then(json => {
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

Account.prototype.liquidation = function(price, mock) {
  this._inTrading = true
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      this._hasPosition = false
      this._inTrading = false
      isWin = this._long ? (price > this._price) : (price < this._price)
      this.notify(`win: ${isWin}, ${this._price} -> ${price} ${mock ? '模拟': '真实'}`)
      resolve()
    }, 100)
  })
}

Account.prototype.shouldLiquidation = function(price) {
  if (this._price && this._hasPosition && !this._inTrading) {
    var long = this._long
    var lossOrderID = this._stopLoss.response.orderID
    var profitOrderID = this._stopProfit.response.orderID
    // 市价止损的
    if(lossOrderID) {
      var stopLossPrice = this._stopLoss.response.stopPx
      var triggerStopLoss = long ? (price <= stopLossPrice) : (price >= stopLossPrice)
      if (triggerStopLoss) {
        this.liquidation(price, false)
        if (profitOrderID) {
          this.deleteStopOrder(profitOrderID)
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
        this.liquidation(price, false)
        if (lossOrderID) {
          this.deleteStopOrder(lossOrderID)
        }
        return {win: true}
      }
    }
    // 传统计算, 不准确了.
    var earn = this._long ? (price - this._price) : (this._price - price)
    var earnRate = earn / this._price
    if (earnRate > PROFIT || earnRate < STOP) {
      // this.liquidation(price, true)
      console.log(`模拟stop, win: ${earnRate > 0}`)
      return { win: earnRate > 0 }
    }
    return false
  }
  return false
}

Account.prototype.isReadyToOrder = function() {
  // 五分钟之内最多一次
  var frequenceLimit = (new Date() - this._lastTradeTime) > 5 * 60 * 1000
  return !this._inTrading && !this._hasPosition && frequenceLimit
}

Account.prototype.isReadyToLiquidation = function() {
  return !this._inTrading && this._hasPosition
}

Account.prototype.notify = function(msg) {
  if (this._notify) {
    notifyPhone(msg)
  }
}
// 注意挂单后应该 在 N 分钟内完成, 否则应该取消, minute 不能超过5分钟
Account.prototype.timeCancelOrderLimit = function(minute = 3) {
  var cancelTimes = 0
  var orderID = this._orderLimit.response.orderID
  var cancelFunc = () => {
    signatureSDK.deleteOrder(orderID).then(json => {
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
  }, minute * 60 * 1000)
}

Account.prototype.getRealPosition = function() {
  return new Promise((resolve, reject) => {
    signatureSDK.getPosition().then(json => {
      resolve(json)
    }).catch(err => {
      reject(err)
    })
  })
}

module.exports = Account
