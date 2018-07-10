var httpClient = require('./httpClient')
var { apiKey, apiSecret } = require('./secret.json')
var crypto = require('crypto')

const BASE_URL = 'https://testnet.bitmex.com'
const SYMBOL = 'XBTUSD'

function getUrl(path) {
  return `${BASE_URL}${path}`
}

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  // "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
}

function getHeaders(verb, path, data) {
  var expires = new Date().getTime() + (60 * 1000)
  var postBody = JSON.stringify(data)
  var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex')
  return {
    ...DEFAULT_HEADERS,
    'api-expires': expires,
    'api-key': apiKey,
    'api-signature': signature
  }
}

function postRequest(url, params, headers) {
  return new Promise((resolve, reject) => {
    console.log(url, params, headers)
    httpClient.post(url, params, {
          timeout: 3000,
          headers: headers
      }).then(data => {
          let json = JSON.parse(data)
          resolve(json)
      }).catch(error => {
          reject(error)
      })
  })
}

function order(params) {
  var path = '/api/v1/order'
  const url = getUrl(path)
  const headers = getHeaders('POST', path, params)
  return postRequest(url, params, headers)
}

exports.orderMarket = function(orderQty, side="Buy") {
  const data = {symbol: SYMBOL, orderQty, side, ordType:"Market"}
  return order(data)
}
// 市价止损
//{"ordType":"Stop","stopPx":6520,"orderQty":1000,"side":"Buy","execInst":"Close,LastPrice","symbol":"XBTUSD","text":"Submission from testnet.bitmex.com"}
exports.orderStop = function(orderQty, stopPx, side) {
  const data = {symbol: SYMBOL, orderQty, stopPx, side, ordType:"Stop", execInst:"Close,LastPrice"}
  return order(data)
}
// 市价止盈
//{"ordType":"MarketIfTouched","stopPx":6400,"orderQty":1000,"side":"Buy","execInst":"Close,LastPrice","symbol":"XBTUSD","text":"Submission from testnet.bitmex.com"}
exports.orderMarketTouched = function(orderQty, stopPx, side) {
  const data = {symbol: SYMBOL, orderQty, stopPx, side, ordType:"MarketIfTouched", execInst:"Close,LastPrice"}
  return order(data)
}
