const _ = require('lodash')
const BinanceSDK = require('./sdk')
const WebSocketClient = require('../lib/ReconnectingSocket')
const utils = require('./common/utils')

const NOT_STATUS = ['FILLED', 'CANCELED', 'STOPPED', 'REJECTED', 'EXPIRED']

const OrderKeyMap = {
  s: 'symbol',
  c: 'clientOrderId',
  S: 'side',
  o: 'type',
  f: 'timeInForce',
  q: 'origQty',
  p: 'price',
  ap: 'avgPrice',
  sp: 'stopPrice',
  X: 'status',
  i: 'orderId',
  z: 'executedQty',
  R: 'reduceOnly',
  wt: 'workingType'
}

function transformOrderData(wsData) {
  const newData = {}
  Object.getOwnPropertyNames(wsData).forEach(key => {
    const newKey = OrderKeyMap[key]
    if (newKey) {
      newData[newKey] = wsData[key]
    }
  })
  return newData
}

//https://binance-docs.github.io/apidocs/testnet/cn/#060a012f0b
class AccountDataManager {
  constructor() {
    this._accountData = { assets: [], positions: [] }
    this._ordersData = []
  }

  listenData(data) {
    switch (data.e) {
      case 'ACCOUNT_UPDATE':
        this.updateAccountData(data)
        break
      case 'ORDER_TRADE_UPDATE':
        this.updateOrdersData(data)
        break
      default:
        console.log('AccountDataManager listenData not support event', data.e)
        break
    }
  }

  updateAccountData(data) {
    try {
      const wsData = data.a
      // const newData = transformAccountData(wsData)
      // this._accountData = _.merge(this._accountData, newData)
      // update assets
      wsData.B.forEach(a => {
        const asset = a.a
        const walletBalance = a.wb
        const cw = a.cw
        if (this._accountData.assets && this._accountData.assets.length > 0) {
          const assetData = this._accountData.assets.find(d => d.asset === asset)
          if (assetData) {
            assetData.walletBalance = walletBalance
            assetData.cw = cw
          }
        }
      })
      // update postions
      wsData.P.forEach(p => {
        const newP = {
          symbol: p.s,
          pa: p.pa,
          entryPrice: p.ep,
          cr: p.cr,
          unrealizedProfit: p.up,
          isolated: p.mt === 'isolated',
          initialMargin: p.iw,
        }

        if (this._accountData.positions) {
          const positionData = this._accountData.positions.find(d => d.symbol === newP.symbol)
          if (positionData) {
            _.merge(positionData, newP)
          } else {
            this._accountData.positions.push(newP)
          }
        }
      })
    } catch (e) {
      console.log('ws updateAccountData error', e)
    }
  }

  setAccountData(data) {
    this._accountData = data
  }

  setOrders(orders) {
    this._ordersData = orders || []
  }

  updateOrdersData(data) {
    const order = transformOrderData(data.o)
    this._ordersData = this._ordersData.filter(o => o.symbol !== order.symbol || o.orderId !== order.orderId)
    this._ordersData.push(order)
    if (NOT_STATUS.indexOf(order.status) > -1) {
      // 一天后过滤掉没有用的
      setTimeout(() => {
        this._filterOrder(order)
      }, 24 * 3600 * 1000)
    }
  }

  _filterOrder(order) {
    this._ordersData = this._ordersData.filter(o => o.symbol !== order.symbol || o.orderId !== order.orderId)
  }

  getData() {
    return {
      account: this._accountData,
      orders: this._ordersData,
    }
  }

  getValidOrders() {
    return this._ordersData.filter(o => NOT_STATUS.indexOf(o.status) === -1)
  }

  getStopOrders(symbol, side) {
    return this.getValidOrders().filter(o =>
      o.type === 'STOP_MARKET' &&
      o.symbol === symbol &&
      o.side === side
    )
  }

  getProfitOrders(symbol, side) {
    return this.getValidOrders().filter(o =>
      o.type === 'TAKE_PROFIT' &&
      o.symbol === symbol &&
      o.side === side
    )
  }
}

