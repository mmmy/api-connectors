
const FlowDataStrategyBase = require('../FlowDataStrategyBase')
const { statisticPositions } = require('../../util')
const fs = require('fs')
const path = require('path')

function recordAfterP(list, trades, seconds = 60) {
  if (trades.length === 0) {
    return
  }
  const d0 = trades[0]
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    const timeAfter = new Date(d0.timestamp) - new Date(item.t)
    if (timeAfter < seconds * 1000 && timeAfter > 0) {
      item.afterPs = item.afterPs.concat(trades)
    }
  }
}

class OrderBookStrategy extends FlowDataStrategyBase {
  constructor(options) {
    super(options)
    this.initInterval()
    // for research
    this._buys = []
    this._sells = []
    this._tradeCount = 0
    this._sellBookCount = 0
    this._buyBookCount = 0
    this.AFTER_SECONDS = 180
    this._orderManager._openPosition({
      long: true,
      short: false,
      ask0: 4000,
      bid0: 3000,
      timestamp: new Date()
    })
  }

  _canculateOrderBookSignal(json) {
    const { table, action, data } = json
    const volumePerMinute = this._volumePerMinute

    let bid0 = this._ob.getTopBidPrice2(0)
    let ask0 = this._ob.getTopAskPrice2(0)
    let bid1 = this._ob.getTopBidPrice2(volumePerMinute / 60 * 0.382)   // volumePerMinute / 60 / 2
    let ask1 = this._ob.getTopAskPrice2(volumePerMinute / 60 * 0.382)
    // let bid2 = this._ob.getTopBidPrice2(1E5)
    // let ask2 = this._ob.getTopAskPrice2(1E5)
    let bid3 = this._ob.getTopBidPrice2(volumePerMinute / 2 * 0.5)       // 0.5 - 0.618
    let ask3 = this._ob.getTopAskPrice2(volumePerMinute / 2 * 0.5)
    const d0 = data[0]
    let long = false
    let short = false

    if ((ask0 - bid0 === 0.5) && (bid0 - bid3) === 0 && (ask1 - ask0) > 0.5) {
      long = true
    } else if ((ask0 - bid0 === 0.5) && (ask0 - ask3) === 0 && (bid0 - bid1) > 0.5) {
      short = true
    }
    return {
      long,
      short,
      bid0,
      ask0,
      timestamp: d0.timestamp,
    }
  }

  onTrade(json) {
    // const { minTradeInterval } = this._options
    // const systemTime = new Date(this._systemTime)
    // if (systemTime - new Date(this._lastTradeTime) < minTradeInterval * 1000) {
    //   return
    // }
    const signal = this._canculateOrderBookSignal(json)

    if (this._options.test) {
      this.research(signal, json)
    } else {
      this._orderManager.listenOrderBookSignal(signal)
    }
    // if (signal.long) {
    //   const orderObj = this.createOrder(true)
    //   this.order(orderObj)
    // }
    // if ((ask0 - bid0 === 0.5) && (ask0 - ask3) === 0 && (bid0 - bid1) > 1) {
    //   const orderObj = this.createOrder(false)
    //   this.order(orderObj)
    // }
  }

  onIndicativeSettlePriceChange(delta) {
  }

  // 定时任务
  initInterval() {
    this._interval = setInterval(() => {
      this.autoOrderStop()
    }, 3000)
  }
  // 定时检查账户是否安全，没有止损委托
  autoOrderStop() {
    if (this._options.autoOrderStop) {
      this._orderManager.orderStopIfNeed(8)
    }
  }

  isLowVolume() {
    const volumePerMinute = this._volumePerMinute
    const candle1m = this._candles1m.getCandles(false)
    const lastCandle = candle1m[candle1m.length - 1]
    const len = 5
    const last10Candles = candle1m.slice(-len)
    const last10CandlesPV = last10Candles.reduce((sum, c) => sum + c.volume, 0) / len
    return (lastCandle.volume < volumePerMinute * 1.5) && (last10CandlesPV < volumePerMinute * 1.5)
  }

  research(signal, json) {
    const researchLong = true
    const researchShort = false
    const { bid0, ask0 } = signal
    this._tradeCount++
    const { data } = json
    const d0 = data[0]
    if (signal.long && researchLong) {
      const len = this._buys.length
      const lastB = this._buys[len - 1]
      if (len === 0 || (lastB.price !== bid0 && (new Date(d0.timestamp) - new Date(lastB.t)) > this.AFTER_SECONDS * 1000)) {
        if (this.isLowVolume()) {
          this._buys.push({
            side: 1,
            p: bid0,
            t: d0.timestamp,
            afterPs: [],
          })
        }
      }
      this._buyBookCount++
      console.log('buy', this._buyBookCount, this._buyBookCount / this._tradeCount, bid0, 'count', this._buys.length, d0.timestamp)
    } else if (signal.short && researchShort) {
      const len = this._sells.length
      const lastS = this._sells[len - 1]
      if (len === 0 || (lastS.price !== ask0 && (new Date(d0.timestamp) - new Date(lastS.t)) > this.AFTER_SECONDS * 1000)) {
        if (this.isLowVolume()) {
          this._sells.push({
            side: -1,
            p: ask0,
            t: d0.timestamp,
            afterPs: [],
          })
        }
      }
      this._sellBookCount++
      console.log('sell', this._sellBookCount, this._sellBookCount / this._tradeCount, ask0, 'count', this._sells.length, d0.timestamp)
    }
    if (this._buys.length > 0) {
      recordAfterP(this._buys, data.filter(d => d.side === 'Sell'), this.AFTER_SECONDS)
    }
    if (this._sells.length > 0) {
      recordAfterP(this._sells, data.filter(d => d.side === 'Buy'), this.AFTER_SECONDS)
    }
  }

  statistic() {
    const buys = statisticPositions(this._buys)
    const sells = statisticPositions(this._sells)
    return {
      buys,
      sells
    }
  }

  stop() {
    clearInterval(this._interval)
    this._interval = null
  }

  saveToFiles() {
    const buyPath = `./temp/${this._options.id}_buys.json`
    const sellPath = `./temp/${this._options.id}_sells.json`
    if (this._buys.length > 0) {
      fs.writeFileSync(path.join(__dirname, buyPath), JSON.stringify(this._buys))
      console.log(buyPath, '已保存')
    }
    if (this._sells.length > 0) {
      fs.writeFileSync(path.join(__dirname, sellPath), JSON.stringify(this._sells))
      console.log(sellPath, '已保存')
    }
  }
}

module.exports = OrderBookStrategy
