
class OrderManagerTest {
  constructor(options) {
    this._options = {
      ...options
    }
    this._orders = []
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
      if (o.long && o.price > minSellPrice) {
        tradeOrders.push(o)
      } else if (!o.long && o.price < maxBuyPrice) {
        tradeOrders.push(o)
      } else {
        restOrders.push(o)
      }
    })
    this._orders = restOrders
    return tradeOrders
  }
}

module.exports = OrderManagerTest
