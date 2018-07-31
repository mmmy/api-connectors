
var Account = require('../Account')

var aa = new Account({
  test: false,
  profit: 62,
  loss: -40,
  shortProfit: 50
})

aa.orderLimit(7700, false, 2000).then((json) => {
  // console.log(json)
  // console.log(aa)
})

setTimeout(() => {
  console.log(aa)
}, 8000)

// aa.deleteOrder('hah')
// aa.getRealPosition().then(console.log).catch(console.log)