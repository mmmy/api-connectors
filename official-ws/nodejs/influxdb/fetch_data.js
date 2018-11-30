const Influx = require('influx')
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')
const OrderBook = require('../strategy/researchOrderbookL2/OrderBookL2Trade')
const common = require('../strategy/common')

const client = new Influx.InfluxDB({
  database: 'bitmex',
  host: 'localhost',
  port: 8086,
})

const ob = new OrderBook()

let lastTable = ''
let continueTrades = 0
let maxTrades = 0

function orderBookTest(json) {
  const { table, action, data } = json
  const topAsk = ob.getTopAsk()
  const topBid = ob.getTopBidPrice()
  const topAskId = topAsk.id
  const topBidId = topBid.id
  const gap = topAsk.price - topBid.price
  if (gap > 1) {
    console.log(gap)
  }
  if (action == 'delete') {
    data.forEach(item => item.price = common.xbtPriceFromID(item.id))
    console.log(data)
    console.log('---------------------', ob.getTopBidPrice())
  }
  ob.update(json)
}

function orderBookTrade(json, symbol, tableName) {
  const { table, action, data } = json

  if (table === 'orderBookL2_25') {
    orderBookTest(json)
    // if (lastTable === 'orderBookL2_25') {
    //   continueTrades ++
    // } else {
    //   continueTrades = 1
    // }
    // maxTrades = Math.max(maxTrades, continueTrades)
    // if (continueTrades > 1) {
    //   console.log(continueTrades, maxTrades)
    // }
  }
  lastTable = table
  // console.log(json)
  // var lastData = data.data.slice(-1)[0]
  // const { table, action } = data
  // const dataToInflux = data.data.map(item => ({
  //   measurement: table,
  //   fields: {
  //     size: item.size,
  //     price: item.price,
  //   },
  //   tags: {
  //     action,
  //     side: item.side,
  //   },
  //   timestamp: (+new Date(item.timestamp)) * 1E6
  // }))
  // client.writePoints(dataToInflux)
  // console.log(data)
  // console.log('length', data.data.length)
}

const bitmex = new BitmexManager()

bitmex.listenTrade(orderBookTrade)

bitmex.listenOrderBook(orderBookTrade)
