
const MockData = require('../../MockData')
const TestStrategyManager = require('./Manager')
const { JSONtoCSV } = require('../../util')
const fs = require('fs')
const path = require('path')

const manager = new TestStrategyManager()

// manager.addNewStrategy({
//   id: 'stochRsi-3-20',
//   test: true,
//   bookMaxSizeBuy: 0,
//   bookMaxSizeSell: 0,
//   amount: 100,
//   balanceAmount: true,
//   maxAmountCount: 100,
//   stochRsi: {
//     rsiPeriod: 20,
//     stochasticPeriod: 20,
//     kPeriod: 3,
//     dPeriod: 3,
//   },
//   minTradeInterval: 70
// })

manager.addNewStrategy({
  id: 'stochRsi-150-100-2-2',
  test: true,
  bookMaxSizeBuy: 0,
  bookMaxSizeSell: 0,
  amount: 100,
  balanceAmount: false,
  maxAmountCount: 100,
  stochRsi: {
    rsiPeriod: 150,
    stochasticPeriod: 100,
    kPeriod: 2,
    dPeriod: 2,
  },
  minTradeInterval: 70
})

manager.addNewStrategy({
  id: 'stochRsi-200-200-3',
  test: true,
  bookMaxSizeBuy: 0,
  bookMaxSizeSell: 0,
  amount: 100,
  balanceAmount: false,
  maxAmountCount: 100,
  stochRsi: {
    rsiPeriod: 150,
    stochasticPeriod: 150,
    kPeriod: 3,
    dPeriod: 3,
  },
  minTradeInterval: 70
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
mockdata.listenCandle({binSize: '1m', count: 200}, histList => {
  manager.setCandles1mHistory(histList)
}, cb)
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
