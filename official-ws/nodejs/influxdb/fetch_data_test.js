const Influx = require('influx')

const client = new Influx.InfluxDB({
  database: 'NOAA_water_database',
  host: 'localhost',
  port: 8086,
})

client.query(`select * from h2o_feet`).then(rows => console.log(rows))