
class OrderManagerTest {
  constructor(options, orderbook) {
    this._options = {
      ...options
    }
    this._orders = []
    this.state = {

    }
    this._ob = orderbook
    this._overOrder = 0
    this._totalOrder = 0
  }

  addAutoCancelOrder(amount, long, price, timestamp, cancelSec) {
    this._orders.push({
      amount,
      long,
      price,
      timestamp: timestamp + 1000, // 加上1s
      cancelTime: cancelSec ? (timestamp + cancelSec * 1000) : 0   // 0表示不过期
    })
  }

  addOrderUntilTrade(amount, long, price, timestamp, cancelSec) {
    const oldOrder = long ? this.getBuyOrder()[0] : this.getSellOrder()[0]
    this._totalOrder ++
    if(oldOrder) {
      this._overOrder ++
      console.log('overOrder', this._overOrder, this._overOrder / this._totalOrder)
      oldOrder.amount = amount
      oldOrder.price = price
      oldOrder.timestamp = timestamp,
      oldOrder.cancelTime = cancelSec ? (timestamp + cancelSec * 1000) : 0
    } else {
      this._orders.push({
        amount,
        long,
        firstPrice: price,
        price,
        timestamp: timestamp + 1000, // 加上1s
        cancelTime: cancelSec ? (timestamp + cancelSec * 1000) : 0   // 0表示不过期
      })
    }
  }
  // 返回已成交的 order
  watchTrade(trades) {
    const t0 = trades[0]
    const currentTime = new Date(t0.timestamp)
    this._orders = this._orders.filter(o => !o.cancelTime || o.cancelTime > currentTime) // 过滤掉已经过期的
    if (this._orders.length === 0) {
      return []
    }

    const buyPrices = []
    const sellPrices = []
    trades.forEach(t => {
      if (t.side === 'Buy') {
        buyPrices.push(t.price)
      } else {
        sellPrices.push(t.price)
      }
    })
    const maxBuyPrice = Math.max.apply(null, buyPrices)
    const minSellPrice = Math.min.apply(null, sellPrices)
    if (buyPrices.length > 0 && sellPrices.length > 0) {
      const a = 1
    }
    const orders = this._orders
    const restOrders = []     // 剩余
    const tradeOrders = []    // 已经成交的
    orders.forEach(o => {
      if ((o.long && o.price > minSellPrice) || (!o.long && o.price < maxBuyPrice)) {
        tradeOrders.push({
          ...o,
          tradeTime: currentTime,
          timeSpent: (currentTime - new Date(o.timestamp))/ 1000,
          priceDiff: o.price - o.firstPrice
        })
      } else {
        restOrders.push(o)
      }
    })
    this._orders = restOrders
    this.adjustOrderForTrade()
    return tradeOrders
  }

  getBuyOrder() {
    return this._orders.filter(o => o.long)
  }

  getSellOrder() {
    return this._orders.filter(o => !o.long)
  }

  hasBuyOrder() {
    return this.getBuyOrder().length > 0
  }

  hasSellOrder() {
    return this.getSellOrder().length > 0
  }

  adjustOrderForTrade() {
    const buyOrders = this.getBuyOrder()
    const sellOrders = this.getSellOrder()
    if (buyOrders.length > 0) {
      const bidPrice = this._ob.getTopBidPrice2(0)     // 可能有错误
      buyOrders.forEach(o => {
        o.price = Math.max(o.price, bidPrice)
      })
    }
    if (sellOrders.length > 0) {
      const askPrice = this._ob.getTopAskPrice2(0)
      sellOrders.forEach(o => {
        o.price = Math.min(o.price, askPrice)
      })
    }
  }
}

module.exports = OrderManagerTest
