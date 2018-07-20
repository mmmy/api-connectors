var fs = require('fs')

const fileName = `minute-stratege-${+new Date()}.log`

function loggerToFile(message) {
  fs.appendFile(fileName, message)
}

function consoleRed(msg) {
  console.log('\x1b[31m%s\x1b[0m', msg)
}

function consoleGreen(msg) {
  console.log('\x1b[42m%s\x1b[0m', msg)
}

class Account {
  constructor(option) {
    this._option = {
      earn: 1,
      loss: 4,
      notify: false,
      ...option,
    }
    this._price = null
    this._amout = 0
    this._long = true
    this._lastTradeTime = 0
    this._inTrading = false
    this._hasPosition = false

    this._wins = 0
    this._fails = 0
  }

  orderLimit(price, long, amount) {
    this._inTrading = true
    this._long = long
    this._lastTradeTime = new Date()
    this.resetStops()
    // test
    return new Promise((resolve) => {
      setTimeout(() => {
        this._price = price
        this._hasPosition = true
        this._inTrading = false
        this._amout = amount
        // this.notify(`account long: ${long}, ${price}`)
        resolve()
      }, 2000)
    })
  }

  resetStops() {

  }

  liquidation(price, win) {
    this._inTrading = true
    
    var time = new Date()
    var timeStr = time.toLocaleString()
    var sec = (time - this._lastTradeTime) / 1000
    sec = Math.round(sec)

    this._hasPosition = false
    this._inTrading = false
    if (win) {
      this._wins += 1
      var msg = `${this._wins} / ${this._fails}}T ${timeStr} long: ${this._long} [${this._price} -> ${price}] ${sec}s`
      loggerToFile(msg)
      consoleGreen(msg)
    } else {
      this._fails += 1
      var msg = `${this._wins} / ${this._fails}}F ${timeStr} long: ${this._long} [${this._price} -> ${price}] ${sec}s`
      loggerToFile(msg)
      consoleRed(msg)
    }
  }

  shouldLiquidation(price) {
    if (this._price && this._hasPosition && !this._inTrading) {
      var long = this._long
      var lossPrice = this._price + this._option.loss * (long ? -1 : 1)
      var earnPrice = this._price + this._option.earn * (long ? 1 : -1)
      var triggerStopLoss = long ? (price <= lossPrice) : (price >= lossPrice)
      var triggerProfit = long ? (price > earnPrice) : (price < earnPrice)
      
      if (triggerStopLoss || triggerProfit) {
        this.liquidation(price, triggerProfit)
      }
    }
  }

  isReadyToOrder() {
      // 5分钟之内最多一次
    // var frequenceLimit = (new Date() - this._lastTradeTime) > 5 * 60 * 1000
    return !this._inTrading && !this._hasPosition // && frequenceLimit
  }

  hasPosition() {
    return this._hasPosition
  }

  isLong() {
    return this._long
  }
}

module.exports = Account
