var httpClient = require('../../strategy/httpClient')
var crypto = require('crypto')

const BaseUrl = 'https://fapi.binance.com'
const TestBaseUrl = 'https://testnet.binancefuture.com'

function adjustParam(params) {
  const timestamp = +new Date()
  const recvWindow = 20 * 1000
  return {
    ...params,
    recvWindow,
    timestamp,
  }
}

function requestWithHeader(path, params, headers, method) {
  return new Promise((resolve, reject) => {
    const options = {
      timeout: 10000,
      headers,
    }
    const paramStr = Object.getOwnPropertyNames(params).map(key => `${key}=${params[key]}`).join('&')
    const request = method === 'get' ?
      httpClient.get(`${path}?${paramStr}`, options) :
      httpClient[method](path, paramStr, options)
    
    request.then(data => {
      let json = JSON.parse(data)
      resolve(json)
    }).catch(error => {
      reject(error)
    })
  })
}
/*
 _options = {
   testnet: true
 }
*/
class BinanceSDK {
  constructor(options) {
    this._options = {
      testnet: true,
      ...options
    }
  }

  getUrl(path) {
    const BASE_URL = this._options.testnet ? TestBaseUrl : BaseUrl
    return `${BASE_URL}${path}`
  }

  getHeaders() {
    const { apiKey } = this._options
    return {
      'X-MBX-APIKEY': apiKey,
      "Content-Type": "text/plain",
    }
  }
  
  getSignature(params) {
    const { apiSecret } = this._options
    const paramStr = Object.getOwnPropertyNames(params).map(key => `${key}=${params[key]}`).join('&')
    return crypto.createHmac('sha256', apiSecret).update(paramStr).digest('hex')
  }

  order(params) {
    const path = '/fapi/v1/order'
    const url = this.getUrl(path)

    let querys = adjustParam(params)
    const signature = this.getSignature(querys)
    querys.signature = signature
    const headers = this.getHeaders()
    return requestWithHeader(url, querys, headers, 'form_post')
  }
  // side: BUY, SELL
  orderMarket(symbol, quantity, side) {
    const data = { symbol, quantity, side, type: 'MARKET' }
    return this.order(data)
  }
  orderMarketReduceOnly(symbol, quantity, side) {
    const data = { symbol, quantity, side, type: 'MARKET', reduceOnly: true}
    return this.order(data)
  }
  // 市价止损
  orderStop(symbol, quantity, stopPrice, side, reduceOnly=true) {
    const data = {
      symbol,
      quantity,
      side,
      type: 'STOP_MARKET',
      reduceOnly,
      stopPrice,
    }
    return this.order(data)
  }
  // 限价, 一般用来开仓
  orderLimit(symbol, quantity, side, price) {
    const data = {
      symbol,
      quantity,
      side,
      price,
      timeInForce: 'GTC',
      type: 'LIMIT',
    }
    return this.order(data)
  }
  // 只减仓
  orderReduceOnlyLimit(symbol, quantity, side, price) {
    const data = {
      symbol,
      quantity,
      side,
      price,
      timeInForce: 'GTC',
      type: 'LIMIT',
      reduceOnly: true,
    }
    return this.order(data)
  }
  // 限价止盈，因为可以空仓设置，所以设置这个不错
  orderReduceOnlyLimitProfit(symbol, quantity, side, price, stopPrice) {
    const data = {
      symbol,
      quantity,
      side,
      price,
      stopPrice,
      type: 'TAKE_PROFIT',
      reduceOnly: true,
    }
    return this.order(data)
  }

  deleteOrder(symbol, orderId) {
    const url = this.getUrl('/fapi/v1/order')
    let data = {
      symbol,
      orderId
    }
    data = adjustParam(data)
    const headers = this.getHeaders()
    const signature = this.getSignature(data)
    data.signature = signature
    return requestWithHeader(url, data, headers, 'form_delete')
  }

  deleteOrderAll(symbol) {
    const url = this.getUrl('/fapi/v1/allOpenOrders')
    let data = {
      symbol,
    }
    data = adjustParam(data)
    const headers = this.getHeaders()
    const signature = this.getSignature(data)
    data.signature = signature
    return requestWithHeader(url, data, headers, 'form_delete')
  }
  // 生成一个ws listenkey, 有效期为60分钟
  getAccountListenKey() {
    const url = this.getUrl('/fapi/v1/listenKey')
    const data = adjustParam({})
    const headers = this.getHeaders()
    const signature = this.getSignature(data)
    data.signature = signature
    return requestWithHeader(url, data, headers, 'form_post')
  }
  // 将当前key延长60分钟
  overtimeListenKey() {
    const url = this.getUrl('/fapi/v1/listenKey')
    const data = adjustParam({})
    const headers = this.getHeaders()
    const signature = this.getSignature(data)
    data.signature = signature
    return requestWithHeader(url, data, headers, 'form_put')
  }
  //不带symbol参数，会返回所有交易对的挂单
  getOpenOrders(symbol) {
    const url = this.getUrl('/fapi/v1/openOrders')
    const data = adjustParam(symbol ? {symbol} : {})
    const headers = this.getHeaders()
    const signature = this.getSignature(data)
    data.signature = signature
    return requestWithHeader(url, data, headers, 'get')
  }

  getAccountData() {
    const url = this.getUrl('/fapi/v1/account')
    const data = adjustParam({})
    const headers = this.getHeaders()
    const signature = this.getSignature(data)
    data.signature = signature
    return requestWithHeader(url, data, headers, 'get')
  }
}

module.exports = BinanceSDK