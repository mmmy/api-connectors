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
  if (action == 'delete') {
    data.forEach(item => item.price = common.xbtPriceFromID(item.id))
    const sideBuy = data.filter(item => item.side === 'Buy')
    const sideSell = data.filter(item => item.side === 'Sell')
    let buyDelLevel1 = false
    let sellDelLevel1 = false

    if (sideBuy.length > 0) {
      const buyPrices = sideBuy.map(item => item.price).sort()
      if (topBid && buyPrices.indexOf(topBid.price) > -1) {
        sellDelLevel1 = true
      }
      let isContinues = isPriceContinues(buyPrices)
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
      const sellPrices = sideSell.map(item => item.price).sort()
      if (topAsk && sellPrices.indexOf(topAsk.price) > -1) {
        buyDelLevel1 = true
      }
      let isContinues = isPriceContinues(sellPrices)
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
    if (buyDelLevel1) {
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
      client.writePoints(tradesBuyInflux)
    }

    if (!buyDelLevel1 && sideSell.length > 0) {
      console.log('hehehe', topAsk && topAsk.price, sideSell.map(item => item.price))
    }

    if (sellDelLevel1) {
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
  
      client.writePoints(tradesSellInflux)
    }

    // console.log(data)
    // console.log('---------------------', ob.getTopBidPrice())
  } else if (action === 'update') {
    let topBidOk = false
    let topAskOk = false
    let len = data.length
    for (let i = 0; i < len; i++) {
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
  // const times = data.map(item => item.timestamp)
  // const timesUniq = _.uniq(times)
  // if (times.length !== timesUniq.length) {
  //   console.log('trade times are not uniq', times.length, timesUniq.length)
  // }
  // 所有的timestamp都是同样值
  const dataToInflux = data.map((item, i) => {
    if (i === 0) {
      lastTime = (+new Date(item.timestamp)) * 1E6
    }
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
      timestamp: lastTime += 1E6
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

bitmex.listenInstrument((json) => {
  const { table, action, data } = json
  //indicativeSettlePrice
  const data0 = data[0]
  if (data0.indicativeSettlePrice) {
    client.writePoints([{
      measurement: 'indicativeSettlePrice',
      fields: {
        price: data0.indicativeSettlePrice,
      },
      tags: {
        action,
      },
      timestamp: (+new Date(data0.timestamp)) * 1E6
    }])
  }
  // console.log(data.length)
})
