
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')
const { BitmexDB } = require('./db')

const bitmex = new BitmexManager()
const client = new BitmexDB()

function cb(json) {
  client.listenJson(json)
}

bitmex.listenInstrument(cb)

bitmex.listenTrade(cb)

// bitmex.listenOrderBook(cb)
