
var signatureSDK = require('../signatureSDK')

// test short
// sell
signatureSDK.orderMarket(1000, 'Sell')
  .then(json => console.log('order market ok', json))
  .catch(error => console.error('error', error))

// stop
signatureSDK.orderStop(1000, 6475.5, 'Buy')
  .then(json => console.log('order stop ok', json))
  .catch(error => console.error('error', error))
// touched
signatureSDK.orderMarketTouched(1000, 6400, 'Buy')
  .then(json => console.log('orderMarketTouched ok', json))
  .catch(error => console.error('error', error))
