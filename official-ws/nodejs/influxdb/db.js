
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
  constructor(options) {
    this._options = {
      cacheLen: 600,               // 差不多一分钟数据
      ...options
    }
    this._lastTime = 0
    this._time_wrongs = 0
    this._client = new Influx.InfluxDB({
      database: 'raw_data',
      host: 'localhost',
      port: 8086,
    })
    this._cache = []
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
    let record = {
      measurement: 'json',
      fields: {
        json_str: JSON.stringify(data)
      },
      tags: {
        table,
        action
      },
      timestamp: time
    }

    if (this._cache.length < this._options.cacheLen) {
      this._cache.push(record)
    } else {
      this._client.writePoints(this._cache).catch(e => {
        console.log('--------------------write data error ---------------------------')
        console.log(e)
      })
      this._cache = []
    }
    
    this._lastTime = time
  }
}

module.exports = {
  SaveRawJson,
  StrageyDB,
}
