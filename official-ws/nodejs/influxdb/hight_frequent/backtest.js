
const MockData = require('../MockData')

let count = 1

function cb(json) {
  const { action, table, data } = json
  console.log(count++)
  if (action == 'orderBookL2_25') {

  } else if (action == 'trade') {

  } else if (action == 'instrument') {

  }
}

const mockdata = new MockData()
mockdata.listenOrderBook(cb)
mockdata.listenInstrument(cb)
mockdata.listenTrade(cb)
mockdata.start()
