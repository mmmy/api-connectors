
const OrderBook = require('../../strategy/researchOrderbookL2/OrderBookL2Trade')
const _ = require('lodash')
const OrderManager = require('./OrderManager')
const { StrageyDB } = require('../db')
const notifyPhone = require('../../strategy/notifyPhone')

class FlowDataStrategyBase {
  constructor(options) {
    this._options = {
      test: true,
      database: false,
      ...options
    }
    this._indicativeSettlePrice = 0
    this._ob = new OrderBook()
    this._systemTime = 0
    this._orderHistory = []
    this._orderManager = new OrderManager(this._options)

    this._lastOrderBookUpdate = new Date()
    this._lastInstrumentUpdate = new Date()

    if (this._options.initCheckSystem) {
      this.initCheckSystem()
    }
  }

  getOptions() {
    return this._options
  }

  listenJson(json) {
    const { table, action, data } = json
    switch(table) {
      case 'orderBookL2_25':
        this._lastOrderBookUpdate = new Date()
        this.updateOrderBook(json)
        break
      case 'trade':
        this.updateTrade(json)
        break
      case 'instrument':
        this._lastInstrumentUpdate = new Date()
        this.updateInstrument(json)
      case 'position':
        this.updatePosition(json)
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

  updatePosition(json) {
    const { data } = json
    if (this._options.database && data[0]) {
      StrageyDB.writePosition(this._options, data[0])
    }
  }

  updateTrade(json) {
    
  }

  updateInstrument(json) {
    const { data } = json
    const data0 = data[0]
    if (data0) {
      this._systemTime = new Date(data0.timestamp)
    }
    if (data0.indicativeSettlePrice) {
      const delta = this._indicativeSettlePrice ? data0.indicativeSettlePrice - this._indicativeSettlePrice : 0
      this._indicativeSettlePrice = data0.indicativeSettlePrice
      this.onIndicativeSettlePriceChange(delta)
    }
  }

  onIndicativeSettlePriceChange(delta) {
    
  }

  order(long, amount=100) {
    const price = long ? this._ob.getTopBidPrice() : this._ob.getTopAskPrice()
    const order = {
      long,
      amount,
      price: price,
      timestamp: this._systemTime,
    }
    this._orderHistory.push(order)
    if (!this._options.test) {
      this._orderManager.addAutoCancelOrder(amount, long, price)
    }
    if (this._options.database) {
      StrageyDB.writeOrder(this._options, order)
    }
    console.log('order---', order)
    if (this._options.notify) {
      notifyPhone(`${order.price} ${order.long ? 1 : -1} ${order.amount}`)
    }
  }

  stats() {
    let total = this._orderHistory.length
    let longs = 0
    const positions = []
    for (let i=0; i<total; i++) {
      const t = this._orderHistory[i]
      if (positions.length === 0) {
        positions.push({
          profit: 0,
          timestamp: t.timestamp,
          openPositions: [t]
        })
      } else {
        const preP = positions[positions.length - 1]
        // console.log('preP', preP.openPositions.length)
        if (_.uniq(preP.openPositions.map(t => t.long)) > 1) {
          throw '存在多个方向'
        }
        if (preP.openPositions.length === 0) {
          positions.push({
            profit: preP.profit,
            timestamp: t.timestamp,
            openPositions: [t]
          })
        } else {
          const opLong = preP.openPositions[0].long
          if (!(t.long ^ opLong)) {                   // 同或运算， 同为true, 或者同为false, side相同
            positions.push({
              profit: preP.profit,
              timestamp: t.timestamp,
              openPositions: preP.openPositions.concat([t])
            })
          } else {
            let tm = t.amount
            let newProfit = 0
            const preOp = preP.openPositions
            let preOpRest = []
            for (let i=0; i<preOp.length; i++) {
              const item = preOp[i]
              const reduceAmount = Math.min(tm, item.amount)
              newProfit += reduceAmount * (t.price - item.price) / item.price * (t.long ? -1 : 1)
              tm -= reduceAmount
              if (tm <= 0) {
                // 计算剩余部分
                if (item.amount > reduceAmount) {
                  preOpRest.push({
                    ...item,
                    amount: item.amount - reduceAmount
                  })
                }
                preOpRest = preOpRest.concat(preOp.slice(i + 1))
                break
              }
            }
            if (tm > 0) {
              if (preOpRest.length > 0) {
                throw '还有剩余? 算法错误, 请检查'
              }
              preOpRest.push({
                ...t,
                amount: tm
              })
            }
            positions.push({
              profit: preP.profit + newProfit,
              timestamp: t.timestamp,
              openPositions: preOpRest
            })
          }
        }
      }
      if (t.long) {
        longs ++
      }
    }
    return {
      id: this._options.id,
      total,
      longs,
      positions,
    }
  }

  checkAlive() {
    let time = 10 * 60 * 1000
    let now = new Date()
    if (now - this._lastOrderBookUpdate > time || now - this._lastInstrumentUpdate > time) {
      return false
    }
    return true
  }

  initCheckSystem() {
    this._interval = setInterval(() => {
      if (!this.checkAlive()) {
        notifyPhone('data not flow error')
      }
    }, 5 * 60 * 1000)
  }
}

module.exports = FlowDataStrategyBase
