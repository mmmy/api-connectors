
const MockData = require('../MockData')
const TestStrategyManager = require('./IspStrategy/Manager')
const { JSONtoCSV } = require('../util')
const fs = require('fs')
const path = require('path')

const manager = new TestStrategyManager()
manager.addNewStrategy({
  id: 'test_indicativeSettlePrice',
  test: true,
  upThreshold: 2,
  downThreshold: -2,
})

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
  const results = manager.stats()
  console.log(results)
  results.forEach(result => {
    const list = result.positions.map(item => {
      return {
        ...item,
        openPositionsLen: item.openPositions.length
      }
    })
    const dataToCsv = JSONtoCSV(list, ['timestamp', 'profit', 'openPositionsLen'])
    fs.appendFileSync(path.join(__dirname, `temp/backtest_result_${result.id}.csv`), dataToCsv + '\n')
  })

  // console.log('total_volume', total_volume)
})
