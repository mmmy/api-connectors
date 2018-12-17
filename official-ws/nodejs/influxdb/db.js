
const Influx = require('influx')
var winston = require('winston')

const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.File({ filename: './write-db-error.log', level: 'error' })
  ]
})

const strategy_client = new Influx.InfluxDB({
  database: 'strategy',
  host: 'localhost',
  port: 8086,
})
// type is string like "filtered"
const StrageyDB = {
  // 返回的顺序是时间倒序的
  queryOrders(long, count=200) {
    return strategy_client.query(`select * from "order" where ${long ? 'long > 0' : 'long < 0'} order by time desc limit ${count}`)
  },

  writeOrder: function (options, order, error, type) {
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
    if (type) {
      tags.type = type
    }
    strategy_client.writePoints([{
      measurement: 'order',
      tags,
      fields: {
        long: order.long ? 1 : -1,
        amount: order.amount,
        price: order.price,
      },
      timestamp: new Date(order.timestamp) * 1E6
    }]).catch(e => {
      console.error('writeOrder error', e)
      // logger.error(e)
    })
  },
  //{accout,symbol,currency,deleveragePercetile, currentTimestamp, timestamp, currentQty, markPrice, liquidationPrice,...}
  writePosition: function (options, position) {
    const { currentQty, markPrice, liquidationPrice, unrealisedRoePcnt, unrealisedPnl } = position
    if (currentQty !== undefined) {
      let fields = { currentQty }
      if (markPrice && liquidationPrice) {
        fields.markPrice = markPrice
        fields.liquidationPrice = liquidationPrice
      }
      if (unrealisedRoePcnt !== undefined) {
        fields.unrealisedRoePcnt = unrealisedRoePcnt     // 未实现盈利率
      }
      if (unrealisedPnl !== undefined) {
        fields.unrealisedPnl = unrealisedPnl             // 未实现盈利
      }
      strategy_client.writePoints([{
        measurement: 'position',
        tags: {
          id: options.id
        },
        fields,
        timestamp: new Date(position.timestamp) * 1E6
      }]).catch(e => {
        console.error('writeOrder error', e)
        // logger.error(e)
      })
    }
  },
  writeMargin: function(options, margin) {
    if (margin) {
      const { walletBalance } = margin
      strategy_client.writePoints([{
        measurement: 'margin',
        tags: {
          id: options.id
        },
        fields: {
          walletBalance
        },
        timestamp: new Date(margin.timestamp) * 1E6
      }]).catch(e => {
        console.error('writeMargin error', e)
        // logger.error(e)
      })
    }
  },
  writeExecution: function(options, executions) {
    if (executions && executions[0]) {
      let e0 = executions[0]
      let { side, timestamp, price, execType } = e0
      if (execType === 'Trade') {
        let totalLastQty = executions.reduce((sum, e) => (sum + e.lastQty), 0)
        strategy_client.writePoints([{
          measurement: 'execution',
          tags: {
            side,
            id: options.id,
          },
          fields: {
            price,
            totalLastQty,
          },
          timestamp: new Date(timestamp) * 1E6,
        }]).catch(e => {
          console.log('writeExecution error', e)
        })
      }
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
        console.error('write json error', e)
        // logger.error(e)
        // console.log(e)
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
