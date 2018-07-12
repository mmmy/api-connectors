
var signatureSDK = require('../signatureSDK')

// test short
// sell
// signatureSDK.orderMarket(1000, 'Sell')
//   .then(json => console.log('order market ok', json))
//   .catch(error => console.error('error', error))

// stop
signatureSDK.orderStop(1000, 6400.5, 'Buy')
  .then(json => {
    setTimeout(() => {
      // delete order
      signatureSDK.deleteOrder(json.orderID).then((result) => {
        console.log('======ok')
        console.log(result)
      }).catch(err => {
        console.log('XXXXXXXXXXXXXXXX')
        console.log(err)
      })
    }, 5000)
    console.log('order stop ok', json)
  })
  .catch(error => console.error('error', error))
// touched
// signatureSDK.orderMarketTouched(1000, 6200, 'Buy')
//   .then(json => console.log('orderMarketTouched ok', json))
//   .catch(error => console.error('error', error))

// signatureSDK.deleteOrder('6859f64a-3695-839e-6e7d-04de5b6f0ea9')