
const MockData = require('../MockData')
const TestStrategyManager = require('./IspBreakStrategy/Manager')
const { JSONtoCSV } = require('../util')
const fs = require('fs')
const path = require('path')

const manager = new TestStrategyManager()
// manager.addNewStrategy({
//   id: 'test_IspBreakStrategy-50-10',
//   test: true,
//   bookMaxSizeBuy: 0,
//   bookMaxSizeSell: 0,
//   backLen: 15,
//   minTradeInterval: 10,
//   amount: 100,
//   balanceAmount: false,
// })
manager.addNewStrategy({
  id: 'test_IspBreakStrategy-150-300-balanceAmount',
  test: true,
  bookMaxSizeBuy: 0,
  bookMaxSizeSell: 0,
  backLen: 150,
  minTradeInterval: 300,
  amount: 100,
  balanceAmount: true,
})
manager.addNewStrategy({
  id: 'test_IspBreakStrategy-150-600-balanceAmount',
  test: true,
  bookMaxSizeBuy: 0,
  bookMaxSizeSell: 0,
  backLen: 150,
  minTradeInterval: 600,
  amount: 100,
  balanceAmount: true,
})

manager.addNewStrategy({
  id: 'test_IspBreakStrategy-150-600',
  test: true,
  bookMaxSizeBuy: 0,
  bookMaxSizeSell: 0,
  backLen: 150,
  minTradeInterval: 600,
  amount: 100,
  balanceAmount: false,
})
// manager.addNewStrategy({
//   id: 'test_indicativeSettlePrice-filtered-2-2-40-old-size',
//   test: true,
//   upThreshold: 2,
//   downThreshold: -2,
//   bookMaxSizeBuy: 5E5,
//   bookMaxSizeSell: 5E5,
//   amount: 100,
//   balanceAmount: false,
// })

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
