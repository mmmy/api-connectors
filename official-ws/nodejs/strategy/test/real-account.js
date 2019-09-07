var { apiKey, apiSecret } = require('../apikey/test-secret.json')

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
const d1 = new Date()
// 大概会有1秒钟的时差
// aa.signatureSDK.orderLimit(100, 'Buy', 9000).then((json) => {
//   console.log('时间差', new Date(json.timestamp) - d1)
//   console.log(json)
//   // console.log(aa)
// })
// console.log(d1.toISOString())

// setTimeout(() => {
//   console.log(aa)
//   aa.shouldLiquidation(7430)
// }, 15000)

// aa.deleteOrder('hah')
// aa.getRealPosition().then(console.log).catch(console.log)
// aa.signatureSDK.deleleOrderAll().then(json => {
//   console.log(json)
// })

// aa.signatureSDK.closePositionMarket().then(json => {
//   console.log(json)
// })

aa.signatureSDK.getPosition('ETHUSD').then(json => {
  console.log(json)
}).catch(e => {
  console.log(e)
})