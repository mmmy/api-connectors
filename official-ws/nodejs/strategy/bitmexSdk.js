
var httpClient = require('./httpClient')
const querystring = require('querystring')
var BASE_URL = 'https://www.bitmex.com/api/v1'
var TESTNET_BASE_URL = 'https://testnet.bitmex.com/api/v1'

function getUrl(path, query, testnet) {
  return (testnet ? TESTNET_BASE_URL : BASE_URL) + path + (query ? `?${query}` : '')
}

function formatGetParams(params, defaultParams) {
  params = {
    ...defaultParams,
    ...params
  }
  return querystring.stringify(params)
}

const Bitmex = {}
// 注意交易所返回的时间是 candle 结束的时间， 比如2018-07-17T16:00:00.000Z 实际上在tradingview 上显示的前1小时
Bitmex.getTradeHistory = function (params, testnet) {
  var path = '/trade/bucketed'
  var paramstr = formatGetParams(params, {
    symbol: 'XBTUSD',
    binSize: '5m',
    partial: false,               // 是false 会导致 最后实时数据candle 中 open high low 不准确, 但是经过一个时间周期后就ok, 比如1小时线, 经过一个小时后, 数据就准确了
    count: 30,
    reverse: true,
  })
  var url = getUrl(path, paramstr, testnet)
  return httpClient.get(url)
}


module.exports = Bitmex

//test
// Bitmex.getTradeHistory({symbol: 'XBTUSD'}).then((json) => {
//   console.log(json)
// })