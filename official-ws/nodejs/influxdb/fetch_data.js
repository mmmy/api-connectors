const Influx = require('influx')
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')


const client = new Influx.InfluxDB({
  database: 'bitmex',
  host: 'localhost',
  port: 8086,
})

let lastTable = ''
let continueTrades = 0
let maxTrades = 0

function orderBookTrade(json, symbol, tableName) {
  const { table, action, data } = json
  if (table === 'orderBookL2_25') {
    if (lastTable === 'orderBookL2_25') {
      continueTrades ++
    } else {
      continueTrades = 1
    }
    maxTrades = Math.max(maxTrades, continueTrades)
    if (continueTrades > 1) {
      console.log(continueTrades, maxTrades)
    }
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
