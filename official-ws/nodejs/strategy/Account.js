const notifyPhone = require('./notifyPhone').notifyPhone

function Account() {
  this._inTrading= false
  this._hasPosition = false
  this._price = null
  this._long = false
}

Account.prototype.trade = function(price, long) {
  this._inTrading = true
  this._long = long
  setTimeout(() => {
    this._price = price
    this._hasPosition = true
    this._inTrading = false
    notifyPhone('account long:', long , price)
  }, 2000)
}

Account.prototype.liquidation = function(price) {
  this._inTrading = true
  setTimeout(()=>{
    this._hasPosition = false
    this._inTrading = false
    isWin = this._long ? (price > this._price) : (this._price < price)
    notifyPhone('win:', isWin, this._price , price)
  }, 2000)
}

Account.prototype.shouldLiquidation = function(price) {
  if (this._price && this._hasPosition && !this._inTrading) {
    var earn = this._long ? (price - this._price) : (this._price - price)
    var earnRate = earn / this._price
    if (earnRate > 0.3 || earnRate < -0.2) {
      this.liquidation(price)
      return { win: earnRate > 0 }
    }
  }
  return false
}

Account.prototype.isReadyToOrder = function() {
  return !this._inTrading && !this._hasPosition
}

Account.prototype.isReadyToLiquidation = function() {
  return !this._inTrading && this._hasPosition
}

module.exports = Account