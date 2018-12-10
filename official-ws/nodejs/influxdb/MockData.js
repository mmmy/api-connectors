
const Influx = require('influx')

const client = new Influx.InfluxDB({
  database: 'raw_data',
  host: 'localhost',
  port: 8086,
})

class MockData {
  constructor(options) {
    this._options = {
      start_time: '2018-12-07T10:51:00.000Z',
      time_long: '5d',
      ...options,
    }
    this._events = {}
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
    return client.query(`select count(*) from json ${whereClause}`)
  }
  sendData(rows) {
    const len = rows.length
    for (let i = 0; i < len; i++) {
      const { action, table, json_str } = rows[i]
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
  }
  async start(pageSize = 1E5) {
    const whereClause = this.createWhereClause()    
    const countResult = await this.queryCount()
    const total = countResult[0].count_json_str
    const pages = Math.ceil(total /  pageSize)
    for (let i=0; i<pages; i++) {
      const rows = await client.query(`select * from json ${whereClause} order by time limit ${pageSize} offset ${pageSize * i}`)
      this.sendData(rows)
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
