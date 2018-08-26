var httpClient = require('./httpClient')
var crypto = require('crypto')

const SYMBOL = 'XBTUSD'

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  // "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
}

function requestWidthHeader(url, params, headers, method) {
  return new Promise((resolve, reject) => {
    console.log(url, params, headers)
    httpClient[method](url, params, {
          timeout: 10000,
          headers: headers
      }).then(data => {
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
    var expires = new Date().getTime() + (60 * 1000)
    var postBody = JSON.stringify(data)
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

  orderMarket(orderQty, side="Buy") {
    const data = {symbol: SYMBOL, orderQty, side, ordType:"Market"}
    return this.order(data)
  }
  // 市价止损 , 所有市价 手续费太高0.075%
  //{"ordType":"Stop","stopPx":6520,"orderQty":1000,"side":"Buy","execInst":"Close,LastPrice","symbol":"XBTUSD","text":"Submission from testnet.bitmex.com"}
  orderStop(orderQty, stopPx, side) {
    const data = {symbol: SYMBOL, orderQty, stopPx, side, ordType:"Stop", execInst:"Close,LastPrice"}
    return this.order(data)
  }
  // 市价止盈
  //{"ordType":"MarketIfTouched","stopPx":6400,"orderQty":1000,"side":"Buy","execInst":"Close,LastPrice","symbol":"XBTUSD","text":"Submission from testnet.bitmex.com"}
  orderMarketTouched(orderQty, stopPx, side) {
    const data = {symbol: SYMBOL, orderQty, stopPx, side, ordType:"MarketIfTouched", execInst:"Close,LastPrice"}
    return this.order(data)
  }
  // 限价手续费是-0.025%, 所以最好买入用orderLimit, displayQty: 0, 隐藏订单, 不显示到orderbook
  orderLimit(orderQty, side, price) {
    const data = {symbol: SYMBOL, orderQty, side, price, ordType: 'Limit', displayQty: 0}
    return this.order(data)
  }
  // 限价止损, 手续费是负数, 你懂的
  orderStopLimit(orderQty, stopPx, side, price) {
    const data = {symbol: SYMBOL, orderQty, stopPx, price, side, ordType: 'StopLimit', execInst:"Close,LastPrice"}
    return this.order(data)
  }
  // 限价止盈, 手续费是负数
  orderProfitLimitTouched(orderQty, stopPx, side, price) {
    const data = {symbol: SYMBOL, orderQty, side, stopPx, price, ordType: 'LimitIfTouched', execInst:"Close,LastPrice"}
    return this.order(data)
  }
  
  deleteOrder(orderID) {
    const data = { orderID }
    const path = '/api/v1/order'
    const url = this.getUrl(path)
    const headers = this.getHeaders('DELETE', path, data)
    return requestWidthHeader(url, data, headers, 'delete')
  }
  
  getPosition() {
    const path = '/api/v1/position'
    const url = this.getUrl(path)
    const data = {
      filter: {
        symbol: 'XBTUSD'
      }
    }
    const headers = this.getHeaders('GET', path, data)
    return requestWidthHeader(url, data, headers, 'get')
  }

}


module.exports = SignatureSDK