class Account {
  constructor(options) {
    this._options = _.merge({
      apiKey: '',
      apiSecret: '',
      testnet: true,
    }, options)
    this._listenKey = ''

    this.wsClient = new WebSocketClient(this._options)
    this.wsClient.onopen = this._onopen.bind(this)
    this.wsClient.onclose = this._onclose.bind(this)
    this.wsClient.onmessage = this._onmessage.bind(this)
    this.wsClient.onerror = this._onerror.bind(this)
    this.wsClient.onend = this._onend.bind(this)

    this._accountDataManager = new AccountDataManager()

    if (this._options.apiKey && this._options.apiSecret) {
      this._userSdk = new BinanceSDK(this._options)
      this.initAccountData()
      this.initOrdersData()
      this.openAccountWs()
      this.initUpdateListenKey()
      this.initUpdateAccountInterval()
    }
  }
  // 手动更新下数据
  refreshWsData() {
    return new Promise((resolve, reject) => {
      this._userSdk.orderReduceOnlyLimitProfit(
        'BTCUSDT', 1, 'BUY', 1000, 1000
      ).then(json => {
        this._userSdk.deleteOrder('BTCUSDT', json.orderId).then(json => {
          console.log('account delete ok', json)
        }).catch(e => {
          console.log('account delete order error', e)
        })
        resolve(json)
      }).catch(reject)
    })
  }

  initAccountData() {
    if (this._userSdk) {
      this._userSdk.getAccountData().then(json => {
        this._accountDataManager.setAccountData(json)
      }).catch(e => console.log('initAccountData error', e))
    }
  }

  initUpdateAccountInterval() {
    // 一个小时更新一次
    this._updateAccountDataInterval = setInterval(() => {
      this.initAccountData()
    }, 3600 * 1000)
  }

  initOrdersData() {
    if (this._userSdk) {
      this._userSdk.getOpenOrders().then(json => {
        this._accountDataManager.setOrders(json)
      }).catch(e => console.log('initOrdersData error', e))
    }
  }

  initUpdateListenKey() {
    // 每59分钟延长key一次，因为一次有效为一个小时
    this._interval = setInterval(() => {
      this._userSdk.overtimeListenKey().catch(e => {
        console.log('延长listenkey 失败', e)
      })
    }, 59 * 60 * 1000)
  }

  getListenKey() {
    return new Promise((resolve, reject) => {
      this._userSdk.getAccountListenKey().then(json => {
        this._listenKey = json.listenKey
        resolve(json.listenKey)
      }).catch(reject)
    })
  }

  openAccountWs() {
    if (this._userSdk) {
      this._listenKey = ''
      this.getListenKey().then(() => {
        this._openWs()
      }).catch(e => {
        console.log('get listenKey error', e)
      })
    }
  }

  getWsUrl() {
    const baseurl = utils.getWsEndpoint(this.options.testnet)
    const url = `${baseurl}/ws/${this._listenKey}`
    return url
  }

  _openWs() {
    this.wsClient.close()
    const baseurl = utils.getWsEndpoint(this._options.testnet)
    const url = `${baseurl}/ws/${this._listenKey}`
    this.wsClient.open(url)
  }

  _onopen() {
    this.wsClient.addListener('reconnect', () => {
      console.log('recconect Account ws: start get listenKey')
      this.getListenKey().then(() => {
        this.wsClient.url = this.getWsUrl()
      })
    })
  }

  _onclose() {
    console.log('Account ws closed...')
  }

  _onmessage(data) {
    try {
      data = JSON.parse(data)
    } catch (e) {
      console.log('binace Account Unable to parse incoming data:', e)
      return
    }
    this._accountDataManager.listenData(data)
    // console.log(this._accountDataManager.getData())
    // console.log(data)
  }

  _onerror(e) {
    console.log('Account ws error...', e)
  }

  _onend(code) {
    console.log('Account ws end...', code)
  }

  getAccountData() {
    return this._accountDataManager.getData()
  }

  findPostion(symbol) {
    return this.getAccountData().account.positions.find(p => p.symbol === symbol)
  }

  closePositionMarket(symbol) {
    const pData = this.findPostion(symbol)
    if (!pData) {
      return Promise.reject(`${symbol} postion not found`)
    }
    let pa = pData.pa
    if (pa) {
      pa = + pa
      const side = pa > 0 ? 'SELL' : 'BUY'
      return this._userSdk.orderMarketReduceOnly(symbol, Math.abs(pa), side)
    } else {
      return Promise.reject(`${symbol} position quantity not found`)
    }
  }

  getSignatureSDK() {
    return this._userSdk
  }

  getStopOrders(symbol, side) {
    return this._accountDataManager.getStopOrders(symbol, side)
  }

  getProfitOrders(symbol, side) {
    return this._accountDataManager.getProfitOrders(symbol, side)
  }
}

module.exports = Account
