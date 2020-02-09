var httpClient = require('../../strategy/httpClient')

const BaseUrl = 'https://fapi.binance.com'
const TestBaseUrl = 'https://testnet.binancefuture.com'

function getUrl(testnet, path) {
  return `${testnet ? TestBaseUrl : BaseUrl}${path}`
}

exports.getExchangeInfo = function(testnet) {
  const url = getUrl(testnet, '/fapi/v1/exchangeInfo')
  return httpClient.get(url)
}
