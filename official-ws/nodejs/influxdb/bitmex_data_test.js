const BitmexManager = require('../strategy/researchStrategy/BitmexManager')
const OrderBook = require('../strategy/researchOrderbookL2/OrderBookL2Trade')
const common = require('../strategy/common')
const _ = require('lodash')

const bitmex = new BitmexManager()

// bitmex.listenTrade(orderBookTrade)

function orderBookTrade(json) {
  const { table, action, data } = json
  if (table === 'orderBookL2_25') {
    if (action === 'update') {
      const ids = data.map(item => item.id)
      const idsUniq = _.uniq(ids)
      if (ids.length !== idsUniq.length) {
        console.log('id not uniq?', ids.length, idsUniq.length)
      }
    }
  } else if (table === 'trade') {
    console.log(json)
  }
}

bitmex.listenOrderBook(orderBookTrade)
bitmex.listenTrade(orderBookTrade)
