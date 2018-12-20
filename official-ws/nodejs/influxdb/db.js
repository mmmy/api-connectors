
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
  queryOrders(long, count = 200) {
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
  writeMargin: function (options, margin) {
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
  writeExecution: function (options, executions) {
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
    
    this._cache.push(record)
    if (this._cache.length > this._options.cacheLen) {
      this.saveCache()
    }

    this._lastTime = time
  }

  saveCache() {
    const pro = this._client.writePoints(this._cache).catch(e => {
      console.log('--------------------write data error ---------------------------')
      console.error('write json error', e)
      // logger.error(e)
      // console.log(e)
    })
    this._cache = []
    return pro
  }
}

class BitmexDB {
  constructor(options) {
    this._options = {
      ...options
    }
    this._client = new Influx.InfluxDB({
      database: 'bitmex',
      host: 'localhost',
      port: 8086,
    })
    this.isp = 0
  }

  writeTrade(json) {
    const { table, action, data } = json
    // 所有的timestamp都是同样值
    const dataToInflux = data.map((item, i) => {
      return {
        measurement: table,
        fields: {
          size: item.size,
          price: item.price,
          price_gap: this.isp && (item.price - this.isp) || 0
        },
        tags: {
          action,
          side: item.side,
        },
        timestamp: (new Date(item.timestamp)) * 1E6
      }
    })
    this._client.writePoints(dataToInflux).catch(e => console.log('writeTrade error' ,e))
  }

  writeInstrument(json) {
    const { table, action, data } = json
    //indicativeSettlePrice
    const data0 = data[0]
    if (data0.indicativeSettlePrice) {
      this._client.writePoints([{
        measurement: table,
        fields: {
          price: data0.indicativeSettlePrice,
          delta: this.isp ? data0.indicativeSettlePrice - this.isp : 0
        },
        tags: {
          action,
          name: 'indicativeSettlePrice',
        },
        timestamp: (new Date(data0.timestamp)) * 1E6
      }]).catch(e => console.log('writeInstrument error', e))
      this.isp = data0.indicativeSettlePrice
    }
  }

  writeOrderBook() {

  }

  listenJson(json) {
    const { table, action, data } = json
    switch (table) {
      case 'trade':
        this.writeTrade(json)
        break
      case 'instrument':
        this.writeInstrument(json)
        break
      case 'orderBookL2_25':
        this.writeOrderBook(json)
      default:
        break
    }
  }
}

module.exports = {
  SaveRawJson,
  StrageyDB,
  BitmexDB,
}
