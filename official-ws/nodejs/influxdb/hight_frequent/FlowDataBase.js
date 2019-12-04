// 通用版本
// const OrderBook = require('../../strategy/researchOrderbookL2/OrderBookL2Trade')
const fs = require('fs')
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
// const notifyPhone = require('../../strategy/notifyPhone').notifyPhone
const notifyPhoneUser = require('../../strategy/notifyPhone').notifyPhoneUser

const watchSignal = require('./watchSignal')
const { JSONtoCSV } = require('../util')
const precisionMap = {
  'XBTUSD': 0.5,
  'ETHUSD': 0.05,
}

class FlowDataBase {
  constructor(options) {
    this._options = _.merge({
      configFilePath: '',
      marginFilePath: '',  // 记录账户价值
      notify: {
        on: false,
        token: '',
        user: '',
      },
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
      BotConfig: {
        usdMode: false,  // $本位
        currentPositionBotId: {
          'XBTUSD': '',  // 记录当前仓位的bot id
        },
        // maxQty: {
        //   'XBTUSD': 10000,
        // },
      },
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
        highBoDong: true, // false for test
      },
      botBreakCandle: {
        botId: '__break_candle_bot',
        symbols: ['XBTUSD'],
        on: false,
        enableLong: true,
        enableShort: false,
        _waitingForOrderBreak: { long: false, short: false },
        len: 48,
        upVol: true, //false for test
        useAdx: true,
      },
      botPinBar: {
        botId: '__pin_bar_bot',
        symbols: ['XBTUSD'],
        on: false,
        enableLong: true,
        enableShort: false,
      },
      limitStopProfit: { // 半自动化配置
        shortMode: false, // 空头市场，总是xbt套保
        autoOrderProfit: true, // reduceOnly limit
        symbol: 'XBTUSD',
        side: 'Buy',
        risk: 100, //$100
        period: '4h',
        defaultProfitRate: 2,
        symbolConfig: {
          'XBTUSD': {
            profitPx: 0,
            price: 0,
            side: 'Buy',
            stopPx: 0,
          },
          'ETHUSD': {
            profitPx: 0,
            price: 0,
            side: 'Buy',
            stopPx: 0,
          },
        },
        kRateForPrice: 0.5, // or 0.618
      }
    }, options)

    this.mergeConfigFromFile()

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
    this._candles4h = new BitmexCandleManager({ is4H: true })

    if (this._options.initCheckSystem) {
      this.initCheckSystem()
    }

    this.initAutoOrderProfitOrderInterval()

