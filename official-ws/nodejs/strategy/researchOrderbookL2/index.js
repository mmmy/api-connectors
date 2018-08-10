
const OrderBookL2 = require('./OrderBookL2')
const common = require('../common')

const ob = new OrderBookL2({
  watchBigOrder: (list, action) => {
    const newList = list.map(item => {
      return {
        side: item.side,
        size: item.size,
        sizeDiff: item.sizeDiff,
        price: common.xbtPriceFromID(item.id)
      }
    })
    console.log(new Date().toLocaleString(), '-----------')
    console.log(newList, action)
  }
})

exports.update = function (json) {
  ob.update(json)
}
