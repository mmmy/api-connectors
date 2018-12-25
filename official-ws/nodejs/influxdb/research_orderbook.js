const Influx = require('influx')
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')
const OrderBook = require('../strategy/researchOrderbookL2/OrderBookL2Trade')
const common = require('../strategy/common')
const _ = require('lodash')
const MockData = require('./MockData')
const fs = require('fs')
const path = require('path')
const { JSONtoCSV } = require('./util')

const client = new Influx.InfluxDB({
  database: 'bitmex',
  host: 'localhost',
  port: 8086,
})

const ob = new OrderBook()

let lastTable = ''
let continueTrades = 0
let maxTrades = 0
let indicativeSettlePrice = 0

let lastTime = null

function isPriceContinues(prices) {
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] - prices[i - 1] !== 0.5) {
      return false
    }
  }
  return true
}

function orderBookTest(json) {
  const { table, action, data } = json
  const topAsk = ob.getTopAsk()
  const topBid = ob.getTopBid()
  const topAskId = topAsk && topAsk.id
  const topBidId = topBid && topBid.id
  // const gap = topAsk.price - topBid.price
  // if (gap > 1) {
  //   // console.log(gap)
  // }
  let dataPoints = []
  if (action === 'partial') {
    json.keys = ['symbol', 'id', 'side']
    json.types = {
      symbol: 'symbol',
      id: 'long',
      side: 'symbol',
      size: 'long',
      price: 'float'
    }
  }

  ob.update(json)
  // console.log(ob.getMissPrices(), [ob.getTopBid().price, ob.getTopAsk().price])
}
let _tradeCount = 0
let _buyBookCount = 0
let _buyPrices = []
let _sellBookCount = 0
let _sellPrices = []

const AFTER_SECONDS = 600 

function recordAfterP(list, trades, seconds=60) {
  if (trades.length === 0) {
    return
  }
  const d0 = trades[0]
  for (let i=0; i<list.length; i++) {
    const item = list[i]
    const timeAfter = new Date(d0.timestamp) - new Date(item.t)
    if (timeAfter < seconds * 1000 && timeAfter > 0) {
      item.afterPs = item.afterPs.concat(trades)
    }
  }
}

function tradeTest(json) {
  const { table, action, data } = json
  _tradeCount ++
  let bid0 = ob.getTopBidPrice2(0)
  let ask0 = ob.getTopAskPrice2(0)
  // let bid1 = ob.getTopBidPrice2(1E4)
  let ask1 = ob.getTopAskPrice2(1E4)
  // let bid2 = ob.getTopBidPrice2(1E5)
  // let ask2 = ob.getTopAskPrice2(1E5)
  let bid3 = ob.getTopBidPrice2(5E5)
  // let ask3 = ob.getTopAskPrice2(1E6)
  const d0 = data[0]
  if ((ask0 - bid0 === 0.5) && (bid0 - bid3) === 0 && (ask1 - ask0) > 1) {
    const len = _buyPrices.length
    const lastB = _buyPrices[len - 1]
    if (len === 0 || (lastB.price !== bid0 && (new Date(d0.timestamp) - new Date(lastB.t)) > 30 * 1000)) {
      _buyPrices.push({
        p: bid0,
        t: d0.timestamp,
        afterPs: [],
      })
    }
    // _buyPrices = _.uniqBy(_buyPrices, 'p')
    _buyBookCount ++
    console.log('buy', _buyBookCount, _buyBookCount / _tradeCount, bid0, 'count', _buyPrices.length, d0.timestamp)
  }
  recordAfterP(_buyPrices, data.filter(d => d.side === 'Sell'), AFTER_SECONDS)
  // if ((ask0 - bid0 === 0.5) && (ask0 - ask3) === 0 && (bid0 - bid1) > 1) {
  //   const d0 = data[0]
  //   _sellPrices.push(bid0)
  //   _sellPrices = _.uniq(_sellPrices)
  //   _sellBookCount ++
  //   console.log('sell', _sellBookCount, _sellBookCount / _tradeCount, bid0, 'count', _sellPrices.length, d0.timestamp)
  // }
  // const times = data.map(item => item.timestamp)
  // const timesUniq = _.uniq(times)
  // if (times.length !== timesUniq.length) {
  //   console.log('trade times are not uniq', times.length, timesUniq.length)
  // }
  // 所有的timestamp都是同样值
  // const dataToInflux = data.map((item, i) => {
  //   if (i === 0) {
  //     lastTime = (+new Date(item.timestamp)) * 1E6
  //   }
  //   return {
  //     measurement: table,
  //     fields: {
  //       size: item.size,
  //       price: item.price,
  //       price_gap: indicativeSettlePrice && (item.price - indicativeSettlePrice) || 0
  //     },
  //     tags: {
  //       action,
  //       side: item.side,
  //     },
  //     timestamp: lastTime += 1E6
  //   }
  // })
  // client.writePoints(dataToInflux)
}

