
const OrderBook = require('../strategy/researchOrderbookL2/OrderBookL2Trade')

class FlowDataManager {
  constructor(options) {
    this._options = {
      ...options
    }
    this._indicativeSettlePrice = 0
    this._ob = new OrderBook()
    this._systemTime = 0
    this._orderHistory = []
  }

  listenJson(json) {
    const { table, action, data } = json
    switch(table) {
      case 'orderBookL2_25':
        this.updateOrderBook(json)
        break
      case 'trade':
        this.updateTrade(json)
        break
      case 'instrument':
        this.updateInstrument(json)
        break
    }
  }

  updateOrderBook(json) {
    const { action } = json
    if (action === 'partial') {
      json.keys = ['symbol', 'id', 'side']
      json.types = {
        symbol: 'symbol',
        id: 'long',
        side: 'symbol',
        size: 'long',
        price: 'float'
      }
    }
    
    this._ob.update(json)
  }

  updateTrade(json) {

  }

  updateInstrument(json) {
    const { data } = json
    const data0 = data[0]
    if (data0.indicativeSettlePrice) {
      const delta = this._indicativeSettlePrice ? data0.indicativeSettlePrice - this._indicativeSettlePrice : 0
      this._indicativeSettlePrice = data0.indicativeSettlePrice
      this._systemTime = new Date(data0.timestamp)
      this.onIndicativeSettlePriceChange(delta)
    }
  }

  onIndicativeSettlePriceChange(delta) {
    if (delta > 3) {
      this.order(true)
    } else if (delta < -3) {
      this.order(false)
    }
  }

  order(long, amount=1) {
    const price = long ? this._ob.getTopBidPrice() : this._ob.getTopAskPrice()
    const trade = {
      long,
      amount,
      price: price,
      timestamp: this._systemTime,
    }
    this._orderHistory.push(trade)
  }

  stats() {
    let total = this._orderHistory.length
    let longs = 0
    let profit = 0
    for (let i=0; i<total; i++) {
      const t = this._orderHistory[i]
      if (t.long) {
        longs ++
      }
      profit += (t.amount * t.price) * (t.long ? 1 : -1)
    }
    return {
      total,
      longs,
      profit
    }
  }
}

module.exports = FlowDataManager
