
const MockData = require('../../MockData')
const TestStrategyManager = require('./Manager')
const { JSONtoCSV } = require('../../util')
const fs = require('fs')
const path = require('path')

const manager = new TestStrategyManager()

manager.addNewStrategy({
  id: 'orderbok-first',
  test: true,
  bookMaxSizeBuy: 0,
  bookMaxSizeSell: 0,
  amount: 100,
  balanceAmount: true,
  maxAmountCount: 100,
  minTradeInterval: 20,
  closeOrOpen: true,
})
// manager.addNewStrategy({
//   id: 'orderbok-first-balance',
//   test: true,
//   bookMaxSizeBuy: 0,
//   bookMaxSizeSell: 0,
//   amount: 100,
//   balanceAmount: true,
//   maxAmountCount: 100,
//   minTradeInterval: 70,
//   // closeOrOpen: true,
// })
let count = 0
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
// mockdata.listenCandle({binSize: '1m', count: 200}, histList => {
//   manager.setCandles1mHistory(histList)
// }, cb)
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
    const dataToCsv = JSONtoCSV(list, ['timestamp', 'profit', 'openPositionsLen', 'priceDiff', 'timeSpent'])
    const filePath = `temp/backtest_result_${result.id}.csv`
    fs.writeFileSync(path.join(__dirname, filePath), dataToCsv + '\n')
    console.log('pro', list[list.length - 1].profit)
    console.log(filePath, 'saved')
  })
  // console.log('total_volume', total_volume)
})
