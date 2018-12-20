
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')
const { BitmexDB } = require('./db')

const bitmex = new BitmexManager()
const client_raw = new SaveRawJson({cacheLen: 600})
const client = new BitmexDB()

function cb(json) {
  client.listenJson(json)        // 解析
  client_raw.listenJson(json)   // 原始json
}

bitmex.listenInstrument(cb)

bitmex.listenTrade(cb)

bitmex.listenOrderBook(cb)
