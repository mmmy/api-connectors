
const FlowDataStrategyBase = require('../FlowDataStrategyBase')

class StochRsiStrategy extends FlowDataStrategyBase {
  onIndicativeSettlePriceChange(delta) {
    return
    const { backLen, minTradeInterval } = this._options
    const prices = this._ispList.slice(-backLen).map(item => item.price)
    if (prices.length !== backLen) {
      return
    }
    const latestPrice = prices[backLen - 1] * 0.618 + prices[backLen - 2] * 0.382
    const lastMaxPrice = Math.max.apply(null, prices.slice(0, backLen - 1))
    const lastMinPrice = Math.min.apply(null, prices.slice(0, backLen - 1))

    const long = latestPrice > lastMaxPrice
    const short = latestPrice < lastMinPrice
    if (long || short) {
      const orderObj = this.createOrder(long)
      if (new Date(orderObj.timestamp) - new Date(this._lastTradeTime) < minTradeInterval * 1000) {
        // console.log('minTradeInterval out')
        return
      }
      if (this.filterOrder(orderObj)) {
        this.order(orderObj)
      } else {
        // console.log('order is filtered', orderObj)
        if (this._options.database) {
          this.writeOrder(orderObj, null, 'filtered')
        }
        if (this._options.notify) {
          this.notifyPhone(`filtered ${orderObj.price} ${orderObj.long ? 1 : -1} ${orderObj.amount}`)
        }
      }

      this.pushOrderToCache(orderObj)
    }
  }

  filterOrder(order) { // 这个效果不好
    return true
    // const interTime = 10 * 60 * 1000
    const cache = order.long ? this._orderCache.longs : this._orderCache.shorts
    //取最近的n个, 需要回测
    const lastestOrders = cache.slice(-40)
    if (lastestOrders.length > 5) {
      const prices = lastestOrders.map(o => o.price)
      // 买入： 不应该超过高点
      if (order.long) {
        if (order.price >= Math.max.apply(null, prices)) {
          return false
        }
      } else {  // 卖出： 不应该低于低点
        if (order.price <= Math.min.apply(null, prices)) {
          return false
        }
      }
    }
    return true
  }
}

module.exports = StochRsiStrategy
