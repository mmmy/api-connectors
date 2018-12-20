var { apiKey, apiSecret } = require('../test-secret.json')

var Account = require('../Account')

var aa = new Account({
  apiKey,
  apiSecret,
  test: false,
  testnet: true,
  profit: 62,
  loss: -40,
  shortProfit: 50
})

// aa.orderLimit(7470, true, 2000).then((json) => {
//   // console.log(json)
//   // console.log(aa)
// })

// setTimeout(() => {
//   console.log(aa)
//   aa.shouldLiquidation(7430)
// }, 15000)

// aa.deleteOrder('hah')
// aa.getRealPosition().then(console.log).catch(console.log)
// aa.signatureSDK.deleleOrderAll().then(json => {
//   console.log(json)
// })

aa.signatureSDK.closePositionMarket().then(json => {
  console.log(json)
})