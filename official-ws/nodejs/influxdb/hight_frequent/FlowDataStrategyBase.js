
const OrderBook = require('../../strategy/researchOrderbookL2/OrderBookL2Trade')
const AccountOrder = require('./AccountOrder')
const AccountPosition = require('./AccountPosition')
const Candles = require('../../strategy/Candles')
const _ = require('lodash')
const OrderManager = require('./OrderManager')
const OrderManagerTest = require('./OrderManagerTest')
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
      balanceAmount: true,
      maxAmountCount: 1000,            // 最大多少倍基础仓位
      stochRsi: {
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      },
      ...options
    }
    this._isRunning = true
    this._indicativeSettlePrice = 0
    this._ispList = []                    //[{timestamp, price}]
    this._lastTradeTime = 0
    this._ob = new OrderBook()
    this._accountOrder = new AccountOrder()
    this._accountPosition = new AccountPosition()
    this._systemTime = 0
    this._orderHistory = []
    this._orderManager = !this._options.test && new OrderManager(this._options, this._ob, this._accountPosition, this._accountOrder)
    this._orderManagerTest = new OrderManagerTest(this._options, this._ob)      // 回测

    this._lastOrderBookUpdate = new Date()
    this._lastInstrumentUpdate = new Date()
    this._orderCache = {
      longs: [],
      shorts: [],
    }
    this._currentQty = 0

    this._candles1m = new Candles()            // 1分钟K线

    if (this._options.initCheckSystem) {
      this.initCheckSystem()
    }
    if (this._options.database) {
      this.initOrdersFromDB()
    }
    console.log({ ...this._options, apiKey: '', apiSecret: '' })
    this._drawBacks = []                                           // 回测回撤分析
    this._maxDrawBack = 0

    this._volume24h = 0
    this._volumePerMinute = 0
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
    let options = {
      ...this._options
    }
    delete options.apiKey
    delete options.apiSecret
    return options
  }

  listenJson(json) {
    const { table, action, data } = json
    switch (table) {
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
      case 'tradeBin1m':
        this.updateTradeBin1m(json)
        break
      case 'order':
        this.updateAccountOrder(json)
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
    this.onUpdateOrderBook()
  }

  onUpdateOrderBook() {

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
    // 有bug this._currentQty 還沒有初始化
    if (this.isReduceOnly() && this._currentQty < this._options.amount && this._isRunning === true) {
      this.deleteOrderAll().then(() => {
        this._isRunning = false
        this.closePosition().then(() => {
          this.notifyPhone('position=0')
        })
      })
    }
    this._accountPosition.update(json)
    // console.log('++++++++++++++++++++++++++++ position')
    // console.log(this._accountPosition._data)
  }

  updateMargin(json) {
    const { action, data } = json
    const data0 = data[0]
    if (data[0].walletBalance && this._options.database) {
      StrageyDB.writeMargin(this._options, data[0])
    }
  }

  updateTrade(json) {
    const { data } = json
    this._systemTime = new Date(data[0].timestamp)
    if (this._options.test) {
      // 获得挂单交易成功了的
      const tradeOrders = this._orderManagerTest.watchTrade(data)
      if (this._options.test) {
        tradeOrders.forEach(order => {
          this.backtest(order)
        })
      }
    }
    this.onTrade(json)
  }

  onTrade(json) {

  }

  updateInstrument(json) {
    const { data } = json
    const data0 = data[0]
    if (data0) {
      this._systemTime = new Date(data0.timestamp)
    }
    // 记录交易额
    if (data0.volume24h) {
      this._volume24h = data0.volume24h
      this._volumePerMinute = data0.volume24h / 1440
    }
    //indicativeSettlePrice
    if (data0.indicativeSettlePrice) {
      const delta = this._indicativeSettlePrice ? data0.indicativeSettlePrice - this._indicativeSettlePrice : 0
      this._indicativeSettlePrice = data0.indicativeSettlePrice
      this._ispList.push({
        timestamp: data0.timestamp,
        price: data0.indicativeSettlePrice
      })
      this.removeOldIsp()

      this.onIndicativeSettlePriceChange(delta)
    }
    // 暂时无用
    if (!this.isReduceOnly()) {
      this._isRunning = true
    }
  }

  updateExecution(json) {
    const { data } = json
    if (this._options.database) {
      StrageyDB.writeExecution(this._options, data)
    }
  }

  onIndicativeSettlePriceChange(delta) {

  }
  // 需要平衡仓位
  createBalanceAmout(long) {
    const baseMount = this._options.amount || 100
    const positionLong = this._currentQty >= 0
    const qtyRate = Math.abs(this._currentQty) / baseMount
    // 方向相同，那么使用amout
    if (long && positionLong || (!long && !positionLong)) {
      if (qtyRate <= 1) {
        return baseMount
      } else {
        return baseMount
        // 使用更小的相同方向挂单, 效果影响很小的
        // const balanceAmount = Math.round(baseMount / (qtyRate ** (1/3)))
        // return balanceAmount
      }
    }
    // 如果持仓很小， 那么使用amount
    if (qtyRate <= 1) {
      return baseMount
    } else {
      // 使用更大的反向挂单
      const balanceAmount = Math.round((qtyRate ** (1 / 2)) * baseMount)
      return balanceAmount
    }
    return baseMount
  }

  createCloseOrOpenAmount(long) {
    if (this._currentQty === 0) {
      return this._options.amount
    } else {
      const isLongPostion = this._currentQty > 0
      const sameDirection = (isLongPostion && long) || (!isLongPostion && !long)
      // 方向相同可以加仓,但是要考虑是否有利
      if (sameDirection) {
        return 0
      }
      return Math.abs(this._currentQty) + this._options.amount
    }

  }

  createOrder(long) {
    const { bookMaxSizeBuy, bookMaxSizeSell, balanceAmount, closeOrOpen } = this._options
    let amount = balanceAmount ? this.createBalanceAmout(long) : this._options.amount
    if (closeOrOpen) {
      amount = this.createCloseOrOpenAmount(long)
    }
    // bookMaxSize == 0 那么返回level1的 price
    // price 可能为undefined
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
    const isLongPostion = this._currentQty > 0
    const sameDirection = (isLongPostion && order.long) || (!isLongPostion && !order.long)
    if (sameDirection && (Math.abs(this._currentQty) >= this._options.amount * this._options.maxAmountCount)) {
      return
    }
    this._lastTradeTime = order.timestamp
    const cb = (error) => {
      console.log('order---', order.long, order.price, order.amount, error)
      if (this._options.database) {
        this.writeOrder(order, error)
      }
      if (this._options.notify) {
        this.notifyPhone(`${order.price} ${order.long ? 1 : -1} ${order.amount} ${error ? 'error' : ''}`)
      }
    }
    if (!this._options.test) {
      this._orderManager.addAutoCancelOrder(order.amount, order.long, order.price).then(cb).catch(cb)
    } else {
      this._orderManagerTest.addOrderUntilTrade(order.amount, order.long, order.price, order.timestamp)
    }
  }
  // 市价全平
  closePosition() {
    return new Promise((resove, reject) => {
      this._orderManager.closePositionMarket().then(resove).catch(() => {
        setTimeout(() => {
          this._orderManager.closePositionMarket().then(resove).catch(reject)
        }, 10 * 1000)
      })
    })
  }

  deleteOrderAll() {
    return this._orderManager.deleteOrderAll()
  }

  orderReduce() {

  }

  // 开始将仓位变为慢慢变为0
  isReduceOnly() {
    return typeof this._options.isReduceOnly === 'function' ? this._options.isReduceOnly(this) : this._options.isReduceOnly
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

  removeOldIsp() {
    let maxLen = 200
    if (this._ispList.length > maxLen) {
      this._ispList.shift()
    }
  }

  notifyPhone(msg) {
    notifyPhone(msg)
  }

  writeOrder(order, error, type) {
    if (this._options.database) {
      StrageyDB.writeOrder(this._options, order, error, type)
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

  backtest(order) {
    // init at first
    if (!this._positionList) {
      this._total = 1
      this._positionList = [{
        ...order,
        profit: 0,
        openPositions: [order],
        drawBack: 0,
      }]
    } else {
      this._total += 1
      const positions = this._positionList
      const preP = positions[positions.length - 1]
      if (_.uniq(preP.openPositions.map(t => t.long)) > 1) {
        throw '存在多个方向'
      }
      if (preP.openPositions.length === 0) {
        positions.push({
          ...order,
          profit: preP.profit,
          openPositions: [order],
          drawBack: preP.drawBack,
        })
      } else {
        const opLong = preP.openPositions[0].long
        const t = order
        if (!(t.long ^ opLong)) {                   // 同或运算， 同为true, 或者同为false, side相同
          positions.push({
            ...order,
            profit: preP.profit,
            openPositions: preP.openPositions.concat([t]),
            drawBack: preP.drawBack
          })
        } else {
          let tm = t.amount
          let newProfit = 0
          const preOp = preP.openPositions
          let preOpRest = []
          for (let i = 0; i < preOp.length; i++) {
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
          let back = preP.drawBack + newProfit
          back = Math.min(0, back)
          positions.push({
            ...order,
            profit: preP.profit + newProfit,
            openPositions: preOpRest,
            drawBack: back
          })
        }
      }

      const positionLen = positions.length
      const lastPosition = positions[positionLen - 1]
      this._currentQty = lastPosition.openPositions.reduce((q, p) => (q + p.amount), 0)
      this._maxDrawBack = Math.min(lastPosition.drawBack, this._maxDrawBack)
      console.log(this._maxDrawBack)
    }
    this._currentQty = 0
    let lastP = this._positionList[this._positionList.length - 1]
    if (lastP && lastP.openPositions.length > 0) {
      const isLong = lastP.openPositions[0].long
      this._currentQty = lastP.openPositions.reduce((q, p) => (q + p.amount), 0) * (isLong ? 1 : -1)
    }
    if (this._maxtQty === undefined) {
      this._maxtQty = 0
    }
    this._maxtQty = Math.max(this._maxtQty, Math.abs(this._currentQty))
    // console.log(this._maxtQty)

  }

  getLastBacktestPositions() {
    return {
      id: this._options.id,
      positions: this._positionList
    }
  }
  // 1分钟K线数据
  setCandles1mHistory(list) {
    this._candles1m.setHistoryData(list)
  }

  updateTradeBin1m(json) {
    this._candles1m.updateLastHistory(json.data[0])
    // const {rsiPeriod, stochasticPeriod, kPeriod, dPeriod} = this._options.stochRsi
    // this._candles1m.calcStochRsiSignal(rsiPeriod, stochasticPeriod, kPeriod, dPeriod, this._systemTime)

  }

  updateAccountOrder(json) {
    this._accountOrder.update(json)
    // console.log('BTM: account order update', json.action, '[ordStatus]', json.data[0] && json.data[0].ordStatus, '[ordType]', json.data[0] && json.data[0].ordType)
    // console.log(json)
    // console.log(this._accountOrder)
  }

  hasPosition() {
    return this._currentQty !== 0
  }

  getAccountPosition() {
    return this._accountPosition.getPosition()
  }

  getAccountOrders() {
    return this._accountOrder.getCurrentOrders()
  }

  getOrderManager() {
    return this._orderManager
  }
}

module.exports = FlowDataStrategyBase
