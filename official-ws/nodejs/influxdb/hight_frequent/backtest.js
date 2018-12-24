
const MockData = require('../MockData')
const TestStrategyManager = require('./IspStrategy/Manager')
const { JSONtoCSV } = require('../util')
const fs = require('fs')
const path = require('path')

const manager = new TestStrategyManager()
// manager.addNewStrategy({
//   id: 'test_ISP-filtered-15-17-40-balance1',
//   test: true,
//   bookMaxSizeBuy: 4E5,
//   bookMaxSizeSell: 4E5,
//   upThreshold: 1.5,
//   downThreshold: -1.7,
//   amount: 100,
//   balanceAmount: true,
// })
manager.addNewStrategy({
  id: 'test_ISP-filtered-25-7-0-closeoropen',
  test: true,
  upThreshold: 2.5,
  downThreshold: -2.7,
  bookMaxSizeBuy: 5E5,
  bookMaxSizeSell: 5E5,
  amount: 100,
  balanceAmount: true,
  maxAmountCount: 100,
  // closeOrOpen: true,
})
manager.addNewStrategy({
  id: 'test_ISP-filtered-2-2-0-closeoropen',
  test: true,
  upThreshold: 2,
  downThreshold: -2,
  bookMaxSizeBuy: 5E5,
  bookMaxSizeSell: 5E5,
  amount: 100,
  balanceAmount: true,
  maxAmountCount: 100,
  // closeOrOpen: true,
})
manager.addNewStrategy({
  id: 'test_ISP-filtered-3-3-0-closeoropen',
  test: true,
  upThreshold: 3,
  downThreshold: -3,
  bookMaxSizeBuy: 5E5,
  bookMaxSizeSell: 5E5,
  amount: 100,
  balanceAmount: true,
  maxAmountCount: 100,
  // closeOrOpen: true,
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
  // const results = manager.stats()
  const results = manager.getLastBacktestPositions()
  // console.log(results)
  results.forEach(result => {
    const list = result.positions.map(item => {
      return {
        ...item,
        openPositionsLen: item.openPositions.length
      }
    })
    const dataToCsv = JSONtoCSV(list, ['timestamp', 'profit', 'openPositionsLen'])
    const filePath = `temp/backtest_result_${result.id}.csv`
    fs.writeFileSync(path.join(__dirname, filePath), dataToCsv + '\n')
    console.log(filePath, 'saved')
  })
  // console.log('total_volume', total_volume)
})
