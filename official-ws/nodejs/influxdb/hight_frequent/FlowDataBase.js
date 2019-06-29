// 通用版本
// const OrderBook = require('../../strategy/researchOrderbookL2/OrderBookL2Trade')
const AccountOrder = require('./AccountOrder')
const AccountPosition = require('./AccountPosition')
const AccountQuote = require('./AccountQuote')
const AccountInstrument = require('./AccountInstrument')
const AccountMargin = require('./AccountMargin')
const AccountOrderBook = require('./AccountOrderBook')
const BitmexCandleManager = require('./BitmexCandleManager')
const Candles = require('../../strategy/Candles')
const _ = require('lodash')
const OrderManager = require('./OrderManager')
const OrderManagerTest = require('./OrderManagerTest')
const { StrageyDB } = require('../db')
const notifyPhone = require('../../strategy/notifyPhone').notifyPhone

const watchSignal = require('./watchSignal')

const precisionMap = {
  'XBTUSD': 0.5,
  'ETHUSD': 0.05,
}

class FlowDataBase {
  constructor(options) {
    this._options = _.merge({
      test: true,
      database: false,
      maxCache: 200,
      stochRsi: {
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      },
      autoUpdateStopOpenMarketOrder: false,
      autoUpdateStopOpenMarketOrder1h: true,

      autoCloseStochOverTrade5m: false,
      autoCloseStochOverTrade_2575_1h: false,
      autoCloseStochOverTrade_3070_1h: false,
      autoCloseStochDivergence5m: false,
      autoCloseStochDivergence1h: false,
      autoCloseRsiOverTrade5m: false,
      autoCloseRsiOverTrade1h: false,

      autoCloseMacdDivergence5m: false,
      autoCloseRsiDivergence5m: false,
      autoCloseMacdDivergence1h: false,
      autoCloseRsiDivergence1h: false,

      botRsiDivergence: {
        botId: '__rsi_divergence_bot',
        symbols: ['XBTUSD'],
        on: false,
        len: 12,
        highlowLen: 80,
        divergenceLen: 80,
        theshold_bottom: 25,
        theshold_top: 80,
        enableLong: true,
        enableShort: false,
        open_size: 1,
        lowVol: true,
        highBoDong: true,

      }
    }, options)

    this._indicativeSettlePrice = 0
    this._ispList = []                    //[{timestamp, price}]
    this._accountOrder = new AccountOrder()
    this._accountPosition = new AccountPosition()
    this._accountQuote = new AccountQuote()
    this._accountInstrument = new AccountInstrument()
    this._accountMargin = new AccountMargin()
    this._accountOrderBook = new AccountOrderBook()
    this._systemTime = 0
    this._orderManager = !this._options.test && new OrderManager(this._options, this._ob, this._accountPosition, this._accountOrder)
    this._orderManagerTest = new OrderManagerTest(this._options, this._ob)      // 回测

    this._lastDataUpdate = new Date()

    this._currentQty = 0

    this._candles1d = new BitmexCandleManager()
    this._candles1h = new BitmexCandleManager()
    this._candles5m = new BitmexCandleManager()

    if (this._options.initCheckSystem) {
      this.initCheckSystem()
    }
    // if (this._options.database) {
    //   this.initOrdersFromDB()
    // }
    console.log({ ...this._options, apiKey: '', apiSecret: '' })

    this._volume24h = 0
    this._volumePerMinute = 0

    this._autoOrderSignals = [
      {
        amount: 1000,
        min_interval: 8,// 重复触发至少间隔时间8小时
        order_method: "stopMarket1h",
        remain_times: 0,
        side: "Buy",
        signal_name: "stochOverTrade_3070_1h",
        signal_operator: "long",
        signal_value: "",
        symbol: "XBTUSD",
      }
    ]
    this._indicatorCache = {}
  }

  getOptions() {
    let options = {
      ...this._options
    }
    delete options.apiKey
    delete options.apiSecret
    return options
  }

  updateOptions(options) {
    this._options = _.merge(this._options, options)
    return this.getOptions()
  }

  updateOption(path, value) {
    _.set(this._options, path, value)
    return this.getOptions()
  }

