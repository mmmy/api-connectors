
var signatureSDK = require('./signatureSDK')
const notifyPhone = require('./notifyPhone').notifyPhone

const STOP = -0.002
const PROFIT = 0.003

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
  this._stopProfit = {
    retryTimes: 0,
    response: {}
  }
  this._deleteUselessOrderTimes = 0
}

Account.prototype.resetStops = function() {
  this._stopLoss.retryTimes = 0
  this._stopLoss.response = {}
  this._stopProfit.retryTimes = 0
  this._stopProfit.response = {}
}

Account.prototype.orderMarket = function(price, long, amount) {
  this._inTrading = true
  this._long = long
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
    signatureSDK.orderMarket(amount, long ? 'Buy' : 'Sell').then((json) => {
      this._inTrading = false
      this._hasPosition = true
      this._price = +json.avgPx
      this._amount = amount
      this._lastTradeTime = new Date()
      this.orderStop()
      this.orderMarketTouched()
      this.notify(`orderMarket OK  ${json.avgPx}(${price})`)

      resolve(json)
    }).catch(err => {
      this._inTrading = false
      this._hasPosition = false
      this.notify('orderMarket fail ' + err)
      reject(err)
    })
  })
}
// when orderMarket success
Account.prototype.orderStop = function() {
  var price = this._price + this._price * (this._long ? STOP : -STOP)
  price = Math.round(price * 2) / 2
  signatureSDK.orderStop(this._amount, price, this._long ? 'Sell' : 'Buy').then((json) => {
    this._stopLoss.retryTimes = 0
    // test ok
    this._stopLoss.response = json
  }).catch(err => {
    if (this._stopLoss.retryTimes < 4) {
      this.notify('OrderStop err ' + err)
      this._stopLoss.retryTimes += 1
      setTimeout(() => {
        this.orderStop()
      }, 2000)
    } else {
      this.notify('OrderStop 失败了, 请手动执行')
    }
  })
}

Account.prototype.orderMarketTouched = function() {
  var price = this._price + this._price * (this._long ? PROFIT : -PROFIT)
  price = Math.round(price * 2) / 2
  signatureSDK.orderMarketTouched(this._amount, price, this._long ? 'Sell' : 'Buy').then((json) => {
    this._stopProfit.retryTimes = 0
    // test ok
    this._stopProfit.response = json
  }).catch(err => {
    if (this._stopProfit.retryTimes < 4) {
      this.notify('orderTouched err ' + err)
      this._stopProfit.retryTimes += 1
      setTimeout(() => {
        this.orderMarketTouched()
      }, 2000)
    } else {
      this.notify('OrderTouched 失败了, 请手动执行')
    }
  })
}

Account.prototype.deleteOrder = function(orderID) {
  signatureSDK.deleteOrder(orderID).then(json => {
    this._deleteUselessOrderTimes = 0
  }).catch(err => {
    if (this._deleteUselessOrderTimes < 4) {
      this._deleteUselessOrderTimes += 1
      setTimeout(() => {
        this.deleteOrder(orderID)
      }, 2000)
    } else {
      this.notify('delete stop order 失败,请手动')
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
      resolve()
      this.notify(`win: ${isWin}, ${this._price} -> ${price} ${mock ? '模拟': '真实'}`)
    }, 100)
  })
}

Account.prototype.shouldLiquidation = function(price) {
  if (this._price && this._hasPosition && !this._inTrading) {
    var long = this._long
    var lossOrderID = this._stopLoss.response.orderID
    var profitOrderID = this._stopProfit.response.orderID
    if(lossOrderID) {
      var stopLossPrice = this._stopLoss.response.stopPx
      var triggerStopLoss = long ? (price <= stopLossPrice) : (price >= stopLossPrice)
      if (triggerStopLoss) {
        this.liquidation(price, false)
        if (profitOrderID) {
          this.deleteOrder(profitOrderID)
        }
        // 暂时无用
        return {win: false}
      }
    }
    if (profitOrderID) {
      var profitPrice = this._stopProfit.response.stopPx
      var triggerProfit = long ? (price >= profitPrice) : (price <= profitPrice)
      if (triggerProfit) {
        this.liquidation(price, false)
        if (lossOrderID) {
          this.deleteOrder(lossOrderID)
        }
        return {win: true}
      }
    }
    // 传统计算
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

module.exports = Account
