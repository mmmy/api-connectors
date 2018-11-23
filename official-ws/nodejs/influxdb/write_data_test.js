const Influx = require('influx')

const client = new Influx.InfluxDB({
  database: 'mydb',
  host: 'localhost',
  port: 8086,
})

function writeRandomData() {
  client.writePoints([
    {
      measurement: 'random_data',
      fields: {
        value0: Math.random(),
        value1: Math.random() * 10
      }
    }
  ])
}

setInterval(() => {
  writeRandomData()
}, 1000)
