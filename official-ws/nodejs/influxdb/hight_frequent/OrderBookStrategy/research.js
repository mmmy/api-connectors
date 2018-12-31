const Influx = require('influx')
const OrderBook = require('../../../strategy/researchOrderbookL2/OrderBookL2Trade')
const OrderBookStrategy = require('./OrderBookStrategy2')
const _ = require('lodash')
const MockData = require('../../MockData')
const fs = require('fs')
const path = require('path')
const { JSONtoCSV } = require('../../util')
const { exec } = require('child_process')

const strategy = new OrderBookStrategy({
  id: 'orderbook-research',
  test: true,
  testnet: true,
  // apiKey,
  // apiSecret,
  amount: 50,
  database: false,
  initCheckSystem: false,
  notify: false,
  maxAmountCount: 40,
})

function dataCb(json) {
  strategy.listenJson(json)
}

const bitmex = new MockData()

bitmex.listenInstrument(dataCb)
bitmex.listenTrade(dataCb)
bitmex.listenCandle({binSize: '1m', count: 200}, historyList => {
  strategy.setCandles1mHistory(historyList)
}, dataCb)

bitmex.listenOrderBook(dataCb)
bitmex.start()

bitmex.on('end', () => {
  strategy.saveToFiles()
  const {buys, sells} = strategy.statistic()
  const LONG = buys.list.length > 0
  const {
    list,
    sumHigh,
    avgHigh,
    timeSumHigh,
    timeAvgHigh,
    sumLow,
    avgLow,
    timeSumLow,
    timeAvgLow,
    sumProfit,
    avgProfit,
  } = LONG ? buys : sells
  console.log(list.slice(-1))
  console.log(`${LONG ? 'LONG' : 'SHORT'}_SEC:${strategy.AFTER_SECONDS} long len`, list.length)
  console.log('avgHigh', avgHigh, 'sumHigh', sumHigh, 'timeAvgHigh', timeAvgHigh)
  console.log('avgLow', avgLow, 'sumLow', sumLow, 'timeAvgLow', timeAvgLow)
  console.log('sumProfit', sumProfit, 'avgProfit', avgProfit)

  const filePath = `./temp/research_orderbook_volumefilter3_${LONG ? 'LONG' : 'SHORT'}_${strategy.AFTER_SECONDS}.csv`
  const csvStr = JSONtoCSV(list, ['t', 'p', 'diffHigh', 'timeHigh', 'diffLow', 'timeLow', 'lastPrice', 'profit'])
  fs.writeFileSync(path.join(__dirname, filePath), csvStr)
  console.log('data end...')
  strategy.stop()
  exec('msg * go')
})
