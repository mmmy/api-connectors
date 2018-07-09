
var httpClient = require('./httpClient')
const querystring = require('querystring')
var BASE_URL = 'https://www.bitmex.com/api/v1'

function getUrl(path, query) {
  return BASE_URL + path + (query ? `?${query}` : '')
}

function formatGetParams(params, defaultParams) {
  params = {
    ...defaultParams,
    ...params
  }
  return querystring.stringify(params)
}

const Bitmex = {}

Bitmex.getTradeHistory = function(params) {
  var path = '/trade/bucketed'
  var paramstr = formatGetParams(params, {
    binSize: '5m',
    partial: false,
    count: 30,
    reverse: true,
  })
  var url = getUrl(path, paramstr)
  return httpClient.get(url)
}


module.exports = Bitmex

//test
// Bitmex.getTradeHistory({symbol: 'XBTUSD'}).then((json) => {
//   console.log(json)
// })