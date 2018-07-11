
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
  this._retryTouchedTimes = 0
  this._retryStopTimes = 0
}

Account.prototype.orderMarket = function(price, long, amount) {
  this._inTrading = true
  this._long = long
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

      this.orderStop()
      this.orderMarketTouched()
      this.notify('orderMarket OK ' + json.avgPx)

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
    this._retryStopTimes = 0
  }).catch(err => {
    this.notify('!! OrderStop err ' + err)
    if (this._retryStopTimes < 4) {
      this._retryStopTimes += 1
      setTimeout(() => {
        this.orderStop()
      }, 2000)
    }
  })
}

Account.prototype.orderMarketTouched = function() {
  var price = this._price + this._price * (this._long ? PROFIT : -PROFIT)
  price = Math.round(price * 2) / 2
  signatureSDK.orderMarketTouched(this._amount, price, this._long ? 'Sell' : 'Buy').then((json) => {
    this._retryTouchedTimes = 0
  }).catch(err => {
    this.notify('!! orderMarketTouched err ' + err)
    if (this._retryTouchedTimes < 4) {
      this._retryTouchedTimes += 1
      setTimeout(() => {
        this.orderMarketTouched()
      }, 2000)
    }
  })
}

Account.prototype.liquidation = function(price) {
  this._inTrading = true
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      this._hasPosition = false
      this._inTrading = false
      isWin = this._long ? (price > this._price) : (price < this._price)
      resolve()
      this.notify(`win: ${isWin}, ${this._price} -> ${price}`)
    }, 1000)
  })
}

Account.prototype.shouldLiquidation = function(price) {
  if (this._price && this._hasPosition && !this._inTrading) {
    var earn = this._long ? (price - this._price) : (this._price - price)
    var earnRate = earn / this._price
    if (earnRate > PROFIT || earnRate < STOP) {
      this.liquidation(price)
      return { win: earnRate > 0 }
    }
    return false
  }
  return false
}

Account.prototype.isReadyToOrder = function() {
  return !this._inTrading && !this._hasPosition
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