function orderBookTrade(json, symbol, tableName) {
  const { table, action, data } = json

  if (table === 'orderBookL2_25') {
    orderBookTest(json)
  } else if (table === 'trade') {
    tradeTest(json)
  }
}

// const bitmex = new BitmexManager()
const bitmex = new MockData()

bitmex.listenInstrument((json) => {
  // data[0].volume24h
  const { table, action, data } = json
  //indicativeSettlePrice
  const data0 = data[0]
  if (data0.indicativeSettlePrice) {
    indicativeSettlePrice = data0.indicativeSettlePrice
  }
  // console.log(data.length)
})

bitmex.listenTrade(orderBookTrade)

bitmex.listenOrderBook(orderBookTrade)

bitmex.start()
bitmex.on('end', () => {
  let wins = 0
  const list = _buyPrices.map(item => {
    const t = new Date(item.t)
    const afterPs = item.afterPs
    let maxPTrade = null
    let minPTrade = null
    for (let i=0; i<afterPs.length; i++) {
      const tr = afterPs[i]
      if (!maxPTrade) {
        maxPTrade = tr
      } else {
        if (tr.price > maxPTrade.price) {
          maxPTrade = tr
        }
      }
      if (!minPTrade) {
        minPTrade = tr
      } else {
        if (tr.price < minPTrade.price) {
          minPTrade = tr
        }
      }
    }

    const diffHigh = maxPTrade.price - item.p
    const diffLow = minPTrade.price - item.p
    const win = diffHigh === null ? null : (diffHigh > 0)
    if (win) {
      wins ++
    }
    return {
      ...item,
      diffHigh,
      timeHigh: (new Date(maxPTrade.timestamp) - t) / 1000,
      diffLow,
      timeLow: (new Date(minPTrade.timestamp) - t) / 1000
    }
  })
  const sumHigh = list.reduce((s, item) => s + item.diffHigh, 0)
  const avgHigh = sumHigh / list.length
  const timeSumHigh = list.reduce((s, item) => s + item.timeHigh, 0)
  const timeAvgHigh = timeSumHigh / list.length

  const sumLow = list.reduce((s, item) => s + item.diffLow, 0)
  const avgLow = sumLow / list.length
  const timeSumLow = list.reduce((s, item) => s + item.timeLow, 0)
  const timeAvgLow = timeSumLow / list.length

  console.log(list.slice(-1))
  console.log(`${AFTER_SECONDS} long len`, list.length)
  console.log('avgHigh', avgHigh, 'sumHigh', sumHigh, 'timeAvgHigh', timeAvgHigh)
  console.log('avgLow', avgLow, 'sumLow', sumLow, 'timeAvgLow', timeAvgLow)

  const filePath = `./temp/research_orderbook_${AFTER_SECONDS}.csv`
  const csvStr = JSONtoCSV(list, ['t','p','diffHigh', 'timeHigh', 'diffLow', 'timeLow'])
  fs.writeFileSync(path.join(__dirname, filePath), csvStr)
  console.log('data end...')
})
