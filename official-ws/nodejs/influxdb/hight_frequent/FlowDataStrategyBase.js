
const OrderBook = require('../../strategy/researchOrderbookL2/OrderBookL2Trade')
const _ = require('lodash')
const OrderManager = require('./OrderManager')
const { StrageyDB } = require('../db')
const notifyPhone = require('../../strategy/notifyPhone').notifyPhone

class FlowDataStrategyBase {
  constructor(options) {
    this._options = {
      test: true,
      database: false,
      maxCache: 200,
      bookMaxSizeBuy: 5E5,         // 50w, 这个需要做基本市场计算
      bookMaxSizeSell: 5E5,         // 50w, 这个需要做基本市场计算
      ...options
    }
    this._indicativeSettlePrice = 0
    this._ob = new OrderBook()
    this._systemTime = 0
    this._orderHistory = []
    this._orderManager = new OrderManager(this._options)

    this._lastOrderBookUpdate = new Date()
    this._lastInstrumentUpdate = new Date()
    this._orderCache = {
      longs: [],
      shorts: [],
    }
    this._currentQty = 0

    if (this._options.initCheckSystem) {
      this.initCheckSystem()
    }
    if (this._options.database) {
      this.initOrdersFromDB()
    }
    console.log({...this._options, apiKey: '', apiSecret: ''})
  }

  initOrdersFromDB() {
    StrageyDB.queryOrders(true, this._options.maxCache).then(rows => {
      const orders = rows.reverse().map(row => ({
        long: true,
        amount: row.amount,
        price: row.price
      }))
      this._orderCache.longs = orders.concat(this._orderCache.longs)
      console.log('longs form db', this._orderCache.longs.slice(-3))
    })
    StrageyDB.queryOrders(false, this._options.maxCache).then(rows => {
      const orders = rows.reverse().map(row => ({
        long: false,
        amount: row.amount,
        price: row.price
      }))
      this._orderCache.shorts = orders.concat(this._orderCache.shorts)
      console.log('shorts form db', this._orderCache.shorts.slice(-3))
    })
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
        break
      case 'position':
        this.updatePosition(json)
        break
      case 'margin':
        this.updateMargin(json)
        break
      case 'execution':
        this.updateExecution(json)
        break
      default:
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
    const { action, data } = json
    if (this._options.database && action == 'update' && data[0]) {
      StrageyDB.writePosition(this._options, data[0])
      const { currentQty } = data[0]
      if (currentQty !== undefined) {
        this._currentQty = currentQty   // 记录当前的仓位,  小于0表示 做空的
      }
    }
  }

  updateMargin(json) {
    const { action, data } = json
    const data0 = data[0]
    if (data[0].walletBalance) {
      StrageyDB.writeMargin(this._options, data[0])
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

  updateExecution(json) {
    const { data } = json
    StrageyDB.writeExecution(this._options, data)
  }

  onIndicativeSettlePriceChange(delta) {
    
  }
  // 需要平衡仓位
  createBlanceAmout(long) {
    const baseMount = this._options.amount || 100
    const positionLong = this._currentQty >= 0
    const qtyRate = Math.abs(this._currentQty) / baseMount
    // 方向相同，那么使用amout
    if (long && positionLong || (!long && !positionLong)) {
      if (qtyRate <= 1) {
        return baseMount
      } else {
        // 使用更小的相同方向挂单
        const blanceAmount = Math.round(baseMount / Math.sqrt(qtyRate))
        return blanceAmount
      }
    }
    // 如果持仓很小， 那么使用amount
    if (qtyRate <= 1) {
      return baseMount
    } else {
      // 使用更大的反向挂单
      const blanceAmount = Math.round(Math.sqrt(qtyRate) * baseMount)
      return blanceAmount
    }
    return baseMount
  }

  createOrder(long) {
    const { bookMaxSizeBuy, bookMaxSizeSell } = this._options
    const amount = this.createBlanceAmout(long)
    // bookMaxSize == 0 那么返回level1的 price
    const price = long ? this._ob.getTopBidPrice2(bookMaxSizeBuy) : this._ob.getTopAskPrice2(bookMaxSizeSell)
    const order = {
      long,
      amount,
      price: price,
      timestamp: this._systemTime,
    }
    return order
  }

  order(order) {
    this._orderHistory.push(order)

    const cb = (error) => {
      console.log('order---', order, error)
      if (this._options.database) {
        this.writeOrder(order, error)
      }
      if (this._options.notify) {
        this.notifyPhone(`${order.price} ${order.long ? 1 : -1} ${order.amount} ${error ? 'error' : ''}`)
      }
    }
    if (!this._options.test) {
      this._orderManager.addAutoCancelOrder(order.amount, order.long, order.price).then(cb).catch(cb)
    }
    
  }

  pushOrderToCache(order) {
    if (order.long) {
      this._orderCache.longs.push(order)
    } else {
      this._orderCache.shorts.push(order)
    }
  }

  removeOldOrderCache() {
    // 缓存最多保存200个
    let maxLen = 200
    if (this._orderCache.longs.length > maxLen) {
      this._orderCache.longs.shift()
    }
    if (this._orderCache.shorts.length > maxLen) {
      this._orderCache.shorts.shift()
    }
  }
  
  notifyPhone(msg) {
    notifyPhone(msg)
  }

  writeOrder(order, error, type) {
    StrageyDB.writeOrder(this._options, order, error, type)
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
        process.exit(1) // centos7 设置 systemctl 服务会自动重启
      }
    }, 5 * 60 * 1000)
  }
}

module.exports = FlowDataStrategyBase
