
const FlowDataStrategyBase = require('../FlowDataStrategyBase')

class TestFlowDataStrategy extends FlowDataStrategyBase {
  onIndicativeSettlePriceChange(delta) {
    const { upThreshold, downThreshold } = this._options
    const long = delta > upThreshold
    const short = delta < downThreshold
    if (long || short) {
      const orderObj = this.createOrder(long)
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

  filterOrder(order) {
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

module.exports = TestFlowDataStrategy
