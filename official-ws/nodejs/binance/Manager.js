const BinanceSDK = require('./sdk')
const _ = require('lodash')
const args = require('../strategy/argv')
const Account = require('./Account')
const fs = require('fs')
const exchangeInfoManager = require('./exchangeInfoManager')
const defaultConfig = require('./common/symbolDefaultConfig')

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

    console.log('BinanceManager options', {...this._options, apiKey: '', apiSecret: '' })
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
    const { symbol, side, amount, price, stopPx, openMethod } = data
    const sdk = this.getSignatureSDK()
    const isOpenStop = openMethod === 'stop'
    const newParams = exchangeInfoManager.adjustOrderParam(symbol, price, amount)
    if (isOpenStop) {
      // todo
    }
    return Promise.all([
      sdk.orderStop(symbol, newParams.quantity, stopPx, side === 'BUY' ? 'SELL' : 'BUY', true),
      isOpenStop ?
      Promise.reject('stop open 暂不支持')
      :
      sdk.orderLimit(symbol, newParams.quantity, side, newParams.price)
    ])
  }
}

module.exports = BinanceManager