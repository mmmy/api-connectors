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

const BASE_CURRENCY = 'XBTUSD'

function transformPrice(symbol, price) {
  const unit = precisionMap[symbol]
  const rate = 1 / unit
  return Math.round(price * rate) / rate
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
      scalping: {
        symbol: 'XBTUSD',
        config: {
          'XBTUSD': {
            risk: 10, // 暂时无用
            amount: 0, // 仓位, 根据凯里公式计算, 前端计算
            stopDistance: 10,
            side: 'Sell',
            openMethod: 'limit_auto', // or stop or market or limit or stop_auto
            openPrice: 0, // limit or stop price
            autoOffset: 0, // auto的偏移
            profitRate: 2,
            winRate: 0.5, // 胜率 0 - 1
            leverage: 1,
          },
          'ETHUSD': {
            risk: 10, // 暂时无用
            amount: 0, // 仓位, 根据凯里公式计算, 前端计算
            stopDistance: 1,
            side: 'Sell',
            openMethod: 'limit_auto', // or stop or market or limit or stop_auto
            openPrice: 0, // limit or stop price
            autoOffset: 0, // auto的偏移
            profitRate: 2,
            winRate: 0.5, // 胜率 0 - 1
            leverage: 1, // 杠杆, 目前只是用于存储, 给前端计算amount使用
          }
        }
      },
      limitStopProfit: { // 半自动化配置
        shortMode: false, // 空头市场，总是xbt套保
        shortBaseAmount: 0, // 大于零表示做空注意有套保
        kellyP: 0.5, // 只用作前端辅助计算套保仓位用, 凯里公式中的p 和 r
        kellyR: 2, 
        autoOrderProfit: true, // reduceOnly limit
        symbol: 'XBTUSD',
        side: 'Buy',
        risk: 100, //$100
        period: '4h',
        openMethod: 'limit',   // limit or stop
        defaultProfitRate: 2,
        symbolConfig: {
          'XBTUSD': {
            profitPx: 0,
            price: 0,
            side: 'Buy',
            stopPx: 0,
            openMethod: '',
            lastUpdateCostStop: 0,  // 记录上次设置保本止损单的时间，不能频繁
          },
          'ETHUSD': {
            profitPx: 0,
            price: 0,
            side: 'Buy',
            stopPx: 0,
            openMethod: '',
            lastUpdateCostStop: 0,
          },
        },
        tvAlertConfig: {
          'XBTUSD': {
            minStop: 40,
            maxStop: 150,
            risk: 100, // $
            maxAmount: 30000,
            profitRate: 2,
            enableLong: false,
            enableShort: false,
            supportIntervals: ['1h'],
            autoUpdateStop: true,       // 当盈利达到1：1.5后将止损移动到成本位
            profitRateForUpdateStop: 1.5,
            entryOffset: 0, // 入场偏移量, 比如熊市底部做多, 牛市顶部做空
            entryMaxPrice: 0, // 入场价格过滤器区间上
            entryMinPrice: 0, // 入场价格过滤器区间下
          },
          'ETHUSD': {
            minStop: 1,
            maxStop: 3,
            risk: 100, //$
            maxAmount: 15000,
            profitRate: 2,
            enableLong: false,
            enableShort: false,
            supportIntervals: ['1h'],
            autoUpdateStop: true,
            profitRateForUpdateStop: 1.5,
            entryOffset: 0,
            entryMaxPrice: 0, // 入场价格过滤器区间上
            entryMinPrice: 0, // 入场价格过滤器区间下
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
    this.watchQuoteUpdate(symbol)
  }

  watchQuoteUpdate(symbol) {
    const quto = this.getLatestQuote(symbol)
    let positionQty = this._accountPosition.getCurrentQty(symbol)
    const { symbolConfig, tvAlertConfig, shortBaseAmount } = this._options.limitStopProfit
    if (symbol === BASE_CURRENCY && positionQty < 0) {
      const safeQty = positionQty + Math.abs(shortBaseAmount)  // 出去套保的仓位
      if (safeQty < 0) {
        positionQty = safeQty
      } else {
        positionQty = 0
      }
    }
    let absPositionQty = Math.abs(positionQty)
    const currentConfig = symbolConfig[symbol]
    const currentTvConfig = tvAlertConfig[symbol]
    // 自动更新止损，放到止损位
    if (absPositionQty > 0 && currentTvConfig && currentTvConfig.autoUpdateStop) {
      const lastUpdateCostStopTime = new Date(currentConfig.lastUpdateCostStop)
      const now = new Date()
      // 最少10秒一次
      if (now - lastUpdateCostStopTime < 10 * 1000) {
        return
      }
      const longPosition = positionQty > 0
      const isConfigLong = currentConfig.side === 'Buy'
      const isSameSide = (isConfigLong && longPosition) || (!isConfigLong && !longPosition)
      //检查是否是相同的止损，否则不设置
      const stopOrders = this._accountOrder.getStopOrders(symbol, longPosition ? 'Sell' : 'Buy')
      const matchStopOrder = stopOrders.filter(o => o.stopPx === +currentConfig.stopPx)[0]
      if (isSameSide && matchStopOrder) {
        const profitAutoPrice = this.getShouldSetProfitPrice(symbol)
        // long
        if (longPosition && quto.bidPrice > profitAutoPrice) {
          this.setStopAtCostPrice(symbol)
          currentConfig.lastUpdateCostStop = +now
          // console.log('ssssset confi............')
        }
        // short
        if (!longPosition && quto.bidPrice < profitAutoPrice) {
          this.setStopAtCostPrice(symbol)
          currentConfig.lastUpdateCostStop = +now
        }
      }
    }
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
    return
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
    }, 30 * 1000)
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
      // this._notifyPhone(`${symbol} 1d high 1`)
      watchSignal(this, symbol, 'break1d', 'high1')
    } else if (highlow1Signal.low1) {
      // this._notifyPhone(`${symbol} 1d low 1`)
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
    const { symbol, side, amount, price, stopPx, openMethod } = data
    const sdk = this._orderManager.getSignatureSDK()
    const isOpenStop = openMethod === 'stop' || openMethod === 'stop_auto'
    if (isOpenStop) {
      // todo: 处理 price 立即成交的bug, 应该返回错误
      // stop open 可能比止损后触发，这个问题很大
      const quto = this.getLatestQuote(symbol)
      if (side === 'Buy') {
        if (+price <= quto.bidPrice) {
          return Promise.reject(`price error ${price} <=bidPrice ${quto.bidPrice}`)
        }
      } else {
        if (+price >= quto.askPrice) {
          return Promise.reject(`price error ${price} >=askPrice ${quto.askPrice}`)
        }
      }
      this._options.limitStopProfit.symbolConfig[symbol]['needCheckStopIfHasPosition'] = true
      this.saveConfigToFile()
    }
    return new Promise((resolve, reject) => {
      // orderStop 成功后才orderlimit
      sdk.orderStop(symbol, amount, stopPx, side === 'Buy' ? 'Sell' : 'Buy', true).then(() => {
        isOpenStop ?
          sdk.orderStop(symbol, amount, price, side, false).then(resolve).catch(reject)
          :
          sdk.orderLimit(symbol, amount, side, price).then(resolve).catch(reject)
      }).catch(e => {
        reject(e)
      })
    })
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
        // this._notifyPhone(`rsi divergence bot long! ${isNotLH} ${lowVolFilter} ${highBoDongFilter}`)
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
          // this._notifyPhone(`break candle bot signal! ${barTrendSignal.long ? 'long' : 'short'} upVolFilter${upVolFilter} adxFilter${adxFilter}`)
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
      'notify.on',
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
      'limitStopProfit',
      'scalping',
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

  setStopAtCostPrice(symbol) {
    const { shortBaseAmount } = this._options.limitStopProfit
    let positionQty = this._accountPosition.getCurrentQty(symbol)
    if (symbol === BASE_CURRENCY && positionQty < 0) {
      const safeQty = positionQty + Math.abs(shortBaseAmount)  //去掉套保仓位
      positionQty = Math.min(0, safeQty)
    }

    const urPnlProfit = this._accountPosition.getUrPnlProfit(symbol)
    const absPositionQty = Math.abs(positionQty)
    // const unit = precisionMap[symbol]
    return new Promise((resolve, reject) => {
      if (absPositionQty > 0) {
        if (urPnlProfit < 0) {
          reject('亏损中，不能设置保本止损')
          return
        }
        const costPrice = this._accountPosition.getCostPrice(symbol)
        const isLongPosition = positionQty > 0
        const priceOffset = costPrice * 0.00075
        let stopPrice = isLongPosition ? (costPrice + priceOffset) : (costPrice - priceOffset)
        stopPrice = transformPrice(symbol, stopPrice)
        const stopOrders = this._accountOrder.getStopOrders(symbol, isLongPosition ? 'Sell' : 'Buy')
        const matchStopOrder = stopOrders.filter(o => o.stopPx === +stopPrice)[0]
        if (matchStopOrder) {
          const qty = matchStopOrder.orderQty
          const lessQty = absPositionQty - qty
          if (lessQty > 0) {
            this._orderManager.getSignatureSDK().updateOrder({
              orderID: matchStopOrder.orderID,
              orderQty: matchStopOrder.orderQty + lessQty,
            }).then(resolve).catch(reject)
            this._notifyPhone(`bitmex ${symbol} ${isLongPosition} update stop at cost lessQty ${lessQty}`)
          } else {
            resolve('已经存在保本止损')
          }
        } else {
          this._orderManager.getSignatureSDK().orderStop(symbol, absPositionQty, stopPrice, isLongPosition ? 'Sell' : 'Buy', true).then(resolve).catch(reject)
          this._notifyPhone(`bitmex ${symbol} ${isLongPosition} set stop at cost`)
        }
      } else {
        resolve('没有仓位无需设置保本止损')
      }
    })
  }

  getShouldSetProfitPrice(symbol) {
    const { symbolConfig, tvAlertConfig } = this._options.limitStopProfit
    const currentConfig = symbolConfig[symbol]
    const currentTvConfig = tvAlertConfig[symbol]
    const { profitRateForUpdateStop } = currentTvConfig
    const isConfigLong = currentConfig.side === 'Buy'
    const stopGap = Math.abs(currentConfig.stopPx - currentConfig.price)
    const profitGap = profitRateForUpdateStop * stopGap
    let updatePrice = +currentConfig.price + (isConfigLong ? profitGap : -profitGap)
    return transformPrice(symbol, updatePrice)
  }

  checkOrderLimitStopProfitStaus(symbol) {
    const { shortMode, symbolConfig, shortBaseAmount } = this._options.limitStopProfit

    const currentConfig = symbolConfig[symbol]
    const isConfigLong = currentConfig.side === 'Buy'
    let hasPosition = false
    let positionQty = this._accountPosition.getCurrentQty(symbol)
    // 暂时不支持shortMode, 使用shortBaseAmount代替
    if (shortMode) {
      hasPosition = positionQty >= 0 // 需要优化，不正确
    } else {
      if (positionQty > 0) {
        hasPosition = true
      } else if (positionQty < 0) {
        hasPosition = true
        if (symbol === BASE_CURRENCY) {
          const safeQty = positionQty + Math.abs(shortBaseAmount)
          if (safeQty < 0) {  // 说明除了套保的仓位还有多余空仓
            hasPosition = true
            positionQty = safeQty
          } else {
            hasPosition = false
            positionQty = 0
          }
        }
      }
      // hasPosition = longQty ? true : this._accountPosition.hasPosition(symbol)
    }

    const absPositionQty = Math.abs(positionQty)

    if (hasPosition) {
      const longPosition = shortMode ?
        positionQty >= 0 : positionQty > 0
      // 同向
      const isSameSide = (isConfigLong && longPosition) || (!isConfigLong && !longPosition)
      // 2 get stop close order
      const stopOrders = this._accountOrder.getStopOrders(symbol, longPosition ? 'Sell' : 'Buy')
      const matchStopOrder = stopOrders.filter(o => o.stopPx === +currentConfig.stopPx)[0]
      if (matchStopOrder) {
        // 吻合
        if (isSameSide) {
          const reduceOnlyOrders = this._accountOrder.getReduceOnlyOrders(symbol)
          const matchReduceOnlyOrder = reduceOnlyOrders.filter(o => o.price === +currentConfig.profitPx)[0]
          const totalReduceQty = reduceOnlyOrders.reduce((sum, o) => sum + o.orderQty, 0)
          // const lessQty = absPositionQty - totalReduceQty
          let lessQty = Math.min(matchStopOrder.orderQty - totalReduceQty, absPositionQty - totalReduceQty)
          // const reduceOnlyOrder = this._accountOrder.getReduceOnlyOrders(symbol)[0]
          if (lessQty > 0) {
            if (!matchReduceOnlyOrder) {
              // start order
              this._orderManager.getSignatureSDK().orderReduceOnlyLimit(symbol, lessQty, longPosition ? 'Sell' : 'Buy', currentConfig.profitPx)
              const msg = `${symbol} postion & stop orders, but no reduce only order and order it ${lessQty}`
              console.log(msg)
              this._notifyPhone(msg, true)
            } else {
              // 可能 amount 不对
              const msg = `${symbol} reduce only qty is less, to add more`
              console.log(msg)
              this._notifyPhone(msg, true)

              this._orderManager.getSignatureSDK().updateOrder({
                orderID: matchReduceOnlyOrder.orderID,
                orderQty: matchReduceOnlyOrder.orderQty + lessQty,
              }).catch(e => {
                console.log(e)
              })
            }
          }
        }
      } else {
        if (currentConfig.needCheckStopIfHasPosition) {
          const msg = `${symbol} has no stop order and needCheckStopIfHasPosition`
          console.log(msg)
          this._notifyPhone(msg, true)
          this._orderManager.getSignatureSDK().orderStop(symbol, absPositionQty, currentConfig.stopPx, longPosition ? 'Sell' : 'Buy', true).then(() => {
            currentConfig.needCheckStopIfHasPosition = false
          })
        } else {
          // todo: check stopOrder
        }
      }
    }
  }

  setProfitReduceOnlyLimitOrder() {
    ['XBTUSD', 'ETHUSD'].forEach(symbol => this.checkOrderLimitStopProfitStaus(symbol))
  }
  // 处理tradingview alert
  watchTvAlert(params) {
    try {
      const { symbol, name, interval, long } = params
      const requiredKeys = ['symbol', 'name', 'interval', 'long', 'exchange']
      if (requiredKeys.some(k => params[k] === undefined)) {
        const msg = `${requiredKeys.toString()} is required in tv alert params`
        // console.log(msg)
        throw msg
      }
      if (params.exchange === 'BITMEX') {
        this.orderLimitStopProfitByParam(params)
      }
    } catch (e) {
      return Promise.reject(e)
    }
    return Promise.resolve()
  }

  promiseGetPrices(params) {
    const { symbol, name, interval, long, middlePrice, longStop, shortStop } = params
    if (middlePrice && ((long && longStop) || (!long && shortStop))) {
      return Promise.resolve({
        middlePrice,
        longStop,
        shortStop
      })
    }
    return new Promise((resolve, reject) => {
      this.waitForLastestCandle(symbol, interval).then(() => {
        const candleManager = this.getCandleManager(interval)
        const lastCandle = candleManager.getHistoryCandle(symbol)
        const { maxHigh, minLow } = candleManager.getMinMaxHighLow(symbol, 5)
        const precision = precisionMap[symbol]
        // const quto = this.getLatestQuote(symbol)
        let middlePrice = (lastCandle.high + lastCandle.low) / 2
        middlePrice = transformPrice(symbol, middlePrice)
        const longStop = minLow - precision
        const shortStop = maxHigh + precision
        resolve({
          middlePrice,
          longStop,
          shortStop
        })
      }).catch(reject)
    })
  }

  waitCandleAndOrderLimitStop(params) {
    const { symbol, name, interval, long } = params
    const symbolTvConfig = this._options.limitStopProfit.tvAlertConfig[symbol]
    return new Promise((resolve, reject) => {
      this.promiseGetPrices(params).then((prices) => {
        const { minStop, maxStop, risk, maxAmount, profitRate, entryOffset, entryMinPrice, entryMaxPrice } = symbolTvConfig
        const priceOffset = Math.max(+entryOffset, 0)

        if (name === 'A0') {
          const quto = this.getLatestQuote(symbol)
          const precision = precisionMap[symbol]
          const { middlePrice, longStop, shortStop } = prices
          let price, stopPx, profitPx, amount = 0

          if (long) {
            price = Math.min(middlePrice, quto.askPrice - precision) - priceOffset
            stopPx = longStop
            const lowestStopPx = price - maxStop
            const highestStopPx = price - minStop
            // 止损价格需要在指定范围内
            if (stopPx > highestStopPx) {
              stopPx = highestStopPx
            } else if (stopPx < lowestStopPx) {
              stopPx = lowestStopPx
            }
            stopPx = transformPrice(symbol, stopPx)
            const risks = price - stopPx
            profitPx = price + (risks * profitRate)
          } else {
            price = Math.max(middlePrice, quto.bidPrice + precision) + priceOffset
            stopPx = shortStop
            const highestStopPx = price + maxStop
            const lowestStopPx = price + minStop
            if (stopPx > highestStopPx) {
              stopPx = highestStopPx
            } else if (stopPx < lowestStopPx) {
              stopPx = lowestStopPx
            }
            stopPx = transformPrice(symbol, stopPx)
            const risks = stopPx - price
            profitPx = price - (risks * profitRate)
          }

          profitPx = transformPrice(symbol, profitPx)
          const diffP = Math.abs(stopPx - price)
          amount = Math.round((risk / diffP) * price)
          amount = Math.min(amount, maxAmount)

          const side = long ? 'Buy' : 'Sell'
          const openMethod = 'limit'
          const data = {
            symbol,
            side,
            openMethod,
            price,
            stopPx,
            profitPx,
            amount,
          }

          if (entryMinPrice > 0 && price < entryMinPrice) {
            this._notifyPhone(`[${symbol}] tv auto open but price(${price}) < entryMinPrice(${entryMinPrice})`)
            reject()
          } else if (entryMaxPrice > 0 && price > entryMaxPrice) {
            this._notifyPhone(`[${symbol}] tv auto open but price(${price}) > entryMaxPrice(${entryMaxPrice})`)
            reject()
          } else {
            console.log('tv auto open position!', data)
            this._notifyPhone(`[${symbol}] tv auto open position!`)

            this.orderLimitWithStop(data)
            // save config
            const curSymbolConfig = this._options.limitStopProfit.symbolConfig[symbol]
            curSymbolConfig.price = price
            curSymbolConfig.side = side
            curSymbolConfig.profitPx = profitPx
            curSymbolConfig.stopPx = stopPx
            curSymbolConfig.openMethod = openMethod
            this.saveConfigToFile()
            resolve()
          }
        }
      }).catch((errorMsg) => {
        console.log('waitForLastestCandle error:', errorMsg)
        reject()
      })
    })
  }

  waitForLastestCandle(symbol, period) {
    const candleManager = this.getCandleManager(period)
    if (!candleManager) {
      return Promise.reject(`${period} not support`)
    }
    // const oneHour = 3600 * 1000
    // const milSecMap = {
    //   '1h': oneHour,
    //   '4h': 24 * oneHour,
    // }
    // const milSec = milSecMap[period]
    // if (!milSec) {
    //   return Promise.reject(`${period} period not support`)
    // }

    const startTime = new Date()
    // 两分钟超时
    const maxTimeout = 2 * 60 * 1000
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const now = new Date()
        if (now - startTime > maxTimeout) {
          clearInterval(interval)
          reject('waitForLastestCandle time out')
          return
        }
        const lastCandle = candleManager.getHistoryCandle(symbol)
        if (!lastCandle) {
          clearInterval(interval)
          reject(`${symbol} s lastCandle not found!`)
          return
        }
        const candleTime = new Date(lastCandle.timestamp)
        const timePassed = now - candleTime
        // 
        // if (timePassed > milSec) {
        //   timePassed = timePassed - milSec
        // }
        const maxTime = 5 * 60 * 1000
        if (timePassed > 0 && timePassed < maxTime) {
          clearInterval(interval)
          resolve()
          return
        }
        // if (timePassed >= maxTime) {
        //   clearInterval(interval)
        //   reject('信号过时了, 取消运行')
        //   return
        // }
      }, 3000)
    })
  }

  orderLimitStopProfitByParam(params) {
    const { symbol, name, interval, long, middlePrice, longStop, shortStop } = params
    const symbolTvAlertConfig = this._options.limitStopProfit.tvAlertConfig[symbol]
    const msg = `tv bitmex ${symbol} ${name} ${interval} ${long}`
    // console.log(msg)
    // this._notifyPhone(msg)
    if (symbolTvAlertConfig) {
      // enableLong enableShort 目前只支持手动开启
      if (long && !symbolTvAlertConfig.enableLong || (!long && !symbolTvAlertConfig.enableShort)) {
        // console.log(`tv ${long ? 'long' : 'short'} is not enable`)
        return
      }
      if (symbolTvAlertConfig.supportIntervals.indexOf(interval) > -1) {
        this.waitCandleAndOrderLimitStop(params).then(() => {
          // 重置开关, 需要手动打开, 为了安全
          if (long) {
            symbolTvAlertConfig.enableLong = false
          } else {
            symbolTvAlertConfig.enableShort = false
          }
          this.saveConfigToFile()
        })
      }
    }
    // const { symbol, side, amount, price, stopPx, openMethod } = data
    // const sdk = this._orderManager.getSignatureSDK()
  }
  
  orderScalping(data) {
    let { symbol, risk, amount, side, openMethod, openPrice, autoOffset, profitRate, winRate, stopDistance, leverage, order } = data
    risk = +risk
    openPrice = +openPrice
    autoOffset = +autoOffset
    profitRate = +profitRate
    stopDistance = +stopDistance
    leverage = +leverage
    winRate = +winRate

    const scalpingConfig = this._options.scalping.config[symbol]

    this._options.scalping.config[symbol] = {
      ...scalpingConfig,
      risk, side, openMethod, openPrice, autoOffset, profitRate, stopDistance, leverage, winRate
    }

    this.saveConfigToFile()

    if (!order) {
      return Promise.resolve('保存成功')
    }

    const quote = this.getLatestQuote(symbol)
    const isLong = side === 'Buy'
    let price, stopPx, profitPx //,amount
    switch(openMethod) {
      case 'limit': // 限价
        if (isLong && openPrice > quote.bidPrice || (!isLong && openPrice < quote.askPrice)) {
          return Promise.reject(`limit open price不合理 ${side} ${openPrice} [${quote.bidPrice}, ${quote.askPrice}]`)
        }
        price = openPrice
        break
      case 'limit_auto': // 价距限价
        price = isLong ? (quote.bidPrice - autoOffset) : (quote.askPrice + autoOffset)
        break
      case 'market': // 市价
        // 这个price不一定是成交价, 只是要计算stopPx
        price = isLong ? quote.askPrice : quote.bidPrice
        break
      case 'stop': // 指定价格止损开仓
        if (isLong && openPrice < quote.askPrice || (!isLong && openPrice > quote.bidPrice)) {
          return Promise.reject(`stop open price不合理 ${side} ${openPrice} [${quote.bidPrice}, ${quote.askPrice}]`)
        }
        price = openPrice
        break
      case 'stop_auto': // 价距止损开仓
        // 这个price不一定是成交价, 只是要计算stopPx
        price = isLong ? (quote.askPrice + autoOffset) : (quote.bidPrice - autoOffset)
        break
      default:
        return Promise.reject(`${openMethod}不支持`)
    }
    price = transformPrice(symbol, price)
    stopPx = isLong ? (price - stopDistance) : (price + stopDistance)
    profitPx = price + (isLong ? 1 : -1) * stopDistance * profitRate
    
    stopPx = transformPrice(symbol, stopPx)
    profitPx = transformPrice(symbol, profitPx)

    // amount = Math.round((risk / stopDistance) * price)
    // save config
    const curSymbolConfig = this._options.limitStopProfit.symbolConfig[symbol]
    curSymbolConfig.price = price
    curSymbolConfig.side = side
    curSymbolConfig.profitPx = profitPx
    curSymbolConfig.stopPx = stopPx
    curSymbolConfig.openMethod = openMethod
    this.saveConfigToFile()

    if (['limit', 'limit_auto', 'stop', 'stop_auto'].indexOf(openMethod) > -1) {
      return this.orderLimitWithStop({
        symbol, side, amount, price, stopPx, openMethod, profitPx
      })
    }

    const sdk = this._orderManager.getSignatureSDK()

    // 市价
    if (openMethod === 'market') {

      return new Promise((resolve, reject) => {
        // orderStop 成功后才ordermarket
        sdk.orderStop(symbol, amount, stopPx, side === 'Buy' ? 'Sell' : 'Buy', true).then(() => {
          sdk.orderMarket(symbol, amount, side).then(resolve).catch(reject)
        }).catch(e => {
          reject(e)
        })
      })
    }
    
    return Promise.reject('未开仓, 不支持的openMethod')
  }
}

module.exports = FlowDataBase
