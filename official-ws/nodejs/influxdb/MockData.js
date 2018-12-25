
const Influx = require('influx')
const { BitmexKlineDB } = require('./db')

const parseCandle = k => ({
  timestamp: k.time.toISOString(),
  open: k.open,
  close: k.close,
  high: k.high,
  low: k.low,
  volume: k.volume,
})

const client = new Influx.InfluxDB({
  database: 'raw_data',
  host: 'localhost',
  port: 8086,
})

class MockData {
  constructor(options) {
    this._options = {
      // start_time: '2018-12-10T00:00:00.000Z',     // 2d
      start_time: '2018-12-20T05:09:54.920Z',
      time_long: '4d',
      ...options,
    }
    this._events = {}
    console.log('Moca data from', this._options.start_time)
    this._systmeTime = 0
    this._kline1m = []
    this._candleCb = {}
    this._histCandleCb = {}
  }
  listenOrderBook(cb) {
    this._obCb = cb
  }
  listenTrade(cb) {
    this._tdCb = cb
  }
  listenInstrument(cb) {
    this._insCb = cb
  }
  listenCandle({ binSize, count }, histCb, cb) {
    this._histCandleCb[binSize] = histCb
    this._candleCb[binSize] = cb
  }
  createWhereClause() {
    const { start_time, time_long } = this._options
    return `where time >= '${start_time}' and time < '${start_time}' + ${time_long}`
  }
  queryCount() {
    const whereClause = this.createWhereClause()
    return client.query(`select count(*) from json ${whereClause} order by time`)
  }

  handleRowsDelay(rows) {
    const len = rows.length
    let i = 0
    const loop = (cb) => {
      if (i < len) {
        setTimeout(() => {
          const row = rows[i]
          this.sendData(row)
          i++
          loop(cb)
        }, 1)
      } else {
        cb()
      }
    }
    return new Promise((resove) => {
      loop(resove)
    })
  }

  handleRows(rows) {
    const len = rows.length
    for (let i = 0; i < len; i++) {
      const row = rows[i]
      this.sendData(row)
      // let date = new Date()
      // for (let j=0; j<1E4; j++) {
      //   new Date()
      // }
      // console.log(new Date() - date)
    }
  }

  sendData(row) {
    const { action, table, json_str } = row
    const data = JSON.parse(json_str)
    const json = {
      table,
      action,
      data
    }
    let d0 = data[0]
    if (d0.timestamp) {
      this._systmeTime = new Date(d0.timestamp)
    }

    // 模拟发送k线数据
    if (this._candleCb['1m']) {
      const candle1m0 = this._kline1m[0]
      // 模拟交易所k线数据延迟
      if (candle1m0 && this._systmeTime - +new Date(candle1m0.timestamp) > 3 * 1000) {
        this._candleCb['1m']({
          table: 'tradeBin1m',
          action: 'update',
          data: [candle1m0]
        })
        this._kline1m.shift()
      }
    }

    switch (table) {
      case 'orderBookL2_25':
        this._obCb && this._obCb(json)
        break
      case 'trade' :
        this._tdCb && this._tdCb(json)
        break
      case 'instrument':
        this._insCb && this._insCb(json)
        break
      // case 'tradeBin1m':
      //   this._candleCb['1m'] && this._candleCb['1m'](json)
      //   break
      default:
        break
    }
  }

  async initCandles() {
    //1.初始化历史Kline
    if (this._histCandleCb['1m']) {
      const lastTime1m = +new Date(this._options.start_time) - 60 * 1000
      let histKline1m = await BitmexKlineDB.getHistoryKlines('1m', lastTime1m, 400)
      histKline1m = histKline1m.reverse().map(parseCandle)
      this._histCandleCb['1m'](histKline1m)
    }
    if (this._candleCb['1m']) {
      let kline1m = await BitmexKlineDB.getKlinesByRange('1m', this._options.start_time, null, this._options.time_long)
      kline1m = kline1m.map(parseCandle)
      this._kline1m = kline1m
    }
  }

  async start(pageSize = 1E5) {
    await this.initCandles()
    const whereClause = this.createWhereClause()    
    const countResult = await this.queryCount()
    const total = countResult[0].count_json_str
    const pages = Math.ceil(total /  pageSize)
    for (let i=0; i<pages; i++) {
      console.log(`page:${i+1}/${pages}`)
      const rows = await client.query(`select * from json ${whereClause} order by time limit ${pageSize} offset ${pageSize * i}`)
      // await this.handleRowsDelay(rows)
      this.handleRows(rows)
    }
    this._events.end && this._events.end()
  }
  stop() {

  }
  on(name, cb) {
    this._events[name] = cb
  }
}

module.exports = MockData
