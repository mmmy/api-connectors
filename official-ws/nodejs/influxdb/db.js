
const Influx = require('influx')

const strategy_client = new Influx.InfluxDB({
  database: 'strategy',
  host: 'localhost',
  port: 8086,
})

const StrageyDB = {
  writeOrder: function (options, order) {
    strategy_client.writePoints([{
      measurement: 'order',
      tags: {
        id: options.id
      },
      fields: {
        long: order.long ? 1 : -1,
        amount: order.amount,
        price: order.price,
      }
    }])
  },
  //{accout,symbol,currency,deleveragePercetile, currentTimestamp, timestamp, currentQty, markPrice, liquidationPrice,...}
  writePosition: function (options, position) {
    strategy_client.writePoints([{
      measurement: 'position',
      tags: {
        id: options.id
      },
      fields: {
        currentQty: position.currentQty,
        markPrice: position.markPrice,
        liquidationPrice: position.liquidationPrice,
      },
      timestamp: new Date(position.timestamp) * 1E6
    }])
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
