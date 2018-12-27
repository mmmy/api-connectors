const Influx = require('influx')
const OrderBook = require('../../../strategy/researchOrderbookL2/OrderBookL2Trade')
const OrderBookStrategy = require('./OrderBookStrategy')
const _ = require('lodash')
const MockData = require('../../MockData')
const fs = require('fs')
const path = require('path')
const { JSONtoCSV } = require('../../util')
const { statisticPositions } = require('../../util')

const id = 'orderbook-research'

const buyPath = `./temp/${id}_buys.json`
const sellPath = `./temp/${id}_sells.json`

const long = true
const short = false

let buysList = []
let sellsList = []

if (long) {
  buysList = JSON.parse(fs.readFileSync(path.join(__dirname, buyPath)))
  statisticAndSave(buysList, 'LONG')
}

if (short) {
  sellsList = JSON.parse(fs.readFileSync(path.join(__dirname, sellPath)))
  statisticAndSave(sellsList, 'SHORT')
}

function statisticAndSave(positions, prefix) {
  const {
    list,
    sumHigh,
    avgHigh,
    timeSumHigh,
    timeAvgHigh,
    sumLow,
    avgLow,
    timeSumLow,
    timeAvgLow
  } = statisticPositions(positions)
  console.log(list.slice(-1))
  console.log(`${prefix}_SEC, long len:`, list.length)
  console.log('avgHigh', avgHigh, 'sumHigh', sumHigh, 'timeAvgHigh', timeAvgHigh)
  console.log('avgLow', avgLow, 'sumLow', sumLow, 'timeAvgLow', timeAvgLow)
  const filePath = `./temp/research_orderbook_from_file_${prefix}.csv`
  const csvStr = JSONtoCSV(list, ['t', 'p', 'diffHigh', 'timeHigh', 'diffLow', 'timeLow', 'levelsTime1', 'levelsTime2', 'levelsTime3', 'levelsTime4', 'levelsTime5', 'levelsTime6'])
  fs.writeFileSync(path.join(__dirname, filePath), csvStr)

}

// bitmex.on('end', () => {
//   strategy.saveToFiles()
//   const { buys, sells } = strategy.statistic()
//   const LONG = buys.list.length > 0

//   console.log(list.slice(-1))
//   console.log(`${LONG ? 'LONG' : 'SHORT'}_SEC:${strategy.AFTER_SECONDS} long len`, list.length)
//   console.log('avgHigh', avgHigh, 'sumHigh', sumHigh, 'timeAvgHigh', timeAvgHigh)
//   console.log('avgLow', avgLow, 'sumLow', sumLow, 'timeAvgLow', timeAvgLow)

//   const filePath = `./temp/research_orderbook_volumefilter_${LONG ? 'LONG' : 'SHORT'}_${strategy.AFTER_SECONDS}.csv`
//   const csvStr = JSONtoCSV(list, ['t', 'p', 'diffHigh', 'timeHigh', 'diffLow', 'timeLow'])
//   fs.writeFileSync(path.join(__dirname, filePath), csvStr)
//   console.log('data end...')
//   strategy.stop()
// })
