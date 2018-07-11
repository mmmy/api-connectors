const notifyPhone = require('./notifyPhone').notifyPhone

function Account(notify) {
  this._inTrading= false
  this._hasPosition = false
  this._price = null
  this._long = false
  this._notify = notify
}

Account.prototype.trade = function(price, long) {
  this._inTrading = true
  this._long = long
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      this._price = price
      this._hasPosition = true
      this._inTrading = false
      resolve()
      this.notify(`account long: ${long}, ${price}`)
    }, 1000)
  })
}

Account.prototype.liquidation = function(price) {
  this._inTrading = true
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      this._hasPosition = false
      this._inTrading = false
      isWin = this._long ? (price > this._price) : (this._price < price)
      resolve()
      this.notify(`win: ${isWin}, ${this._price} -> ${price}`)
    }, 1000)
  })
}

Account.prototype.shouldLiquidation = function(price) {
  if (this._price && this._hasPosition && !this._inTrading) {
    var earn = this._long ? (price - this._price) : (this._price - price)
    var earnRate = earn / this._price
    if (earnRate > 0.003 || earnRate < -0.002) {
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