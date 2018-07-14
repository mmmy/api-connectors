
var Account = require('../Account')

var aa = new Account(true)

// aa.orderMarket(6400, true, 100).then((json) => {
//   // console.log(json)
//   // console.log(aa)
// })

// setTimeout(() => {
//   console.log(aa)
// }, 6000)

aa.deleteOrder('hah')