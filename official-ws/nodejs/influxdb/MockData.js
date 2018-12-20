
const Influx = require('influx')

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
      time_long: '2d',
      ...options,
    }
    this._events = {}
    console.log('Moca data from', this._options.start_time)
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
  createWhereClause() {
    const { start_time, time_long } = this._options
    return `where time > '${start_time}' and time <= '${start_time}' + ${time_long}`
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
    const json = {
      table,
      action,
      data: JSON.parse(json_str)
    }
    if (table == 'orderBookL2_25' && this._obCb) {
      this._obCb(json)
    } else if (table == 'trade' && this._tdCb) {
      this._tdCb(json)
    } else if (table == 'instrument' && this._insCb) {
      this._insCb(json)
    }
  }

  async start(pageSize = 1E5) {
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
