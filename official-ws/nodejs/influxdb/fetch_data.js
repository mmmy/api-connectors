const Influx = require('influx')
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')


const client = new Influx.InfluxDB({
  database: 'bitmex',
  host: 'localhost',
  port: 8086,
})

const bitmex = new BitmexManager()

bitmex.listenTrade(function (data) {
  var lastData = data.data.slice(-1)[0]
  const { table, action } = data
  const dataToInflux = data.data.map(item => ({
    measurement: table,
    fields: {
      size: item.size,
      price: item.price,
    },
    tags: {
      action,
      side: item.side,
    },
    timestamp: (+new Date(item.timestamp)) * 1E6
  }))
  client.writePoints(dataToInflux)
  // console.log(data)
  // console.log('length', data.data.length)
  // obManager.updateCandlesRealTime(lastData)
  // obManager.updateTradeHistoryData(data.data)
  // obManager.doStrategy(lastData.price)
})