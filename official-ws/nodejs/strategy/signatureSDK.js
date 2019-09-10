var httpClient = require('./httpClient')
var crypto = require('crypto')

const SYMBOL = 'XBTUSD'

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  // "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
}

function requestWidthHeader(url, params, headers, method) {
  return new Promise((resolve, reject) => {
    // console.log(url, params, headers)
    const options = {
      timeout: 10000,
      headers: headers
    }

    const request = method === 'get' ?
      httpClient.get(url, options) :
      httpClient[method](url, params, options)

    request.then(data => {
      let json = JSON.parse(data)
      resolve(json)
    }).catch(error => {
      reject(error)
    })
  })
}

class SignatureSDK {
  constructor(options) {
    this._options = {
      ...options
    }
  }

  getUrl(path) {
    const BASE_URL = this._options.testnet ? 'https://testnet.bitmex.com' : 'https://www.bitmex.com'
    return `${BASE_URL}${path}`
  }

  getHeaders(verb, path, data) {
    // 一分钟过期
    var expires = Math.round(Date.now() / 1000) + 60
    var postBody = typeof data === 'string' ? data : JSON.stringify(data)
    const { apiKey, apiSecret } = this._options

    var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex')
    return {
      ...DEFAULT_HEADERS,
      'api-expires': expires,
      'api-key': apiKey,
      'api-signature': signature
    }
  }

  order(params) {
    var path = '/api/v1/order'
    const url = this.getUrl(path)
    const headers = this.getHeaders('POST', path, params)
    return requestWidthHeader(url, params, headers, 'post')
  }

  orderMarket(symbol, orderQty, side = "Buy") {
    const data = { symbol: symbol, orderQty, side, ordType: "Market" }
    return this.order(data)
  }
  // 市价止损 , 所有市价 手续费太高0.075%
  //{"ordType":"Stop","stopPx":6520,"orderQty":1000,"side":"Buy","execInst":"Close,LastPrice","symbol":"XBTUSD","text":"Submission from testnet.bitmex.com"}
  orderStop(symbol, orderQty, stopPx, side, stop_close) {
    const instes = ['LastPrice']
    if (stop_close !== false) {
      instes.push('Close')
    }
    const data = { symbol: symbol, orderQty, stopPx, side, ordType: "Stop", execInst: instes.join(',') }
    return this.order(data)
  }
  // 市价止盈
  //{"ordType":"MarketIfTouched","stopPx":6400,"orderQty":1000,"side":"Buy","execInst":"Close,LastPrice","symbol":"XBTUSD","text":"Submission from testnet.bitmex.com"}
  orderMarketTouched(symbol, orderQty, stopPx, side) {
    const data = { symbol: symbol, orderQty, stopPx, side, ordType: "MarketIfTouched", execInst: "Close,LastPrice" }
    return this.order(data)
  }
  // 限价手续费是-0.025%, 所以最好买入用orderLimit, displayQty: 0, 隐藏订单, 不显示到orderbook, 但是要收手续费
  // "ParticipateDoNotInitiate" : 一定返佣 否则系统会取消订单
  orderLimit(symbol, orderQty, side, price) {
    const data = { symbol: symbol, orderQty, side, price, ordType: 'Limit', execInst: "ParticipateDoNotInitiate" }
    return this.order(data)
  }
  // 只减仓
  orderReduceOnlyLimit(symbol, orderQty, side, price) {
    const data = { symbol: symbol, orderQty, side, price, ordType: 'Limit', execInst: "ParticipateDoNotInitiate,ReduceOnly" }
    return this.order(data)
  }
  // 限价止损, 手续费是负数, 你懂的
  orderStopLimit(symbol, orderQty, stopPx, side, price) {
    const data = { symbol: symbol, orderQty, stopPx, price, side, ordType: 'StopLimit', execInst: "Close,LastPrice" }
    return this.order(data)
  }
  // 限价止盈, 手续费是负数
  orderProfitLimitTouched(symbol, orderQty, stopPx, side, price) {
    const data = { symbol: symbol, orderQty, side, stopPx, price, ordType: 'LimitIfTouched', execInst: "Close,LastPrice" }
    return this.order(data)
  }

  // 更新一个订单，需要传入{orderId: , ... }， 可以修改orderQty, price等
  updateOrder(params) {
    var path = '/api/v1/order'
    const url = this.getUrl(path)
    const headers = this.getHeaders('PUT', path, params)
    return requestWidthHeader(url, params, headers, 'put')
  }

  deleteOrder(orderID) {
    const data = { orderID }
    const path = '/api/v1/order'
    const url = this.getUrl(path)
    const headers = this.getHeaders('DELETE', path, data)
    return requestWidthHeader(url, data, headers, 'delete')
  }
  // 删除所有挂单
  deleteOrderAll() {
    const data = { filter: {} }
    const path = '/api/v1/order/all'
    const url = this.getUrl(path)
    const headers = this.getHeaders('DELETE', path, data)
    return requestWidthHeader(url, data, headers, 'delete')
  }

  getPosition(symbol) {
    const filterString = encodeURIComponent(`{"symbol":"${symbol}"}`)
    const path = `/api/v1/position?filter=${filterString}`
    const url = this.getUrl(path)
    const data = ''
    const headers = this.getHeaders('GET', path, data)
    return requestWidthHeader(url, {}, headers, 'get')
  }

  closePositionMarket(symbol) {
    const data = { symbol: symbol, ordType: "Market", execInst: "Close" }
    return this.order(data)
  }

  changeLeverage(symbol, leverage) {
    const data = { symbol, leverage }
    const path = '/api/v1/position/leverage'
    const url = this.getUrl(path)
    const headers = this.getHeaders('POST', path, data)
    return requestWidthHeader(url, data, headers, 'post')
  }
}


module.exports = SignatureSDK
