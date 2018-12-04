
const Influx = require('influx')
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')

const client = new Influx.InfluxDB({
  database: 'raw_data',
  host: 'localhost',
  port: 8086,
})

function saveJson(json) {
  const { table, action, data } = json
  client.writePoints([{
    measurement: 'json',
    fields: {
      json_str: JSON.stringify(data)
    },
    tags: {
      table,
      action
    }
  }])
}

const bitmex = new BitmexManager()

bitmex.listenInstrument(saveJson)

bitmex.listenTrade(saveJson)

bitmex.listenOrderBook(saveJson)
