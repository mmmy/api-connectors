const Influx = require('influx')
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')
const OrderBook = require('../strategy/researchOrderbookL2/OrderBookL2Trade')
const common = require('../strategy/common')
const _ = require('lodash')
const MockData = require('./MockData')

const client = new Influx.InfluxDB({
  database: 'bitmex',
  host: 'localhost',
  port: 8086,
})

const ob = new OrderBook()

let lastTable = ''
let continueTrades = 0
let maxTrades = 0
let indicativeSettlePrice = 0

let lastTime = null

function isPriceContinues(prices) {
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] - prices[i - 1] !== 0.5) {
      return false
    }
  }
  return true
}

function orderBookTest(json) {
  const { table, action, data } = json
  const topAsk = ob.getTopAsk()
  const topBid = ob.getTopBid()
  const topAskId = topAsk && topAsk.id
  const topBidId = topBid && topBid.id
  // const gap = topAsk.price - topBid.price
  // if (gap > 1) {
  //   // console.log(gap)
  // }
  let dataPoints = []
  if (action === 'partial') {
    json.keys = ['symbol', 'id', 'side']
    json.types = {
      symbol: 'symbol',
      id: 'long',
      side: 'symbol',
      size: 'long',
      price: 'float'
    }
  }

  ob.update(json)
  // console.log(ob.getMissPrices(), [ob.getTopBid().price, ob.getTopAsk().price])
}
let _tradeCount = 0
let _buyBookCount = 0
let _buyPrices = []
let _sellBookCount = 0
let _sellPrices = []
function tradeTest(json) {
  const { table, action, data } = json
  _tradeCount ++
  let bid0 = ob.getTopBidPrice2(0)
  let ask0 = ob.getTopAskPrice2(0)
  let bid1 = ob.getTopBidPrice2(1E4)
  let ask1 = ob.getTopAskPrice2(1E4)
  // let bid2 = ob.getTopBidPrice2(1E5)
  // let ask2 = ob.getTopAskPrice2(1E5)
  let bid3 = ob.getTopBidPrice2(1E6)
  let ask3 = ob.getTopAskPrice2(1E6)
  if ((ask0 - bid0 === 0.5) && (bid0 - bid3) === 0 && (ask1 - ask0) > 1) {
    const d0 = data[0]
    _buyPrices.push(bid0)
    _buyPrices = _.uniq(_buyPrices)
    _buyBookCount ++
    console.log('buy', _buyBookCount, _buyBookCount / _tradeCount, bid0, 'count', _buyPrices.length, d0.timestamp)
  }
  if ((ask0 - bid0 === 0.5) && (ask0 - ask3) === 0 && (bid0 - bid1) > 1) {
    const d0 = data[0]
    _sellPrices.push(bid0)
    _sellPrices = _.uniq(_sellPrices)
    _sellBookCount ++
    console.log('sell', _sellBookCount, _sellBookCount / _tradeCount, bid0, 'count', _sellPrices.length, d0.timestamp)
  }
  // const times = data.map(item => item.timestamp)
  // const timesUniq = _.uniq(times)
  // if (times.length !== timesUniq.length) {
  //   console.log('trade times are not uniq', times.length, timesUniq.length)
  // }
  // 所有的timestamp都是同样值
  // const dataToInflux = data.map((item, i) => {
  //   if (i === 0) {
  //     lastTime = (+new Date(item.timestamp)) * 1E6
  //   }
  //   return {
  //     measurement: table,
  //     fields: {
  //       size: item.size,
  //       price: item.price,
  //       price_gap: indicativeSettlePrice && (item.price - indicativeSettlePrice) || 0
  //     },
  //     tags: {
  //       action,
  //       side: item.side,
  //     },
  //     timestamp: lastTime += 1E6
  //   }
  // })
  // client.writePoints(dataToInflux)
}

function orderBookTrade(json, symbol, tableName) {
  const { table, action, data } = json

  if (table === 'orderBookL2_25') {
    orderBookTest(json)
  } else if (table === 'trade') {
    tradeTest(json)
  }
}

// const bitmex = new BitmexManager()
const bitmex = new MockData()

// bitmex.listenInstrument((json) => {
//   const { table, action, data } = json
//   //indicativeSettlePrice
//   const data0 = data[0]
//   if (data0.indicativeSettlePrice) {
//     client.writePoints([{
//       measurement: 'indicativeSettlePrice',
//       fields: {
//         price: data0.indicativeSettlePrice,
//         delta: indicativeSettlePrice ? data0.indicativeSettlePrice - indicativeSettlePrice : 0
//       },
//       tags: {
//         action,
//       },
//       timestamp: (+new Date(data0.timestamp)) * 1E6
//     }]).catch(e => console.log(e))

//     indicativeSettlePrice = data0.indicativeSettlePrice
//   }
//   // console.log(data.length)
// })

bitmex.listenTrade(orderBookTrade)

bitmex.listenOrderBook(orderBookTrade)

bitmex.start()
bitmex.on('end', () => {
  console.log('data end...')
})
