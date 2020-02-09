const SDK = require('../sdk')

const orderManager = new SDK({
  testnet: true,
  apiKey: '8bb8e086f7132a8cdbe753ad9c16cdca6631e8bb09b7dec44896afc603cd73ae',
  apiSecret: 'ba55c99ce0bbc76e183a2c03fc5339df297cbc66ba4c138b8700b79a091d9210'
})

// orderManager.orderLimit('BTCUSDT', 2, 'BUY', 9200).then(json => {
//   console.log(json)
// }).catch(e => console.log(e)).

// orderManager.overtimeListenKey().then(json => console.log(json)).catch(e => console.log(e))

// orderManager.getAccountData().then(json => {
//   console.log(json)
//   var a = 1
// }).catch(e => console.log(e))

// orderManager.orderLimit('EOSUSDT', 2.000000000, 'BUY', 4.94)
orderManager.deleteOrder('BCHUSDT', 295771069).catch(e => console.log(e))