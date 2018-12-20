
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

setTimeout(() => {
  // systemd 回自动重启
  const cb = (result) => {
    console.log(result)
    process.exit(0)
  }
  client.saveCache().then(cb).catch(cb)

}, 2 * 3600 * 1000)
