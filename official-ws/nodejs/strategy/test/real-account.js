
var Account = require('../Account')

var aa = new Account(true)

aa.orderLimit(6614, false, 2000).then((json) => {
  // console.log(json)
  // console.log(aa)
})

setTimeout(() => {
  console.log(aa)
}, 8000)

// aa.deleteOrder('hah')
// aa.getRealPosition().then(console.log).catch(console.log)