    this.initCheckDataInterval()
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
    this._checkDataState = {
      position: {
        'XBTUSD': {
          valid: true, //通过判断本地websock数据 和 api数据的相同性确定
        }
      }
    }
    this._marginHistory = this.getHistoryMarginFromFile()  // 每天记录的账户价值
    this._recordRunLastTime = new Date()
    this.initRecordMarginInterval()
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
    // 保存到json
    this.saveConfigToFile()
    return this.getOptions()
  }

  updateOption(path, value) {
    _.set(this._options, path, value)
    // 保存到json
    this.saveConfigToFile()
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
        this.updateTradeBin4h(json, symbol)
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

  orderMarket(symbol, side, qty) {
    return this._orderManager.getSignatureSDK().orderMarket(symbol, qty, side)
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
  // 监测程序的数据是否正常， 否则重启
  initCheckDataInterval() {
    this._checkDataInterval = setInterval(() => {
      // this._notifyPhone('test notifyPhone')
      this.checkPositionValid('XBTUSD')
    }, 2 * 60 * 1000)
  }

  initAutoOrderProfitOrderInterval() {
    this._checkAutoOrderProfitOrderInterval = setInterval(() => {
      const { autoOrderProfit } = this._options.limitStopProfit
      if (autoOrderProfit) {
        this.setProfitReduceOnlyLimitOrder()
      }
    }, 2 * 60 * 1000)
  }

  checkPositionValid(symbol) {
    this._orderManager.getSignatureSDK().getPosition(symbol).then(json => {
      const currentQty = json[0] ? json[0].currentQty : 0
      const localCurrentQty = this._accountPosition.getCurrentQty(symbol)
      const isSameQty = currentQty === localCurrentQty
      // 连续两次不相同，那么重启程序！
      if (!this._checkDataState.position[symbol].valid && !isSameQty) {
        const msg = `${symbol} position连续两次不同，重启程序！`
        console.log(msg)
        this._notifyPhone(msg, true)
        setTimeout(() => {
          process.exit(1)
        }, 3000)
      }
      this._checkDataState.position[symbol].valid = isSameQty
    }).catch(e => {
      this._notifyPhone('checkPositionValid getPosition error!', true)
      console.log('checkPositionValid getPosition error', e)
    })
  }

  initCheckSystem() {
    this._interval = setInterval(() => {
      if (!this.checkAlive()) {
        this._notifyPhone('data not flow error', true)
        setTimeout(() => {
          process.exit(1) // centos7 设置 systemctl 服务会自动重启
        }, 10 * 1000)
      }
      const checkXBTCandleMsg = this.checkCandles('XBTUSD')
      const checkETHCandleMsg = this.checkCandles('ETHUSD')
      if (checkXBTCandleMsg) {
        this._notifyPhone(checkXBTCandleMsg, true)
      }
      if (checkETHCandleMsg) {
        this._notifyPhone(checkETHCandleMsg, true)
      }
    }, 5 * 60 * 1000)
  }

  // period : 1d 1h 5m 4h
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
      this._notifyPhone(`${symbol} 1d high 1`)
      watchSignal(this, symbol, 'break1d', 'high1')
    } else if (highlow1Signal.low1) {
      this._notifyPhone(`${symbol} 1d low 1`)
      watchSignal(this, symbol, 'break1d', 'low1')
    }

    // stoch
    const stochOverTradeSignal_2575 = candleManager.stochOverTradeSignal(symbol, 9, 3, 25, 75)
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

  updateTradeBin4h(json, symbol) {
    this._candles4h.update(json.data[0], symbol)
    // console.log(this._candles4h.getCandleManager(symbol), 565656565)
  }

  updateTradeBin1h(json, symbol) {
    this._candles1h.update(json.data[0], symbol)
    if (this._options.autoUpdateStopOpenMarketOrder1h) {
      this.updateStopOpenOrderByLastCandle(symbol, this._candles1h)
    }
    // high1 low1
    const highlow1Signal = this._candles1h.highlow1Signal(symbol)
    if (highlow1Signal.high1) {
      // this._notifyPhone(`${symbol} 1h high 1`)
      watchSignal(this, symbol, 'break1h', 'high1')
    } else if (highlow1Signal.low1) {
      // this._notifyPhone(`${symbol} 1h low 1`)
      watchSignal(this, symbol, 'break1h', 'low1')
    }
    // 高点回调 或者 低点回调
    const lowerHighHigherLowSignal = this._candles1h.lowerHighHigherLowSignal(symbol)
    if (lowerHighHigherLowSignal.lowerHigh) {
      watchSignal(this, symbol, 'break1h', 'high1', 'lowerHigh')
    }
    if (lowerHighHigherLowSignal.higherLow) {
      watchSignal(this, symbol, 'break1h', 'low1', 'higherLow')
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

      // this._notifyPhone(`${symbol} 1h rsiOverTradeSignal Long`)
    } else if (rsiOverTradeSignal.short) {
      if (this._options.autoCloseRsiOverTrade1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade1h', 'short')

      // this._notifyPhone(`${symbol} 1h rsiOverTradeSignal Short`)
    }
    if (rsiOverTradeSignal_2575.long) {
      if (this._options.autoCloseRsiOverTrade_2575_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade_2575_1h', 'long')

      // this._notifyPhone(`${symbol} 1h rsiOverTradeSignal_2575 Long`)
    } else if (rsiOverTradeSignal_2575.short) {
      if (this._options.autoCloseRsiOverTrade_2575_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade_2575_1h', 'short')

      // this._notifyPhone(`${symbol} 1h rsiOverTradeSignal_2575 Short`)
    }
    if (rsiOverTradeSignal_3070.long) {
      if (this._options.autoCloseRsiOverTrade_3070_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade_3070_1h', 'long')

      // this._notifyPhone(`${symbol} 1h rsiOverTradeSignal_3070 Long`)
    } else if (rsiOverTradeSignal_3070.short) {
      if (this._options.autoCloseRsiOverTrade_3070_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade_3070_1h', 'short')

      // this._notifyPhone(`${symbol} 1h rsiOverTradeSignal_3070 Short`)
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

      // this._notifyPhone(`${symbol} 1h rsiDivergenceSignal Long`)
    } else if (rsiDivergenceSignal.short) {
      if (this._options.autoCloseRsiDivergence1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence1h', 'short')

      // this._notifyPhone(`${symbol} 1h rsiDivergenceSignal short`)
    }
    if (rsiDivergenceSignal_2575.long) {
      if (this._options.autoCloseRsiDivergence_2575_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence_2575_1h', 'long')

      // this._notifyPhone(`${symbol} 1h rsiDivergenceSignal_2575 Long`)
    } else if (rsiDivergenceSignal_2575.short) {
      if (this._options.autoCloseRsiDivergence_2575_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence_2575_1h', 'short')

      // this._notifyPhone(`${symbol} 1h rsiDivergenceSignal_2575 short`)
    }
    if (rsiDivergenceSignal_3070.long) {
      if (this._options.autoCloseRsiDivergence_3070_1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence_3070_1h', 'long')

      // this._notifyPhone(`${symbol} 1h rsiDivergenceSignal_3070 Long`)
    } else if (rsiDivergenceSignal_3070.short) {
      if (this._options.autoCloseRsiDivergence_3070_1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence_3070_1h', 'short')

      // this._notifyPhone(`${symbol} 1h rsiDivergenceSignal_3070 short`)
    }
    // const {rsiPeriod, stochasticPeriod, kPeriod, dPeriod} = this._options.stochRsi
    // this._candles1m.calcStochRsiSignal(rsiPeriod, stochasticPeriod, kPeriod, dPeriod, this._systemTime)
    const signal = this._candles1h.calcMacdDepartSignal(symbol, 90)
    // const candle = this._candles1h.getHistoryCandle(symbol)
    // this._notifyPhone(`${symbol} ${candle.timestamp} ${candle.close}`)
    if (signal.long) {
      if (this._options.autoCloseMacdDivergence1h) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'macdDivergence1h', 'long')

      // this._notifyPhone(`${symbol} 1h MacdDepartSignal Long`)
    } else if (signal.short) {
      if (this._options.autoCloseMacdDivergence1h) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'macdDivergence1h', 'short')

      // this._notifyPhone(`${symbol} 1h MacdDepartSignal Short`)
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
    this.runPinBarBot(symbol)
  }

  updateTradeBin5m(json, symbol) {
    this._candles5m.update(json.data[0], symbol)
    if (this._options.autoUpdateStopOpenMarketOrder) {
      this.updateStopOpenOrderByLastCandle(symbol, this._candles5m)
    }
    // high1 low1
    const highlow1Signal = this._candles5m.highlow1Signal(symbol)
    if (highlow1Signal.high1) {
      // this._notifyPhone(`${symbol} 5m high 1`)
      watchSignal(this, symbol, 'break5m', 'high1')

    } else if (highlow1Signal.low1) {
      // this._notifyPhone(`${symbol} 5m low 1`)
      watchSignal(this, symbol, 'break5m', 'low1')

    }
    // 高点回调 或者 低点回调
    const lowerHighHigherLowSignal = this._candles5m.lowerHighHigherLowSignal(symbol)
    if (lowerHighHigherLowSignal.lowerHigh) {
      watchSignal(this, symbol, 'break5m', 'high1', 'lowerHigh')
    }
    if (lowerHighHigherLowSignal.higherLow) {
      watchSignal(this, symbol, 'break5m', 'low1', 'higherLow')
    }
    // RSI over trade signal
    const rsiOverTradeSignal = this._candles5m.rsiOverTradeSignal(symbol, 8)
    if (rsiOverTradeSignal.long) {
      if (this._options.autoCloseRsiOverTrade5m) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade5m', 'long')

      // this._notifyPhone(`${symbol} 5m rsiOverTradeSignal Long`)
    } else if (rsiOverTradeSignal.short) {
      if (this._options.autoCloseRsiOverTrade5m) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiOverTrade5m', 'short')

      // this._notifyPhone(`${symbol} 5m rsiOverTradeSignal Short`)
    }
    // RSI divergence signal
    const rsiDivergenceSignal = this._candles5m.rsiDivergenceSignal(symbol, 8, 24, 24)
    if (rsiDivergenceSignal.long) {
      if (this._options.autoCloseRsiDivergence5m) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence5m', 'long')

      // this._notifyPhone(`${symbol} 5m rsiDivergenceSignal Long`)
    } else if (rsiDivergenceSignal.short) {
      if (this._options.autoCloseRsiDivergence5m) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'rsiDivergence5m', 'short')

      // this._notifyPhone(`${symbol} 5m rsiDivergenceSignal short`)
    }
    // const {rsiPeriod, stochasticPeriod, kPeriod, dPeriod} = this._options.stochRsi
    // this._candles1m.calcStochRsiSignal(rsiPeriod, stochasticPeriod, kPeriod, dPeriod, this._systemTime)
    const signal = this._candles5m.calcMacdDepartSignal(symbol, 144)
    const signal1 = this._candles5m.calcMacdDepartSignal(symbol, 144, 1)
    // this._notifyPhone(`${symbol} ${candle.timestamp} ${candle.close}`)
    if (signal.long && signal1.long) {
      if (this._options.autoCloseMacdDivergence5m) {
        this.closeShortPositionIfHave(symbol)
      }
      watchSignal(this, symbol, 'macdDivergence5m', 'long')

      // this._notifyPhone(`${symbol} 5m MacdDepartSignal Long`)
    } else if (signal.short && signal1.short) {
      if (this._options.autoCloseMacdDivergence5m) {
        this.closeLongPostionIfHave(symbol)
      }
      watchSignal(this, symbol, 'macdDivergence5m', 'short')

      // this._notifyPhone(`${symbol} 5m MacdDepartSignal Short`)
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
    this.runBreakCandleBot(symbol)
    // this.runPinBarBot(symbol)

    this.saveConfigToFile()
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
    const { currentPositionBotId, usdMode } = this._options.BotConfig
    // 在usdMode中， 当break candle 策略运行时，由于有止损开仓，不需要跟踪
    if (
      usdMode &&
      currentPositionBotId[symbol] === this._options.botBreakCandle.botId &&
      this.hasSymbolPosition(symbol)
    ) {
      return
    }

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
      case '4h':
        return this._candles4h
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

  
  orderLimitWithStop(data) {
    const { symbol, side, amount, price, stopPx } = data
    const sdk = this._orderManager.getSignatureSDK()
    return Promise.all([
      sdk.orderStop(symbol, amount, stopPx, side === 'Buy' ? 'Sell' : 'Buy', true),
      sdk.orderLimit(symbol, amount, side, price)
    ])
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

  hasReduceOnlyOrder(symbol) {
    return this._accountOrder.getReduceOnlyOrders(symbol).length > 0
  }
  // 如果side不传, 返回全部
  hasStopOrder(symbol, side) {
    return this._accountOrder.getStopOrders(symbol, side).length > 0
  }

  hasStopOpenOrder(symbol, side) {
    return this._accountOrder.getStopOpenMarketOrders(symbol, side).length > 0
  }

  hasLimitOrder(long, symbol) {
    return this._accountOrder.getLimitOrders(long, symbol).length > 0
  }

  getWalletBalanceUsd() {
    // margin 有可能还没有初始化
    const margin = this.getAccountMargin()
    if (margin) {
      const { walletBalance } = margin
      const balance = walletBalance / 1E8
      const xbtPirce = this._candles5m.getHistoryCandle('XBTUSD').close
      return Math.floor(xbtPirce * balance)
    }
    this._notifyPhone('getAccountMargin 返回 空？')
    return -1
  }

  getAccountFullAmount() {
    return this.getWalletBalanceUsd()
  }

  setCurrentPositionBotId(id, symbol) {
    this._options.BotConfig.currentPositionBotId[symbol] = id
  }

  getCurrentPositionBotId(symbol) {
    return this._options.BotConfig.currentPositionBotId[symbol]
  }

  isRunningBot(id, symbol) {
    const currentBotId = this.getCurrentPositionBotId(symbol)
    return !currentBotId || currentBotId === id
  }

  runRsiDevergenceBot(symbol) {
    const {
      on, botId, symbols, enableLong, enableShort,
      len, highlowLen, divergenceLen, theshold_bottom, theshold_top,
      lowVol, highBoDong,
    } = this._options.botRsiDivergence

    const { usdMode } = this._options.BotConfig

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
    if (!this.isRunningBot(botId, symbol)) {
      return
    }
    // todo: 结合 交易所的强制平仓价格来判断
    // const maxAmount = this.getAccountFullAmount()
    // const positionQty = Math.abs(this._accountPosition.getCurrentQty(symbol))
    // console.log(maxAmount, positionQty)
    // if (positionQty / maxAmount > 1.2) {
    //   notifyPhone('仓位异常')
    //   return
    // }
    // 注意：usdMode 下套保后才是空仓
    let hasPosition = false
    const positionQty = this._accountPosition.getCurrentQty(symbol)

    if (usdMode) {
      hasPosition = positionQty >= 0 //=0 相当于现货
    } else {
      hasPosition = this._accountPosition.hasPosition(symbol)
    }


    if (hasPosition) {
      const longPosition = usdMode ?
        positionQty >= 0 : positionQty > 0
      // may close
      // const currentQty = this._accountPosition.getCurrentQty(symbol)
      const closeSignal = this._candles5m.rsiDivergenceSignal(symbol, 10, 24, 24, 35, 69)
      // 超卖平空
      if (closeSignal.long && !longPosition) {
        if (!longPosition) {
          this._notifyPhone('rsiDivergenceSignal bot close short')
        }
        if (usdMode) {
          // 暂时不做空
        } else {
          this.closeShortPositionIfHave(symbol)
        }
        // 重置id
        this.setCurrentPositionBotId('', symbol)
      }
      // 超买平多
      if (closeSignal.short && longPosition) {
        if (longPosition) {
          this._notifyPhone('rsiDivergenceSignal bot close long' + (usdMode ? '套保' : ''))
        }
        if (usdMode) {
          //开套保
          const qty = this.getAccountFullAmount()
          this.orderMarket(symbol, 'Sell', qty)
        } else {
          this.closeLongPostionIfHave(symbol)
        }
        // 重置id
        this.setCurrentPositionBotId('', symbol)
      }
    } else {
      // open
      const openSignal = this._candles5m.rsiDivergenceSignal(symbol, len || 12, highlowLen || 80, divergenceLen || 80, theshold_bottom || 25, theshold_top || 75)
      if ((openSignal.long && enableLong) || (openSignal.short && enableShort)) {
        const isNotLH = !this._candles5m.isCurrentHighestLowestClose(symbol, 300)
        const lowVolFilter = lowVol ? this._candles5m.isLowVol(symbol, 50, 3) : true
        const highBoDongFilter = highBoDong ? this._candles1d.isAdxHigh(symbol, 14) : true
        this._notifyPhone(`rsi divergence bot long! ${isNotLH} ${lowVolFilter} ${highBoDongFilter}`)
        if (isNotLH && lowVolFilter && highBoDongFilter) {
          this._notifyPhone('rsi divergence bot open!')
          // 锁定为当前id
          this.setCurrentPositionBotId(botId, symbol)
          // high2 low2 to open
          this.updateAutoSignalById(botId, {
            symbol: symbol,
            amount: usdMode ? Math.abs(positionQty) : this.getAccountFullAmount(),
            min_interval: 1,// 重复触发至少间隔时间1小时, 关系不大
            order_method: "stopMarket5m", // highlow1
            remain_times: 1,
            side: openSignal.long ? "Buy" : "Sell",
            signal_name: "break5m",
            signal_operator: openSignal.long ? "high1" : "low1",
            signal_value: "",
            values: {
              times: 2,
              after: openSignal.long ? 'lowerHigh' : 'higherLow',
            }
          })
        }
      }
    }
  }

  hasSymbolPosition(symbol) {
    const { usdMode } = this._options.BotConfig
    let hasPosition = false
    const positionQty = this._accountPosition.getCurrentQty(symbol)
    if (usdMode) {
      hasPosition = positionQty >= 0 //=0 相当于现货
    } else {
      hasPosition = this._accountPosition.hasPosition(symbol)
    }
    return hasPosition
  }

  runBreakCandleBot(symbol) {
    const {
      on, botId, symbols, _waitingForOrderBreak, enableLong, enableShort,
      len, upVol, useAdx,
    } = this._options.botBreakCandle

    const { usdMode, currentPositionBotId } = this._options.BotConfig

    if (!on) {
      return
    }
    if (symbols.indexOf(symbol) === -1) {
      return
    }
    // 如果该策略没有运行, 还有stopOpenOrder, 返回
    // 因为下面的usdMode下， 开止损仓位也是利用止损开仓， 所以与上面的策略不一样
    if (this.hasStopOpenOrder(symbol)) {
      if (usdMode) {
        if (!currentPositionBotId[symbol]) {
          return
        }
      } else {
        return
      }
    }
    if (this.isAutoSignalRunding(botId)) {
      return
    }
    if (!this.isRunningBot(botId, symbol)) {
      return
    }

    const isBotRunning = currentPositionBotId[symbol] === botId
    let hasPosition = false
    const positionQty = this._accountPosition.getCurrentQty(symbol)
    if (usdMode) {
      hasPosition = positionQty >= 0 //=0 相当于现货
    } else {
      hasPosition = this._accountPosition.hasPosition(symbol)
    }

    if (hasPosition) {
      if (!isBotRunning) {
        return
      }
      // const longPosition = usdMode ?
      //   positionQty >= 0 : positionQty > 0
      // 设置了止盈止损
      // 可以在此检查止盈止损有没有设置
      const { maxHigh, minLow } = this._candles5m.getMinMaxHighLow(symbol, len)
      if (usdMode) {
        const longPosition = positionQty >= 0
        const stopSide = longPosition ? 'Sell' : 'Buy'
        const qty = this.getAccountFullAmount()
        // 止损
        if (!this.hasStopOpenOrder(symbol, stopSide)) {
          console.log('usdMode and set stop')
          this._notifyPhone('usdMode and set stop')
          // 追踪止损开仓的
          this._orderManager.getSignatureSDK().orderStop(symbol, qty, longPosition ? minLow : maxHigh, stopSide, false)
        }
        // 止盈
        if (!this.hasLimitOrder(!longPosition, symbol)) {
          console.log('usdMode and set limit profit')
          this._notifyPhone('usdMode and set limit profit')
          const { high, low } = this._candles5m.getHistoryCandle(symbol, 2)
          let profit = (maxHigh - minLow) * 1
          profit = Math.round(profit * 2) / 2
          this._orderManager.getSignatureSDK().orderLimit(symbol, qty, stopSide, longPosition ? (low + profit) : (high - profit))
        }
      } else {
        const longPosition = positionQty > 0
        const stopSide = longPosition ? 'Sell' : 'Buy'
        if (!this.hasStopOrder(symbol, stopSide)) {
          // 止损
          console.log('btc mode and set stop')
          this._notifyPhone('btc mode and set stop')
          this._orderManager.getSignatureSDK().orderStop(symbol, Math.abs(positionQty), longPosition ? minLow : maxHigh, stopSide, true)
        }
        if (!this.hasReduceOnlyOrder(symbol)) {
          // 止盈
          console.log('btc mode and set profit limit')
          this._notifyPhone('btc mode and set profit limit')
          const { high, low } = this._candles5m.getHistoryCandle(symbol, 2)
          let profit = (maxHigh - minLow) * 1
          profit = Math.round(profit * 2) / 2
          this._orderManager.getSignatureSDK().orderReduceOnlyLimit(symbol, Math.abs(positionQty), stopSide, longPosition ? (low + profit) : (high - profit))
        }
      }
    } else {
      if (_waitingForOrderBreak.long || _waitingForOrderBreak.short) {
        const stochOverSignal = this._candles5m.stochOverTradeSignal(symbol, 9, 3, 30, 70)
        // stochOverSignal.long = true
        const toOpenPostion = (stochOverSignal.long && _waitingForOrderBreak.long) ||
          (stochOverSignal.short && _waitingForOrderBreak.short)
        if (toOpenPostion) {
          _waitingForOrderBreak.long = false
          _waitingForOrderBreak.short = false
          this._notifyPhone('break candle bot push auto signal! 可手动取消')
          // 高4, 低4
          this.updateAutoSignalById(botId, {
            symbol: symbol,
            amount: usdMode ? Math.abs(positionQty) : this.getAccountFullAmount(),
            min_interval: 1,// 重复触发至少间隔时间1小时, 关系不大
            order_method: "stopMarket5m", // highlow1
            remain_times: 1,
            side: stochOverSignal.long ? "Buy" : "Sell",
            signal_name: "break5m",
            signal_operator: stochOverSignal.long ? "high1" : "low1",
            signal_value: "",
            values: {
              times: 3,
              after: stochOverSignal.long ? 'lowerHigh' : 'higherLow',
            }
          })
        }
      } else {
        // 平仓后重置botId
        setTimeout(() => {
          if (
            !this.hasSymbolPosition(symbol) &&
            !this.hasStopOpenOrder(symbol) &&
            currentPositionBotId[symbol] === botId &&
            !this.isAutoSignalRunding(botId) &&
            !_waitingForOrderBreak.long &&
            !_waitingForOrderBreak.short
          ) {
            this._notifyPhone('clear break candle bot')
            this.setCurrentPositionBotId('', symbol)
            //   // clear orders
            this._orderManager.getSignatureSDK().deleteOrderAll()
          }
        }, 1 * 60 * 1000)

        const barTrendSignal = this._candles5m.isLastBarTrend(symbol, len)
        // if (!this.__init_test) {
        //   barTrendSignal.long = true
        //   this.__init_test = true
        // }
        if ((barTrendSignal.long && enableLong) || (barTrendSignal.short && enableShort)) {
          const upVolFilter = upVol ? this._candles1h.isUpVol(symbol, 10, 3) : true
          let adxFilter = true

          if (useAdx) {
            const adxSignal = this._candles1d.adxSignal(symbol, 14)
            adxFilter = (adxSignal.long && barTrendSignal.long) || (adxSignal.short && barTrendSignal.short)
          }
          this._notifyPhone(`break candle bot signal! ${barTrendSignal.long ? 'long' : 'short'} upVolFilter${upVolFilter} adxFilter${adxFilter}`)
          if (upVolFilter && adxFilter) {
            // 锁定为当前id
            this.setCurrentPositionBotId(botId, symbol)
            if (barTrendSignal.long) {
              _waitingForOrderBreak.long = true
            } else {
              _waitingForOrderBreak.short = true
            }
          }
        }
      }

    }
  }

  runPinBarBot(symbol) {
    const {
      on, botId, symbols, enableLong, enableShort
    } = this._options.botPinBar

    const { usdMode, currentPositionBotId } = this._options.BotConfig

    if (!on) {
      return
    }
    if (symbols.indexOf(symbol) === -1) {
      return
    }
    // 有stopOpenOrder, 返回
    if (this.hasStopOpenOrder(symbol)) {
      return
    }
    if (this.isAutoSignalRunding(botId)) {
      return
    }
    if (!this.isRunningBot(botId, symbol)) {
      return
    }
    // 注意：usdMode 下套保后才是空仓
    let hasPosition = false
    const positionQty = this._accountPosition.getCurrentQty(symbol)

    if (usdMode) {
      hasPosition = positionQty >= 0 //=0 相当于现货
    } else {
      hasPosition = this._accountPosition.hasPosition(symbol)
    }

    if (hasPosition) {
      const longPosition = usdMode ?
        positionQty >= 0 : positionQty > 0
      // may close
      // const currentQty = this._accountPosition.getCurrentQty(symbol)
      const closeSignal = this._candles1h.stochOverTradeSignal(symbol, 12, 4, 30, 70)
      // 超卖平空
      if (closeSignal.long && !longPosition) {
        if (!longPosition) {
          this._notifyPhone('pin bar bot close short')
        }
        if (usdMode) {
          // 暂时不做空
        } else {
          this.closeShortPositionIfHave(symbol)
        }
        // 重置id
        this.setCurrentPositionBotId('', symbol)
      }
      // 超买平多
      if (closeSignal.short && longPosition) {
        if (longPosition) {
          this._notifyPhone('pin bar bot close long' + (usdMode ? '套保' : ''))
        }
        if (usdMode) {
          //开套保
          const qty = this.getAccountFullAmount()
          this.orderMarket(symbol, 'Sell', qty)
        } else {
          this.closeLongPostionIfHave(symbol)
        }
        // 重置id
        this.setCurrentPositionBotId('', symbol)
      }
    } else {
      const openSignal = this._candles1h.pinBarOpenSignal(symbol, 5)
      // openSignal.long = true
      if ((openSignal.long && enableLong) || (openSignal.short && enableShort)) {
        this._notifyPhone(`bot pin bar hour long: ${openSignal.long}`)
        console.log('bot pin bar hour long: ', openSignal.long)
        // 锁定为当前id
        this.setCurrentPositionBotId(botId, symbol)
        // high6 low6 to open
        this.updateAutoSignalById(botId, {
          symbol: symbol,
          amount: usdMode ? Math.abs(positionQty) : this.getAccountFullAmount(),
          min_interval: 1,// 重复触发至少间隔时间1小时, 关系不大
          order_method: "stopMarket5m", // highlow1
          remain_times: 1,
          side: openSignal.long ? "Buy" : "Sell",
          signal_name: "break5m",
          signal_operator: openSignal.long ? "high1" : "low1",
          signal_value: "",
          values: {
            times: 5,
            after: openSignal.long ? 'lowerHigh' : 'higherLow',
          }
        })
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

  mergeConfigFromFile() {
    const configFromFile = this.getConfigFromFile()
    if (configFromFile) {
      console.log(this._options.user, '读取到配置文件', this._options.configFilePath)
      this._options = _.merge(this._options, configFromFile)
    }
    return this._options
  }

  getConfigFromFile() {
    const { configFilePath } = this._options
    if (configFilePath && fs.existsSync(configFilePath)) {
      return JSON.parse(fs.readFileSync(configFilePath).toString())
    }
    return null
  }

  saveConfigToFile() {
    const configToSave = {}
    let paths = [
      'notify',
      'autoUpdateStopOpenMarketOrder',
      'autoUpdateStopOpenMarketOrder1h',

      'autoCloseStochOverTrade_2575_5m',
      'autoCloseRsiOverTrade5m',
      'autoCloseRsiDivergence5m',
      'autoCloseStochOverTrade_3070_1h',
      'autoCloseStochOverTrade_2575_1h',
      'autoCloseRsiOverTrade_3070_1h',
      'autoCloseRsiOverTrade_2575_1h',
      'autoCloseRsiOverTrade1h',
      'autoCloseRsiDivergence_3070_1h',
      'autoCloseRsiDivergence_2575_1h',
      'autoCloseRsiDivergence1h',
      'autoCloseStochOverTrade_3070_1d',

      'BotConfig',
      'botRsiDivergence',
      'botBreakCandle',
      'botPinBar',
    ]
    paths.forEach(path => {
      _.set(configToSave, path, _.get(this._options, path))
    })
    const { configFilePath } = this._options
    if (configFilePath) {
      fs.writeFileSync(configFilePath, JSON.stringify(configToSave, null, 2))
      // console.log(this._options.user, '保存配置到文件ok')
    }
  }

  getHistoryMarginFromFile() {
    const { marginFilePath } = this._options
    if (marginFilePath && fs.existsSync(marginFilePath)) {
      const fileContent = fs.readFileSync(marginFilePath).toString()
      const csvList = fileContent.split('\n')
      return csvList.map(row => {
        const splitList = row.split(',')
        return {
          timestamp: splitList[0],
          btc: splitList[1],
          dollar: splitList[2],
        }
      })
    }
    return []
  }

  saveHistoryMarginToFile() {
    const { marginFilePath } = this._options
    if (marginFilePath) {
      const dataToCsv = JSONtoCSV(this._marginHistory, ['timestamp', 'btc', 'dollar'])
      fs.writeFileSync(marginFilePath, dataToCsv)
    }
  }

  initRecordMarginInterval() {
    this._recordMarginInterval = setInterval(() => {
      const now = new Date()
      const hour = now.getUTCHours()
      const minute = now.getUTCMinutes()
      if (hour === 0 && minute <= 5) {
        // if (minute % 2 === 0) {
        // this._notifyPhone('Morning 8:00', true)
        const margin = this.getAccountMargin()
        if (margin) {
          const { walletBalance } = margin
          const balance = walletBalance / 1E8
          const xbtPirce = this._candles5m.getHistoryCandle('XBTUSD').close
          const item = {
            timestamp: now.toISOString(),
            btc: balance,
            dollar: Math.floor(xbtPirce * balance),
          }
          this._marginHistory.push(item)
          this.saveHistoryMarginToFile()
        }
      }
    }, 5 * 60 * 1000)
  }

  getMarginHistory() {
    return this._marginHistory
  }

  _notifyPhone(msg, force) {
    const { on, token, user } = this._options.notify
    if ((on || force) && token && user) {
      notifyPhoneUser(`[${this._options.user}]${msg}`, token, user)
    }
  }

  getCandleData(symbol, period, offset) {
    const candleManager = this.getCandleManager(period)
    if (candleManager) {
      return candleManager.getHistoryCandle(symbol, offset + 1)
    }
  }

  setProfitReduceOnlyLimitOrder() {
    const { defaultProfitRate, shortMode, symbolConfig } = this._options.limitStopProfit
    // xbt
    // 1 if has postion
    const symbol = 'XBTUSD'
    const xbtConfig = symbolConfig[symbol]
    const isConfigLong = xbtConfig.side === 'Buy'
    let hasPosition = false
    const positionQty = this._accountPosition.getCurrentQty(symbol)
    const absPositionQty = Math.abs(positionQty)
    // 暂时不支持shortMode
    if (shortMode) {
      hasPosition = positionQty >= 0 // 需要优化，不正确
    } else {
      hasPosition = this._accountPosition.hasPosition(symbol)
    }

    if (hasPosition) {
      const longPosition = shortMode ?
      positionQty >= 0 : positionQty > 0
      // 同向
      const isSameSide = (isConfigLong && longPosition) || (!isConfigLong && !longPosition)
      // 2 get stop close order
      const stopOrder = this._accountOrder.getStopOrders(symbol, longPosition ? 'Sell' : 'Buy')[0]
      if (stopOrder) {
        const { orderQty, stopPx } = stopOrder
        // 吻合
        if (isSameSide && stopPx === xbtConfig.stopPx) {
          const reduceOnlyOrder = this._accountOrder.getReduceOnlyOrders(symbol)[0]
          if (!reduceOnlyOrder) {
            // start order
            const msg = 'postion & stop orders, but no reduce only order and order it'
            console.log(msg)
            this._notifyPhone(msg, true)
            this._orderManager.getSignatureSDK().orderReduceOnlyLimit(symbol, orderQty, longPosition ? 'Sell' : 'Buy', xbtConfig.profitPx)
          } else {
            // 可能 amount 不对
            if (reduceOnlyOrder.orderQty < absPositionQty) {
              const msg = 'reduce only qty is less, to add more'
              console.log(msg)
              this._notifyPhone(msg, true)

              this._orderManager.getSignatureSDK().updateOrder({
                ...reduceOnlyOrder,
                orderQty: absPositionQty,
              })
            }
          }
        }
      }
    }

    // 3 get reduceOnly order
    // 4 check if have reduceOnlu order and amount if is safe
  }
}

module.exports = FlowDataBase
