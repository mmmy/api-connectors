
const Influx = require('influx')
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')

const client = new Influx.InfluxDB({
  database: 'raw_data',
  host: 'localhost',
  port: 8086,
})

let lastTime = 0
let time_wrongs = 0

function saveJson(json) {
  const { table, action, data } = json
  let time = new Date() * 1E6
  if (time <= lastTime) {
    time = lastTime + 1E6
    console.log('time wrong',time_wrongs++)
  }
  client.writePoints([{
    measurement: 'json',
    fields: {
      json_str: JSON.stringify(data)
    },
    tags: {
      table,
      action
    },
    timestamp: time
  }])
  lastTime = time
}

const bitmex = new BitmexManager()

bitmex.listenInstrument(saveJson)

bitmex.listenTrade(saveJson)

bitmex.listenOrderBook(saveJson)
