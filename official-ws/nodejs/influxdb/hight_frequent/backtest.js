
const MockData = require('../MockData')
const FlowDataManager = require('../FlowDataManager')

const manager = new FlowDataManager()
let count = 1

let total_volume = 0
function statsVolume(json) {
  const { action, table, data } = json
  if (table == 'trade') {
    data.forEach(item => {
      total_volume += item.size
    })
  }
}

function cb(json) {
  const { action, table, data } = json
  count++
  if (count % 1E5 === 0) {
    console.log(count)
  }
  if (table == 'orderBookL2_25') {

  } else if (table == 'trade') {
    // statsVolume(json)
  } else if (table == 'instrument') {

  }
  manager.listenJson(json)
}

const mockdata = new MockData()
mockdata.listenOrderBook(cb)
mockdata.listenInstrument(cb)
mockdata.listenTrade(cb)
mockdata.start()

mockdata.on('end', () => {
  console.log('count', count)
  console.log(manager.stats())
  // console.log('total_volume', total_volume)
})
