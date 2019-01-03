const OrderBook = require('../strategy/researchOrderbookL2/OrderBookL2Trade')

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
    this._ob = new OrderBook()
    this._lastOrderBookPartialTime = 0
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
      // this._time_wrongs++
      // if (this._time_wrongs % 1E5 === 0) {
      //   console.log('time wrong', this._time_wrongs)
      // }
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

    this.pushRecord(record)

    if (table === 'orderBookL2_25') {
      this._ob.update(json)
      if (action === 'partial') {
        this._lastOrderBookPartialTime = new Date()
      } else {
        const now = new Date()
        if (now - this._lastOrderBookPartialTime > 1 * 3600 * 1000) {   // 每过N个小时
          // 模拟添加一个partial
          time = time + 1E6
          this.pushRecord({
            measurement: 'json',
            fields: {
              json_str: JSON.stringify(this._ob._data)
            },
            tags: {
              table,
              action: 'partial'
            },
            timestamp: time
          })
          this._lastOrderBookPartialTime = now
        }
      }
    }
    this._lastTime = time
  }

  pushRecord(record) {
    this._cache.push(record)
    if (this._cache.length > this._options.cacheLen) {
      this.saveCache()
    }
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
      maxCacheSeconds: 30,
      ...options,
    }
    this._client = new Influx.InfluxDB({
      database: 'bitmex',
      host: 'localhost',
      port: 8086,
    })
    this.isp = 0
    this._lastWriteTime = new Date()
    this._lastTradeSaveTime = 0
    this._cache = []
  }

  writeTrade(json) {
    const { table, action, data } = json
    // 所有的timestamp都是同样值
    const d0 = data[0]
    const t0 = new Date(d0.timestamp)
    if (t0 > this._lastTradeSaveTime) {
      this._lastTradeSaveTime = +t0
    }
    const dataToInflux = data.map((item, i) => {
      this._lastTradeSaveTime += i * 1             // 1ms
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
        timestamp: this._lastTradeSaveTime * 1E6
      }
    })
    this.updateCache(dataToInflux)
  }

  writeInstrument(json) {
    const { table, action, data } = json
    //indicativeSettlePrice
    const data0 = data[0]
    if (data0.indicativeSettlePrice) {
      this.updateCache([{
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
      }])
      this.isp = data0.indicativeSettlePrice
    }
  }

  writeOrderBook() {

  }

  updateCache(points) {
    this._cache = this._cache.concat(points)
    const now = new Date()
    if (now - this._lastWriteTime > this._options.maxCacheSeconds * 1000) {
      this._client.writePoints(this._cache).catch(e => console.log('write error', e))
      this._cache = []
      this._lastWriteTime = now
    }
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

const kline_client = new Influx.InfluxDB({
  host: 'localhost',
  database: 'bitmex_kline',
  port: 8086
})

const BitmexKlineDB = {
  writeKline: function (binSize, list) {
    const dataPoints = list.map(kline => ({
      measurement: 'kline',
      tags: {
        binSize
      },
      fields: {
        ...kline
      },
      timestamp: new Date(kline.timestamp) * 1E6
    }))
    return kline_client.writePoints(dataPoints)
  },
  getLastKline: function (binSize) {
    return kline_client.query(`select * from kline where binSize='${binSize}' order by time desc limit 1`)
  },
  getHistoryKlines: function (binSize, endTime, count = 400) {
    endTime = new Date(endTime).toISOString()
    return kline_client.query(`select * from kline where binSize='${binSize}' and time <= '${endTime}' order by time desc limit ${count}`)
  },
  getKlinesByRange: function (binSize, startTime, endTime, after = '2d') {
    startTime = new Date(startTime).toISOString()
    let endWhere = ''
    if (endTime) {
      endWhere = `and time < '${new Date(endTime).toISOString()}'`
    } else if (after) {
      endWhere = `and time < '${startTime}' + ${after}`
    }
    const query = `select * from kline where binSize='${binSize}' and time >= '${startTime}' ${endWhere} order by time`
    return kline_client.query(query)
  }
}

class SpotDB {
  constructor(options) {
    this._options = {
      maxCacheSeconds: 35
    }

    this._cache = []

    this._client = new Influx.InfluxDB({
      database: 'spot',
      host: 'localhost',
      port: 8086,
    })

    this._lastWriteTime = new Date()
  }

  writeBitfinexTrades(symbol, trades) {
    const dataPoints = trades.map(trade => ({ //{id, mts, amount, price}
      measurement: 'trades',
      tags: {
        exchange: 'bitfinex',
        symbol,
        side: trade.amount > 0 ? 'buy' : 'sell'
      },
      fields: {
        amount: Math.abs(trade.amount),
        price: trade.price
      },
      timestamp: new Date(trade.mts) * 1E6
    }))
    this.updateCache(dataPoints)
  }

  writeOKexTrades(symbol, trades) {
    const dataPoints = trades.map(trade => ({ //{id, mts, amount, price}
      measurement: 'trades',
      tags: {
        exchange: 'okex',
        symbol,
        side: trade[4] === 'bid' ? 'buy' : 'sell'
      },
      fields: {
        amount: trade[2],
        price: +trade[1]
      },
      timestamp: new Date() * 1E6
    }))
    this.updateCache(dataPoints)
  }
  /*
  {
    "e": "trade",     // Event type
    "E": 123456789,   // Event time
    "s": "BNBBTC",    // Symbol
    "t": 12345,       // Trade ID
    "p": "0.001",     // Price
    "q": "100",       // Quantity
    "b": 88,          // Buyer order ID
    "a": 50,          // Seller order ID
    "T": 123456785,   // Trade time
    "m": true,        // Is the buyer the market maker?
    "M": true         // Ignore
  }
  */
  writeBinanceTrades(symbol, trades) {
    const dataPoints = trades.map(trade => ({ //{id, mts, amount, price}
      measurement: 'trades',
      tags: {
        exchange: 'binance',
        symbol,
        side: trade.m ? 'buy' : 'sell'
      },
      fields: {
        amount: +trade.q * (trade.m ? 1 : -1),
        price: +trade.p
      },
      timestamp: new Date(trade.E) * 1E6
    }))
    this.updateCache(dataPoints)
  }

  writeHuobiTrades(symbol, trades) {
    const dataPoints = trades.map(trade => ({ //{id, ts, amount, price, direction: buy or sell}
      measurement: 'trades',
      tags: {
        exchange: 'huobi',
        symbol,
        side: trade.direction
      },
      fields: {
        amount: +trade.amount,
        price: +trade.price
      },
      timestamp: new Date(trade.ts) * 1E6
    }))
    this.updateCache(dataPoints)
  }

  updateCache(points) {
    this._cache = this._cache.concat(points)
    const now = new Date()
    if (now - this._lastWriteTime > this._options.maxCacheSeconds * 1000) {
      this._client.writePoints(this._cache)
      this._cache = []
      this._lastWriteTime = now
    }
  }
}

module.exports = {
  SaveRawJson,
  StrageyDB,
  BitmexDB,
  BitmexKlineDB,
  SpotDB,
}
