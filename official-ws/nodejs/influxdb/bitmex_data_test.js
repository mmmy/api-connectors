const BitmexManager = require('../strategy/researchStrategy/BitmexManager')
const OrderBook = require('../strategy/researchOrderbookL2/OrderBookL2Trade')
const common = require('../strategy/common')
const _ = require('lodash')

const bitmex = new BitmexManager()

// bitmex.listenTrade(orderBookTrade)
let afterDelete = false
const ob = new OrderBook()

function orderBookTrade(json) {
  const { table, action, data } = json

  if (table === 'orderBookL2_25') {
    const topAsk = ob.getTopAsk()
    const topBid = ob.getTopBid()
    if (action == 'partial') {
      console.log(json)
    }
    if (action === 'update') {
      const ids = data.map(item => item.id)
      const idsUniq = _.uniq(ids)
      if (ids.length !== idsUniq.length) {
        console.log('id not uniq?', ids.length, idsUniq.length)
      }
    } else if (action === 'delete') {
      data.forEach(item => item.price = common.xbtPriceFromID(item.id))

      if (afterDelete) {
        console.log(afterDelete, data.map(item => item.price))
      }
    }
    // afterDelete = false
  } else if (table === 'trade') {
    let totalSize = 0
    let prices = []
    let sides = []
    const len = data.length
    for (let i=0; i<len; i++) {
      const item = data[i]
      totalSize += item.size
      prices.push(item.price)
      sides.push(item.side)
    }
    const pricesUniq = _.uniq(prices)
    const sideUniq = _.uniq(sides)
    if (pricesUniq.length > 1) {
      afterDelete = true
      console.log(pricesUniq.length, sideUniq.length, totalSize)
      // console.log(totalSize)
    } else {
      afterDelete = false
    }
  }

  ob.update(json)
}

bitmex.listenOrderBook(orderBookTrade)
bitmex.listenTrade(orderBookTrade)
return
bitmex.listenInstrument((json) => {
  const { table, action, data } = json
  //indicativeSettlePrice
  const data0 = data[0]
  if (data0.indicativeSettlePrice) {
    console.log(data0.indicativeSettlePrice)
  }
  // console.log(data.length)
})