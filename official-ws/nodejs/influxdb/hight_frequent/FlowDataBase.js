// 通用版本
// const OrderBook = require('../../strategy/researchOrderbookL2/OrderBookL2Trade')
const AccountOrder = require('./AccountOrder')
const AccountPosition = require('./AccountPosition')
const AccountQuote = require('./AccountQuote')
const Candles = require('../../strategy/Candles')
const _ = require('lodash')
const OrderManager = require('./OrderManager')
const OrderManagerTest = require('./OrderManagerTest')
const { StrageyDB } = require('../db')
const notifyPhone = require('../../strategy/notifyPhone').notifyPhone

class FlowDataBase {
  constructor(options) {
    this._options = {
      test: true,
      database: false,
      maxCache: 200,
      stochRsi: {
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      },
      ...options
    }
    this._indicativeSettlePrice = 0
    this._ispList = []                    //[{timestamp, price}]
    this._accountOrder = new AccountOrder()
    this._accountPosition = new AccountPosition()
    this._accountQuote = new AccountQuote()
    this._systemTime = 0
    this._orderManager = !this._options.test && new OrderManager(this._options, this._ob, this._accountPosition, this._accountOrder)
    this._orderManagerTest = new OrderManagerTest(this._options, this._ob)      // 回测

    this._lastInstrumentUpdate = new Date()

    this._currentQty = 0

    this._candles1m = new Candles()            // 1分钟K线

    if (this._options.initCheckSystem) {
      this.initCheckSystem()
    }
    // if (this._options.database) {
    //   this.initOrdersFromDB()
    // }
    console.log({ ...this._options, apiKey: '', apiSecret: '' })

    this._volume24h = 0
    this._volumePerMinute = 0
  }

  getOptions() {
    let options = {
      ...this._options
    }
    delete options.apiKey
    delete options.apiSecret
    return options
  }

  listenJson(json, symbol) {
    const { table, action, data } = json
    switch (table) {
      case 'orderBookL2_25':
        // this._lastOrderBookUpdate = new Date()
        this.updateOrderBook(json, symbol)
        break
      case 'trade':
        this.updateTrade(json, symbol)
        break
      case 'instrument':
        // this._lastInstrumentUpdate = new Date()
        this.updateInstrument(json, symbol)
        break
      case 'position':
        this.updatePosition(json, symbol)
        break
      case 'margin':
        this.updateMargin(json, symbol)
        break
      case 'execution':
        // this.updateExecution(json, symbol)
        break
      case 'tradeBin1m':
        this.updateTradeBin1m(json, symbol)
        break
      case 'order':
        this.updateAccountOrder(json, symbol)
        break
      case 'quote':
        this.updateQuote(json, symbol)
        break
      default:
        break
    }
  }

  updateOrderBook(json, symbol) {
    const { action } = json
    if (this._options.test && action === 'partial') {
      json.keys = ['symbol', 'id', 'side']
      json.types = {
        symbol: 'symbol',
        id: 'long',
        side: 'symbol',
        size: 'long',
        price: 'float'
      }
    }
    // TODO: update margin
    // this._ob.update(json)
    this.onUpdateOrderBook()
  }

  onUpdateOrderBook() {

  }

  updatePosition(json, symbol) {
    this._accountPosition.update(json, symbol)
    // console.log('++++++++++++++++++++++++++++ position')
    // console.log(this._accountPosition._data)
  }

  updateQuote(json, symbol) {
    this._accountQuote.update(json, symbol)
  }

  updateMargin(json) {
    const { action, data } = json
    // const data0 = data[0]
    if (data[0].walletBalance && this._options.database) {
      StrageyDB.writeMargin(this._options, data[0])
    }
  }

  updateTrade(json, symbol) {
    const { data } = json
    this._systemTime = new Date(data[0].timestamp)
    this.onTrade(json, symbol)
  }

  onTrade(json, symbol) {

  }

  updateInstrument(json, symbol) {
    const { data } = json
    const data0 = data[0]
    if (data0) {
      this._systemTime = new Date(data0.timestamp)
    }
  }

  updateExecution(json, symbol) {
    const { data } = json
    // if (this._options.database) {
    //   StrageyDB.writeExecution(this._options, data)
    // }
  }

  onIndicativeSettlePriceChange(delta) {

  }

  createOrder(long) {
    const { bookMaxSizeBuy, bookMaxSizeSell, balanceAmount, closeOrOpen } = this._options
    let amount = this._options.amount

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
    if (now - this._lastInstrumentUpdate > time) {
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

  // 1分钟K线数据
  setCandles1mHistory(list) {
    this._candles1m.setHistoryData(list)
  }

  updateTradeBin1m(json) {
    this._candles1m.updateLastHistory(json.data[0])
    // const {rsiPeriod, stochasticPeriod, kPeriod, dPeriod} = this._options.stochRsi
    // this._candles1m.calcStochRsiSignal(rsiPeriod, stochasticPeriod, kPeriod, dPeriod, this._systemTime)

  }

  updateAccountOrder(json, symbol) {
    this._accountOrder.update(json, symbol)
    // console.log('BTM: account order update', json.action, '[ordStatus]', json.data[0] && json.data[0].ordStatus, '[ordType]', json.data[0] && json.data[0].ordType)
    // console.log(json)
    // console.log(this._accountOrder)
  }

  hasPosition() {
    return this._currentQty !== 0
  }

  getAccountPosition(symbol) {
    return this._accountPosition.getPosition(symbol)
  }

  getAccountAllPositions() {
    return this._accountPosition.getAllPositions()
  }

  getAccountOrders(symbol) {
    return this._accountOrder.getCurrentOrders(symbol)
  }

  getAccountAllOrders() {
    return this._accountOrder.getAllOrders()
  }

  getOrderManager() {
    return this._orderManager
  }

  getBidAsk(level = 1) {
    return this._ob.getDepth(level)
  }

  getAllLatestQuote() {
    return this._accountQuote.getAllLatestQuote()
  }

  getLatestQuote(symbol) {
    return this._accountQuote.getLatestQuote(symbol)
  }
}

module.exports = FlowDataBase
