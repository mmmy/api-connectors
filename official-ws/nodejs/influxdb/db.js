
const Influx = require('influx')

const strategy_client = new Influx.InfluxDB({
  database: 'strategy',
  host: 'localhost',
  port: 8086,
})

const StrageyDB = {
  writeOrder: function (options, order, error) {
    let tags = {
      id: options.id
    }
    if (error) {
      console.log(error, typeof error)
    }
    if (typeof error === 'string') {
      try {
        error = JSON.parse(error)
      } catch (e) {
        console.log(e)
      }
    }
    if (error && error.error && error.error.name) {
      tags.error = error.error.name
    }
    strategy_client.writePoints([{
      measurement: 'order',
      tags,
      fields: {
        long: order.long ? 1 : -1,
        amount: order.amount,
        price: order.price,
      }
    }])
  },
  //{accout,symbol,currency,deleveragePercetile, currentTimestamp, timestamp, currentQty, markPrice, liquidationPrice,...}
  writePosition: function (options, position) {
    const { currentQty, markPrice, liquidationPrice } = position
    if (currentQty !== undefined) {
      let fields = { currentQty }
      if (markPrice && liquidationPrice) {
        fields.markPrice = markPrice
        fields.liquidationPrice = liquidationPrice
      }
      strategy_client.writePoints([{
        measurement: 'position',
        tags: {
          id: options.id
        },
        fields,
        timestamp: new Date(position.timestamp) * 1E6
      }])
    }
  }
}

class SaveRawJson {
  constructor() {
    this._lastTime = 0
    this._time_wrongs = 0
    this._client = new Influx.InfluxDB({
      database: 'raw_data',
      host: 'localhost',
      port: 8086,
    })
  }

  saveJson(json) {
    const { table, action, data } = json
    let time = new Date() * 1E6
    if (time <= this._lastTime) {
      time = this._lastTime + 1E6
      this._time_wrongs++
      if (this._time_wrongs % 1E5 === 0) {
        console.log('time wrong', this._time_wrongs)
      }
    }
    this._client.writePoints([{
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
    this._lastTime = time
  }
}

module.exports = {
  SaveRawJson,
  StrageyDB,
}
