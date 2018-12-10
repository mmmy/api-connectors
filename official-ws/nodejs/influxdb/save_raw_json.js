
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')
const { SaveRawJson } = require('./db')

const bitmex = new BitmexManager()
const client = new SaveRawJson()

function cb(json) {
  client.saveJson(json)
}

bitmex.listenInstrument(cb)

bitmex.listenTrade(cb)

bitmex.listenOrderBook(cb)
