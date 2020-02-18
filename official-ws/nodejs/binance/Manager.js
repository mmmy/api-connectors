const BinanceSDK = require('./sdk')
const _ = require('lodash')
const args = require('../strategy/argv')
const Account = require('./Account')
const fs = require('fs')
const exchangeInfoManager = require('./exchangeInfoManager')
const defaultConfig = require('./common/symbolDefaultConfig')
const notifyPhoneUser = require('../strategy/notifyPhone').notifyPhoneUser

class BinanceManager {
  constructor(options) {
    this._options = _.merge({
      ...args,
      configFilePath: '',
      marginFilePath: '',  // 记录账户价值
      notify: {
        on: false,
        token: '',
        user: '',
      },
      testnet: true,
      limitStopProfit: {
        symbolConfig: defaultConfig.symbolConfigDefault
      }
    }, options)

    this.mergeConfigFromFile()
    this.accoutManager = new Account(this._options)

    exchangeInfoManager.fetchExchangeInfo()
    exchangeInfoManager.startIntervalToGetInfo(this._options.testnet)

    this.initAutoOrderProfitOrderInterval()

    console.log('BinanceManager options', { ...this._options, apiKey: '', apiSecret: '' })
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

  mergeConfigFromFile() {
    const configFromFile = this.getConfigFromFile()
    if (configFromFile) {
      console.log(this._options.user, 'BinanceManager读取到配置文件', this._options.configFilePath)
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

  listenJson(json, symbol) {
    console.log(json)
  }
  // {account:{}, orders:[]}
  getAccountData() {
    return this.accoutManager.getAccountData()
  }

  closePositionMarket(symbol) {
    return this.accoutManager.closePositionMarket(symbol)
  }

  getSignatureSDK() {
    return this.accoutManager.getSignatureSDK()
  }

  getExchangeInfo() {
    return exchangeInfoManager.getExchangeInfo()
  }

  orderLimitWithStop(data) {
    const { symbol, side, amount, price, stopPx, openMethod, profitPx } = data
    const sdk = this.getSignatureSDK()
    const isOpenStop = openMethod === 'stop'
    const newParams = exchangeInfoManager.adjustOrderParam(symbol, price, amount)
    if (isOpenStop) {
      return Promise.reject('stop open is not support')
      // todo
    }
    const closeSide = side === 'BUY' ? 'SELL' : 'BUY'
    return new Promise((resolve, reject) => {
      sdk.orderStop(symbol, newParams.quantity, stopPx, closeSide, true).then(() => {
        isOpenStop ?
          reject('stop open 暂不支持')
          :
          sdk.orderLimit(symbol, newParams.quantity, side, newParams.price).then((result) => {
            sdk.orderReduceOnlyLimitProfit(symbol, newParams.quantity, closeSide, profitPx, profitPx)
            // 保存数据，用来自动设置止盈止损用
            const curSymbolOrderConfig = this._options.limitStopProfit.symbolConfig[symbol].orderConfig
            curSymbolOrderConfig.price = price
            curSymbolOrderConfig.side = side
            curSymbolOrderConfig.profitPx = profitPx
            curSymbolOrderConfig.stopPx = stopPx
            curSymbolOrderConfig.openMethod = openMethod
            this.saveConfigToFile()
            resolve(result)
          }).catch(e => {
            console.log('binance manager orderLimitWithStop:orderLimit error', e)
            this._notifyPhone('binance manager orderLimitWithStop:orderLimit error', true)
          })
      }).catch(e => {
        console.log('binance manager orderLimitWithStop:orderStop error', e)
        this._notifyPhone('binance manager orderLimitWithStop:orderStop error', true)
        reject(e)
      })
    })
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

  saveConfigToFile() {
    const configToSave = {}
    let paths = [
      'notify',
      'limitStopProfit',
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

  _notifyPhone(msg, force) {
    const { on, token, user } = this._options.notify
    if ((on || force) && token && user) {
      notifyPhoneUser(`[${this._options.user}]${msg}`, token, user)
    }
  }

  // 处理tradingview alert
  watchTvAlert(params) {
    try {
      // const { symbol, name, interval, long } = params
      if (params.exchange !== 'BINANCE') {
        return
      }
      const requiredKeys = ['symbol', 'name', 'interval', 'long', 'exchange', 'middlePrice', 'longStop']
      if (requiredKeys.some(k => params[k] === undefined)) {
        const msg = `${requiredKeys.toString()} is required in tv alert params`
        console.log(msg)
        throw msg
      }
      const newParams = {
        ...params,
        symbol: params.symbol.replace('PERP', '') // 请查看tradingview
      }
      this.checkTVParamAndOrder(newParams)
    } catch (e) {
      console.log(e)
      return Promise.reject(e)
    }
    return Promise.resolve()
  }

  checkTVParamAndOrder(params) {
    const { symbol, name, interval, long } = params
    const currentSymbolConfig = this._options.limitStopProfit.symbolConfig[symbol]
    const symbolTvAlertConfig = currentSymbolConfig && currentSymbolConfig.tvAlertConfig
    const msg = `tv binance ${symbol} ${name} ${interval} ${long}`
    if (symbolTvAlertConfig) {
      // enableLong enableShort 目前只支持手动开启
      if (long && !symbolTvAlertConfig.enableLong || (!long && !symbolTvAlertConfig.enableShort)) {
        console.log(`tv ${long ? 'long' : 'short'} is not enable`)
        return
      }
      if (symbolTvAlertConfig.supportIntervals.indexOf(interval) > -1) {
        console.log(msg)
        this._notifyPhone(msg)
        this.orderLimitStopProfitByTVParam(params).then(() => {
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

  orderLimitStopProfitByTVParam(params) {
    const { symbol, name, interval, long, middlePrice, longStop } = params
    const symbolTvAlertConfig = this._options.limitStopProfit.symbolConfig[symbol].tvAlertConfig
    return new Promise((resolve, reject) => {
      if (name === 'A0') {
        const { minStop, maxStop, risk, maxAmount, profitRate } = symbolTvAlertConfig
        let price, stopPx, profitPx, amount = 0
        if (long) {
          price = exchangeInfoManager.transformPrice(symbol, middlePrice)
          stopPx = longStop
          const lowestStopPx = price - maxStop
          const highestStopPx = price - minStop
          // 止损价格需要在指定范围内
          if (stopPx > highestStopPx) {
            stopPx = highestStopPx
          } else if (stopPx < lowestStopPx) {
            stopPx = lowestStopPx
          }
          stopPx = exchangeInfoManager.transformPrice(symbol, stopPx)
          const risks = price - stopPx
          profitPx = price + (risks * profitRate)
          profitPx = exchangeInfoManager.transformPrice(symbol, profitPx)
          const diffP = Math.abs(stopPx - price)
          amount = Math.round((risk / diffP) * price)
          amount = Math.min(amount, maxAmount)
          const side = long ? 'BUY' : 'SELL'
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
          this._notifyPhone(`binance [${symbol}] tv auto open position!`)
          this.orderLimitWithStop(data)
          resolve()
        } else {
          reject('short not support!')
        }
        // todo: short
      }
    })
  }

  initAutoOrderProfitOrderInterval() {
    this._checkAutoOrderProfitOrderInterval = setInterval(() => {
      this.setProfitReduceOnlyLimitOrder()
    }, 30 * 1000)
  }

  setProfitReduceOnlyLimitOrder() {
    exchangeInfoManager.getAllSymbols().forEach(symbol => this.checkOrderLimitStopProfitStaus(symbol))
  }

  checkOrderLimitStopProfitStaus(symbol) {
    const curSymbolConfig = this._options.limitStopProfit.symbolConfig[symbol]
    if (!curSymbolConfig) {
      return
    }
    const { tvAlertConfig, orderConfig } = curSymbolConfig
    // 开关没开启
    if (!tvAlertConfig.autoOrderProfit) {
      return
    }
    const pData = this.accoutManager.findPostion(symbol)
    if (!pData || !pData.pa) {
      return
    }

    const positionQty = pData.pa
    const absPositionQty = Math.abs(positionQty)
    if (!absPositionQty) {
      return
    }
    const isConfigLong = orderConfig.side === 'BUY'
    const longPosition = positionQty > 0
    const isSameSide = (isConfigLong && longPosition) || (!isConfigLong && !longPosition)
    if (isSameSide) {
      const closeSide = longPosition ? 'SELL' : 'BUY'
      const stopOrders = this.accoutManager.getStopOrders(symbol, closeSide)
      const matchStopOrder = stopOrders.filter(o => +o.stopPrice === +orderConfig.stopPx)[0]
      if (matchStopOrder) {
        const profitOrders = this.accoutManager.getProfitOrders(symbol, closeSide)
        // const matchProfitOrder = profitOrders.filter(o => +o.stopPrice === +orderConfig.profitPx)[0]
        const totalProfitQty = profitOrders.reduce((sum, o) => sum + (+o.origQty), 0)
        const lessQty = absPositionQty - totalProfitQty
        if (lessQty > 0) {
          const msg = `BIANACE ${symbol} postion & stop orders, but profit order is less ${lessQty}`
          this._notifyPhone(msg, true)
          this.getSignatureSDK().orderReduceOnlyLimitProfit(symbol, lessQty, closeSide, orderConfig.profitPx, orderConfig.profitPx)
        }
      }
    } else {
      // check stopOrder
    }

  }
}

module.exports = BinanceManager
