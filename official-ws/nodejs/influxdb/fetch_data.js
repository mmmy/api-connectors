const Influx = require('influx')
const BitmexManager = require('../strategy/researchStrategy/BitmexManager')
const OrderBook = require('../strategy/researchOrderbookL2/OrderBookL2Trade')
const common = require('../strategy/common')
const _ = require('lodash')

const client = new Influx.InfluxDB({
  database: 'bitmex',
  host: 'localhost',
  port: 8086,
})

const ob = new OrderBook()

let lastTable = ''
let continueTrades = 0
let maxTrades = 0

let lastTime = null

function isPriceContinues(prices) {
  for (let i=1; i<prices.length; i++) {
    if (prices[i] - prices[i-1] !== 0.5) {
      return false
    }
  }
  return true
}

function orderBookTest(json) {
  const { table, action, data } = json
  const topAsk = ob.getTopAsk()
  const topBid = ob.getTopBid()
  const topAskId = topAsk.id
  const topBidId = topBid.id
  const gap = topAsk.price - topBid.price
  if (gap > 1) {
    // console.log(gap)
  }
  if (action == 'delete') {
    data.forEach(item => item.price = common.xbtPriceFromID(item.id))
    const sideBuy = data.filter(item => item.side === 'Buy')
    const sideSell = data.filter(item => item.side === 'Sell')

    if (sideBuy.length > 0) {
      let isContinues = isPriceContinues(sideBuy.map(item => item.price).sort())
      let continuesMeasument = [{
        measurement: 'action_price_continues',
        fields: {
          continues: isContinues ? 1 : -1
        },
        tags: {
          action,
          side: 'Buy'
        },
        timestamp: lastTime += 1E6
      }]
      client.writePoints(continuesMeasument)
    }

    if (sideSell.length > 0) {
      let isContinues = isPriceContinues(sideSell.map(item => item.price).sort())
      let continuesMeasument = [{
        measurement: 'action_price_continues',
        fields: {
          continues: isContinues ? 1 : -1
        },
        tags: {
          action,
          side: 'Sell'
        },
        timestamp: lastTime += 1E6
      }]
      client.writePoints(continuesMeasument)
    }

    // trading from orderbook
    const tradesBuyInflux = sideSell.map((item, i) => {
      const order = ob.getOrderById(item.id)
      return {
        measurement: 'trade_orderbook',
        fields: {
          size: order && +order.size || 0,
          price: item.price
        },
        tags: {
          action,
          side: 'Buy'
        },
        timestamp: lastTime += 1E6
      }
    })
    const tradesSellInflux = sideBuy.map((item, i) => {
      const order = ob.getOrderById(item.id)
      return {
        measurement: 'trade_orderbook',
        fields: {
          size: order && +order.size || 0,
          price: item.price
        },
        tags: {
          action,
          side: 'Sell'
        },
        timestamp: lastTime += 1E6
      }
    })

    client.writePoints(tradesBuyInflux)
    client.writePoints(tradesSellInflux)

    // console.log(data)
    // console.log('---------------------', ob.getTopBidPrice())
  } else if (action === 'update') {
    let topBidOk = false
    let topAskOk = false
    let len = data.length
    for (let i=0; i<len; i++) {
      const item = data[i]
      if (topBidOk && topAskOk) {
        break
      }
      if (topBidId === item.id) {
        topBidOk = true
        // 买一价发生的size变化值
        const deltaSize = topBid.size - item.size
        if (deltaSize > 0) {
          client.writePoints([{
            measurement: 'trade_orderbook',
            fields: {
              size: deltaSize,
              price: topBid.price
            },
            tags: {
              action,
              side: 'Sell'
            },
            timestamp: lastTime += 1E6
          }])
        }
      }
      if (topAskId === item.id) {
        topAskOk = true
        // 卖一价发生的size变化值
        const deltaSize = topAsk.size - item.size
        if (deltaSize > 0) {
          client.writePoints([{
            measurement: 'trade_orderbook',
            fields: {
              size: deltaSize,
              price: topAsk.price
            },
            tags: {
              action,
              side: 'Buy'
            },
            timestamp: lastTime += 1E6
          }])
        }
      }
    }
  }
  ob.update(json)
  // check orderbook is countines
  if (action == 'delete') {
  }
  const missPricesContinues = [{
    measurement: 'ob_price_miss_continues',
    fields: {
      continues: ob.isMissPriceContinues() ? 1 : -1
    },
    tags: {
      action
    },
    timestamp: lastTime + 1E6
  }]
  client.writePoints(missPricesContinues)
    // console.log(ob.getMissPrices(), [ob.getTopBid().price, ob.getTopAsk().price])
}

function tradeTest(json) {
  const { table, action, data } = json
  const dataToInflux = data.map(item => {
    const time_num = (+new Date(item.timestamp)) * 1E6
    lastTime = time_num
    return {
      measurement: table,
      fields: {
        size: item.size,
        price: item.price,
      },
      tags: {
        action,
        side: item.side,
      },
      timestamp: time_num
    }
  })
  client.writePoints(dataToInflux)
}

function orderBookTrade(json, symbol, tableName) {
  const { table, action, data } = json

  if (table === 'orderBookL2_25') {
    orderBookTest(json)
    // if (lastTable === 'orderBookL2_25') {
    //   continueTrades ++
    // } else {
    //   continueTrades = 1
    // }
    // maxTrades = Math.max(maxTrades, continueTrades)
    // if (continueTrades > 1) {
    //   console.log(continueTrades, maxTrades)
    // }
  } else {
    tradeTest(json)
  }
  // lastTable = table
  // console.log(json)
  // var lastData = data.data.slice(-1)[0]
  // const { table, action } = data
  // const dataToInflux = data.data.map(item => ({
  //   measurement: table,
  //   fields: {
  //     size: item.size,
  //     price: item.price,
  //   },
  //   tags: {
  //     action,
  //     side: item.side,
  //   },
  //   timestamp: (+new Date(item.timestamp)) * 1E6
  // }))
  // client.writePoints(dataToInflux)
  // console.log(data)
  // console.log('length', data.data.length)
}

const bitmex = new BitmexManager()

bitmex.listenTrade(orderBookTrade)

bitmex.listenOrderBook(orderBookTrade)