  listenJson(json, symbol) {
    const { table, action, data } = json
    switch (table) {
      case 'orderBookL2_25':
        // this._lastDataUpdate = new Date()
        // this._lastOrderBookUpdate = new Date()
        this.updateOrderBook(json, symbol)
        break
      case 'trade':
        // this._lastDataUpdate = new Date()
        this.updateTrade(json, symbol)
        break
      case 'instrument':
        this._lastDataUpdate = new Date()
        this.updateInstrument(json, symbol)
        break
      case 'position':
        this.updatePosition(json, symbol)
        break
      case 'margin':
        this.updateMargin(json, symbol)
        break
      case 'tradeBin5m':
        this.updateTradeBin5m(json, symbol)
        break
      case 'execution':
        // this.updateExecution(json, symbol)
        break
      case 'tradeBin1h':
        this.updateTradeBin1h(json, symbol)
        break
      case 'tradeBin1d':
        this.updateTradeBin1d(json, symbol)
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
    this._accountOrderBook.update(json, symbol)
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
    this._accountMargin.update(json)
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
    this._accountInstrument.update(json, symbol)
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
  closePosition(symbol) {
    return new Promise((resove, reject) => {
      this._orderManager.closePositionMarket(symbol).then(resove).catch(() => {
        setTimeout(() => {
          this._orderManager.closePositionMarket(symbol).then(resove).catch(reject)
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
    if (now - this._lastDataUpdate > time) {
      return false
    }
    return true
  }

  checkCandles(symbol) {
    const timestamp5m = this._candles5m.getHistoryCandle(symbol).timestamp
    const timestamp1h = this._candles1h.getHistoryCandle(symbol).timestamp
    const timestamp1d = this._candles1d.getHistoryCandle(symbol).timestamp
    const now = new Date()
    const gap5m = now - new Date(timestamp5m)
    const gap1h = now - new Date(timestamp1h)
    const gap1d = now - new Date(timestamp1d)
    if (gap5m > 6 * 60000) {
      return `${symbol} 5m candle timestamp wrong ${gap5m / 60000} 分钟`
    }
    if (gap1h > 3700 * 1000) {
      return `${symbol} 1h candle timestamp wrong ${gap1h / 60000} 分钟`
    }
    if (gap1d > 25 * 3600 * 1000) {
      return `${symbol} 1d candle timestamp wrong ${gap1d / 3600000} 小时`
    }
    return false
  }

  initCheckSystem() {
    this._interval = setInterval(() => {
      if (!this.checkAlive()) {
        notifyPhone('data not flow error')
        setTimeout(() => {
          process.exit(1) // centos7 设置 systemctl 服务会自动重启
        }, 10 * 1000)
      }
      const checkXBTCandleMsg = this.checkCandles('XBTUSD')
      const checkETHCandleMsg = this.checkCandles('ETHUSD')
      if (checkXBTCandleMsg) {
        notifyPhone(checkXBTCandleMsg)
      }
      if (checkETHCandleMsg) {
        notifyPhone(checkETHCandleMsg)
      }
    }, 5 * 60 * 1000)
  }

  // period : 1d 1h 5m
  setCandlesHistory(list, symbol, period) {
    const candleManager = this.getCandleManager(period)
    candleManager.setHistoryData(list, symbol)
    this.caculateIndicatorAndCache(symbol, period)
  }

  updateTradeBin1d(json, symbol) {
    const candleManager = this._candles1d
    candleManager.update(json.data[0], symbol)
    if (this._options.autoUpdateStopOpenMarketOrder1d) {
      this.updateStopOpenOrderByLastCandle(symbol, candleManager)
    }
    // high1 low1
    const highlow1Signal = candleManager.highlow1Signal(symbol)
    if (highlow1Signal.high1) {
      notifyPhone(`${symbol} 1d high 1`)
      watchSignal(this, symbol, 'break1h', 'high1')
    } else if (highlow1Signal.low1) {
      notifyPhone(`${symbol} 1d low 1`)
      watchSignal(this, symbol, 'break1h', 'low1')
    }

    // stoch
    const stochOverTradeSignal_2575 = this.candleManager.stochOverTradeSignal(symbol, 9, 3, 25, 75)
    if (stochOverTradeSignal_2575.long) {
      if (this._options.autoCloseStochOverTrade_2575_1d) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'stochOverTrade_2575_1d', 'long')
    } else if (stochOverTradeSignal_2575.short) {
      if (this._options.autoCloseStochOverTrade_2575_1d) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'stochOverTrade_2575_1d', 'short')
    }

    this.caculateIndicatorAndCache(symbol, '1d')
  }

  updateTradeBin1h(json, symbol) {
    this._candles1h.update(json.data[0], symbol)
    if (this._options.autoUpdateStopOpenMarketOrder1h) {
      this.updateStopOpenOrderByLastCandle(symbol, this._candles1h)
    }
    // high1 low1
    const highlow1Signal = this._candles1h.highlow1Signal(symbol)
    if (highlow1Signal.high1) {
      // notifyPhone(`${symbol} 1h high 1`)
      watchSignal(this, symbol, 'break1h', 'high1')
    } else if (highlow1Signal.low1) {
      // notifyPhone(`${symbol} 1h low 1`)
      watchSignal(this, symbol, 'break1h', 'low1')
    }
    // RSI over trade signal
    const rsiOverTradeSignal = this._candles1h.rsiOverTradeSignal(symbol, 8, 20, 80)
    const rsiOverTradeSignal_2575 = this._candles1h.rsiOverTradeSignal(symbol, 8, 25, 75)
    const rsiOverTradeSignal_3070 = this._candles1h.rsiOverTradeSignal(symbol, 8, 30, 70)

    if (rsiOverTradeSignal.long) {
      if (this._options.autoCloseRsiOverTrade1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade1h', 'long')

      // notifyPhone(`${symbol} 1h rsiOverTradeSignal Long`)
    } else if (rsiOverTradeSignal.short) {
      if (this._options.autoCloseRsiOverTrade1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade1h', 'short')

      // notifyPhone(`${symbol} 1h rsiOverTradeSignal Short`)
    }
    if (rsiOverTradeSignal_2575.long) {
      if (this._options.autoCloseRsiOverTrade_2575_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade_2575_1h', 'long')

      // notifyPhone(`${symbol} 1h rsiOverTradeSignal_2575 Long`)
    } else if (rsiOverTradeSignal_2575.short) {
      if (this._options.autoCloseRsiOverTrade_2575_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade_2575_1h', 'short')

      // notifyPhone(`${symbol} 1h rsiOverTradeSignal_2575 Short`)
    }
    if (rsiOverTradeSignal_3070.long) {
      if (this._options.autoCloseRsiOverTrade_3070_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade_3070_1h', 'long')

      // notifyPhone(`${symbol} 1h rsiOverTradeSignal_3070 Long`)
    } else if (rsiOverTradeSignal_3070.short) {
      if (this._options.autoCloseRsiOverTrade_3070_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade_3070_1h', 'short')

      // notifyPhone(`${symbol} 1h rsiOverTradeSignal_3070 Short`)
    }

    // RSI divergence signal
    const rsiDivergenceSignal = this._candles1h.rsiDivergenceSignal(symbol, 8, 24, 24, 20, 80)
    const rsiDivergenceSignal_2575 = this._candles1h.rsiDivergenceSignal(symbol, 8, 24, 24, 25, 75)
    const rsiDivergenceSignal_3070 = this._candles1h.rsiDivergenceSignal(symbol, 8, 24, 24, 30, 70)
    if (rsiDivergenceSignal.long) {
      if (this._options.autoCloseRsiDivergence1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence1h', 'long')

      // notifyPhone(`${symbol} 1h rsiDivergenceSignal Long`)
    } else if (rsiDivergenceSignal.short) {
      if (this._options.autoCloseRsiDivergence1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence1h', 'short')

      // notifyPhone(`${symbol} 1h rsiDivergenceSignal short`)
    }
    if (rsiDivergenceSignal_2575.long) {
      if (this._options.autoCloseRsiDivergence_2575_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence_2575_1h', 'long')

      // notifyPhone(`${symbol} 1h rsiDivergenceSignal_2575 Long`)
    } else if (rsiDivergenceSignal_2575.short) {
      if (this._options.autoCloseRsiDivergence_2575_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence_2575_1h', 'short')

      // notifyPhone(`${symbol} 1h rsiDivergenceSignal_2575 short`)
    }
    if (rsiDivergenceSignal_3070.long) {
      if (this._options.autoCloseRsiDivergence_3070_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence_3070_1h', 'long')

      // notifyPhone(`${symbol} 1h rsiDivergenceSignal_3070 Long`)
    } else if (rsiDivergenceSignal_3070.short) {
      if (this._options.autoCloseRsiDivergence_3070_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence_3070_1h', 'short')

      // notifyPhone(`${symbol} 1h rsiDivergenceSignal_3070 short`)
    }
    // const {rsiPeriod, stochasticPeriod, kPeriod, dPeriod} = this._options.stochRsi
    // this._candles1m.calcStochRsiSignal(rsiPeriod, stochasticPeriod, kPeriod, dPeriod, this._systemTime)
    const signal = this._candles1h.calcMacdDepartSignal(symbol, 90)
    // const candle = this._candles1h.getHistoryCandle(symbol)
    // notifyPhone(`${symbol} ${candle.timestamp} ${candle.close}`)
    if (signal.long) {
      if (this._options.autoCloseMacdDivergence1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'macdDivergence1h', 'long')

      // notifyPhone(`${symbol} 1h MacdDepartSignal Long`)
    } else if (signal.short) {
      if (this._options.autoCloseMacdDivergence1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'macdDivergence1h', 'short')

      // notifyPhone(`${symbol} 1h MacdDepartSignal Short`)
    }

    // stoch
    const stochOverTradeSignal_2575 = this._candles1h.stochOverTradeSignal(symbol, 9, 3, 25, 75)
    if (stochOverTradeSignal_2575.long) {
      if (this._options.autoCloseStochOverTrade_2575_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'stochOverTrade_2575_1h', 'long')
    } else if (stochOverTradeSignal_2575.short) {
      if (this._options.autoCloseStochOverTrade_2575_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'stochOverTrade_2575_1h', 'short')
    }

    const stochOverTradeSignal_3070 = this._candles1h.stochOverTradeSignal(symbol, 9, 3, 30, 70)
    if (stochOverTradeSignal_3070.long) {
      if (this._options.autoCloseStochOverTrade_3070_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'stochOverTrade_3070_1h', 'long')
    } else if (stochOverTradeSignal_3070.short) {
      if (this._options.autoCloseStochOverTrade_3070_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'stochOverTrade_3070_1h', 'short')
    }

    this.caculateIndicatorAndCache(symbol, '1h')
  }

  updateTradeBin5m(json, symbol) {
    this._candles5m.update(json.data[0], symbol)
    if (this._options.autoUpdateStopOpenMarketOrder) {
      this.updateStopOpenOrderByLastCandle(symbol, this._candles5m)
    }
    // high1 low1
    const highlow1Signal = this._candles5m.highlow1Signal(symbol)
    if (highlow1Signal.high1) {
      // notifyPhone(`${symbol} 5m high 1`)
      watchSignal(this, symbol, 'break5m', 'high1')

    } else if (highlow1Signal.low1) {
      // notifyPhone(`${symbol} 5m low 1`)
      watchSignal(this, symbol, 'break5m', 'low1')

    }
    // RSI over trade signal
    const rsiOverTradeSignal = this._candles5m.rsiOverTradeSignal(symbol, 8)
    if (rsiOverTradeSignal.long) {
      if (this._options.autoCloseRsiOverTrade5m) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade5m', 'long')

      // notifyPhone(`${symbol} 5m rsiOverTradeSignal Long`)
    } else if (rsiOverTradeSignal.short) {
      if (this._options.autoCloseRsiOverTrade5m) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade5m', 'short')

      // notifyPhone(`${symbol} 5m rsiOverTradeSignal Short`)
    }
    // RSI divergence signal
    const rsiDivergenceSignal = this._candles5m.rsiDivergenceSignal(symbol, 8, 24, 24)
    if (rsiDivergenceSignal.long) {
      if (this._options.autoCloseRsiDivergence5m) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence5m', 'long')

      // notifyPhone(`${symbol} 5m rsiDivergenceSignal Long`)
    } else if (rsiDivergenceSignal.short) {
      if (this._options.autoCloseRsiDivergence5m) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence5m', 'short')

      // notifyPhone(`${symbol} 5m rsiDivergenceSignal short`)
    }
    // const {rsiPeriod, stochasticPeriod, kPeriod, dPeriod} = this._options.stochRsi
    // this._candles1m.calcStochRsiSignal(rsiPeriod, stochasticPeriod, kPeriod, dPeriod, this._systemTime)
    const signal = this._candles5m.calcMacdDepartSignal(symbol, 144)
    const signal1 = this._candles5m.calcMacdDepartSignal(symbol, 144, 1)
    // notifyPhone(`${symbol} ${candle.timestamp} ${candle.close}`)
    if (signal.long && signal1.long) {
      if (this._options.autoCloseMacdDivergence5m) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'macdDivergence5m', 'long')

      // notifyPhone(`${symbol} 5m MacdDepartSignal Long`)
    } else if (signal.short && signal1.short) {
      if (this._options.autoCloseMacdDivergence5m) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'macdDivergence5m', 'short')

      // notifyPhone(`${symbol} 5m MacdDepartSignal Short`)
    }

    // stoch
    const stochOverTradeSignal_2575 = this._candles5m.stochOverTradeSignal(symbol, 9, 3, 25, 75)
    if (stochOverTradeSignal_2575.long) {
      if (this._options.autoCloseStochOverTrade_2575_5m) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'stochOverTrade_2575_5m', 'long')
    } else if (stochOverTradeSignal_2575.short) {
      if (this._options.autoCloseStochOverTrade_2575_5m) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'stochOverTrade_2575_5m', 'short')
    }

    this.caculateIndicatorAndCache(symbol, '5m')

    this.runRsiDevergenceBot(symbol)
  }

  updateAccountOrder(json, symbol) {
    this._accountOrder.update(json, symbol)
    // console.log('BTM: account order update', json.action, '[ordStatus]', json.data[0] && json.data[0].ordStatus, '[ordType]', json.data[0] && json.data[0].ordType)
    // console.log(json)
    // console.log(this._accountOrder)
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

  getAllInstrument() {
    return this._accountInstrument.getAllInstrument()
  }

  getLatestQuote(symbol) {
    return this._accountQuote.getLatestQuote(symbol)
  }

  getAccountMargin() {
    return this._accountMargin.getMargin()
  }

  updateStopOpenOrderByLastCandle(symbol, candleManager) {
    const precision = precisionMap[symbol]
    if (!precision) {
      return
    }

    const orders = this._accountOrder.getStopOpenMarketOrders(symbol)
    let lastCandle = candleManager.getHistoryCandle(symbol)
    const { high, low } = lastCandle
    // console.log(high, low)
    orders.forEach(o => {
      const { side, stopPx } = o
      const newStopPx = side === 'Buy' ? (high + precision) : (low - precision)
      if (newStopPx !== stopPx) {
        // update order
        const newOrder = {
          orderID: o.orderID,
          stopPx: newStopPx
        }
        this._orderManager.getSignatureSDK().updateOrder(newOrder)
      }
    })
  }

  getCandleManager(period) {
    switch (period) {
      case '5m':
        return this._candles5m
      case '1h':
        return this._candles1h
      case '1d':
        return this._candles1d
      default:
        break
    }
  }

  orderStopOrderByLastCandle(symbol, period, qty, side) {
    const precision = precisionMap[symbol]
    if (!precision) {
      return
    }
    const candleManager = this.getCandleManager(period)
    let lastCandle = candleManager.getHistoryCandle(symbol)
    const { high, low } = lastCandle
    const stopPx = side === 'Buy' ? (high + precision) : (low - precision)
    return this._orderManager.getSignatureSDK().orderStop(symbol, qty, stopPx, side, false)
  }

  closeLongPostionIfHave(symbol) {
    if (this._accountPosition.getCurrentQty(symbol) > 0) {
      this.closePosition(symbol)
    }
  }

  closeShortPositionIfHave(symbol) {
    if (this._accountPosition.getCurrentQty(symbol) < 0) {
      this.closePosition(symbol)
    }
  }

  closePositionIfHave(symbol) {
    if (this._accountPosition.hasPosition(symbol)) {
      this.closePosition(symbol)
    }
  }

  getAutoOrderSignalList() {
    return this._autoOrderSignals
  }

  addAutoOrderSignal(auto_order) {
    this._autoOrderSignals.push(auto_order)
    return auto_order
  }

  updateAutoOrderSignal(index, auto_order) {
    const autoOrder = this._autoOrderSignals[index]
    if (autoOrder) {
      this._autoOrderSignals[index] = {
        ...autoOrder,
        ...auto_order,
      }
      return this._autoOrderSignals[index]
    }
    return false
  }

  deleteAutoOrderSignal(index) {
    if (this._autoOrderSignals[index]) {
      this._autoOrderSignals.splice(index, 1)
      return true
    }
    return false
  }

  caculateIndicatorAndCache(symbol, period) {
    const candleManager = this.getCandleManager(period)
    const { d } = candleManager.getLastStochKD(symbol, 9, 3)
    this.cacheIndicator(symbol, period, 'stoch_k', d)

    const rsi_8 = candleManager.getLastRsi(symbol, 8)
    this.cacheIndicator(symbol, period, 'rsi', rsi_8)

    const ema = candleManager.getLastEMA(symbol, 20)
    this.cacheIndicator(symbol, period, 'ema', ema)
  }

  cacheIndicator(symbol, period, name, value) {
    _.set(this._indicatorCache, [symbol, period, name].join('.'), value)
  }

  getAllIndicatorValues() {
    return this._indicatorCache
  }

  hasStopOpenOrder(symbol) {
    this._orderManager.getStopOpenMarketOrders(symbol).length > 0
  }

  getWalletBalanceUsd() {
    const { walletBalance } = this.getAccountMargin()
    const balance = walletBalance / 1E8
    const xbtPirce = this._candles5m.getHistoryCandle('XBTUSD').close
    return Math.floor(xbtPirce * balance)
  }

  getAccountFullAmount() {
    return this.getWalletBalanceUsd()
  }

  runRsiDevergenceBot(symbol) {
    const {
      on, botId, symbols, enableLong, enableShort,
      len, highlowLen, divergenceLen, theshold_bottom, theshold_top,
      lowVol, highBoDong
    } = this._options.botRsiDivergence

    if (!on) {
      return
    }
    if (symbols.indexOf(symbol) === -1) {
      return
    }
    if (this.hasStopOpenOrder(symbol)) {
      return
    }
    if (this.isAutoSignalRunding(botId)) {
      return
    }

    if (this._accountPosition.hasPosition(symbol)) {
      // may close
      // const currentQty = this._accountPosition.getCurrentQty(symbol)
      const closeSignal = this._candles5m.rsiDivergenceSignal(symbol, 10, 24, 24, 30, 70)
      if (closeSignal.long) {
        this.closeShortPositionIfHave(symbol)
      }
      if (closeSignal.short) {
        this.closeLongPostionIfHave(symbol)
      }
    } else {
      // open
      const openSignal = this._candles5m.rsiDivergenceSignal(symbol, len || 12, highlowLen || 80, divergenceLen || 80, theshold_bottom || 25, theshold_top || 75)
      
      if ((openSignal.long && enableLong) || (openSignal.short && enableShort)) {
        const lowVolFilter = lowVol ? this._candles5m.isLowVol(symbol, 50, 3) : true
        const highBoDongFilter = highBoDong ? this._candles1d.isAdxHigh(symbol, 14) : true
        if (lowVolFilter && highBoDongFilter) {
          notifyPhone('rsi divergence bot open!')
          // high2 low2 to open
          this.updateAutoSignalById(botId, {
            symbol: symbol,
            amount: this.getAccountFullAmount(),
            min_interval: 1,// 重复触发至少间隔时间1小时, 关系不大
            order_method: "stopMarket5m", // highlow1
            remain_times: 1,
            side: openSignal.long ? "Buy" : "Sell",
            signal_name: "break5m",
            signal_operator: openSignal.long ? "low1" : "high1",
            signal_value: "",
            values: {
              times: 2
            }
          })
        }
      }
    }
  }

  isAutoSignalRunding(id) {
    const order = this._autoOrderSignals.filter(o => o.id === id)[0]
    if (order && order.remain_times > 0) {
      return true
    }
    return false
  }

  updateAutoSignalById(id, newOrder) {
    const order = this._autoOrderSignals.filter(o => o.id === id)[0]
    if (order) {
      _.merge(order, newOrder)
    } else {
      this._autoOrderSignals.push({
        ...newOrder,
        id
      })
    }
  }
}

module.exports = FlowDataBase
