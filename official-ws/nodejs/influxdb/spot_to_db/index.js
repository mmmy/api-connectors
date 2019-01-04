
const args = require('../../strategy/argv')
const _ = require('lodash')
var SocksProxyAgent = require('socks-proxy-agent');
var agent = new SocksProxyAgent('socks://127.0.0.1:1080');
const BFX = require('bitfinex-api-node')
const { createOkSpotClient, createBinanceClient, createHuobiClient, createCoinbaseClient } = require('./client')
const { SpotDB } = require('../db')
const Pusher = require('pusher-js')

const dbClient = new SpotDB()

const options = {
  ...args,
  database: true,
  bitfinex: true,
  okex: true,
  binance: true,
  huobi: true,
  coinbase: true,
  bitstamp: true,
}

if (options.bitfinex) {
  const bfx = new BFX({
    ws: {
      autoReconnect: true,
      seqAudit: true,
      agent: options.noProxy ? null : agent,
      packetWDDelay: 10 * 1000
    }
  })

  const bfxClient = bfx.ws(2, {
    manageOrderBooks: true,
    transform: true
  })

  bfxClient.on('open', () => {
    console.log('bitfinex Connection opened.')
    bfxClient.subscribeOrderBook('tBTCUSD', 'P0', '25')
    bfxClient.subscribeTrades('tBTCUSD')
    bfxClient.subscribeTrades('tETHUSD')
  })

  // [{id, mts, amount, price}]
  bfxClient.onTrades({ symbol: 'tBTCUSD' }, trades => {
    // console.log('trades, len', trades.length)
    // console.log(trades)
    dbClient.writeBitfinexTrades('BTCUSDT', trades)
  })

  bfxClient.onTrades({ symbol: 'tETHUSD' }, trades => {
    // console.log('trades, len', trades.length)
    // console.log(trades)
    dbClient.writeBitfinexTrades('ETHUSDT', trades)
  })

  bfxClient.onOrderBook({ symbol: 'tBTCUSD' }, (ob) => {
    var data = {
      midPrice: ob.midPrice(),
      asks: ob.asks,
      bids: ob.bids
    }
    // var dataStr = JSON.stringify(data)
    // console.log(`trades: ${dataStr}`)
    // ws.readyState == WebSocket.OPEN && ws.send(dataStr);
  })

  bfxClient.open()
  // handle errors here. If no 'error' callback is attached. errors will crash the client.
  bfxClient.on('error', e => {
    console.error('bitfinex error')
    console.error(e)
  });

  bfxClient.on('close', () => console.log('bitfinex Connection closed.'));
}

if (options.okex) {
  var params = [{
    event: 'addChannel',
    channel: 'ok_sub_spot_btc_usdt_deals'
    // channel: 'ok_sub_spot_btc_usde_depth_5'
  }, {
    event: 'addChannel',
    channel: 'ok_sub_spot_eth_usdt_deals'
    // channel: 'ok_sub_spot_btc_usde_depth_5'
  }, {
    event: 'addChannel',
    channel: 'ok_sub_spot_btc_usdt_ticker'
  }]
  //[{"channel":"ok_sub_spot_btc_usdt_deals","data":[["818723474","3770.6901","0.0027393","14:21:08","bid"]],"binary":0}]
  const okSpotClient = createOkSpotClient(options, params, function (jsonStr) {
    const json = JSON.parse(jsonStr)
    json.length > 0 && json.forEach(data => {
      switch (data.channel) {
        case 'ok_sub_spot_btc_usdt_deals':
          dbClient.writeOKexTrades('BTCUSDT', data.data)
          break
        case 'ok_sub_spot_eth_usdt_deals':
          dbClient.writeOKexTrades('ETHUSDT', data.data)
          break
        default:
          break
      }
    })
    // console.log('new ------')
    // console.log(jsonStr)
  })
}

if (options.binance) {
  const streams = ['btcusdt@trade', 'ethusdt@trade', 'adausdt@trade']
  //{"stream":"btcusdt@trade","data":{"e":"trade","E":1546417273191,"s":"BTCUSDT","t":91829771,"p":"3783.48000000","q":"0.00277500","b":223587689,"a":223587688,"T":1546417273198,"m":false,"M":true}}
  const ss = createBinanceClient(streams, options, function (json) {
    switch (json.stream) {
      case 'btcusdt@trade':
        dbClient.writeBinanceTrades('BTCUSDT', [json.data])
        break
      case 'ethusdt@trade':
        dbClient.writeBinanceTrades('ETHUSDT', [json.data])
        break
      case 'adausdt@trade':
        dbClient.writeBinanceTrades('ADAUSDT', [json.data])
      default:
        break
    }
  })
}

if (options.huobi) {
  const subs = [{
    sub: "market.btcusdt.trade.detail"
  }, {
    sub: "market.ethusdt.trade.detail"
  }]
  //{"ch":"market.ethusdt.trade.detail","ts":1546500340552,"tick":{"id":40575194810,"ts":1546500340423,"data":[{"amount":0.9215,"ts":1546500340423,"id":4.057519481021109e+21,"price":151.52,"direction":"buy"}]}}
  const ss = createHuobiClient(subs, options, function (json) {
    // console.log(JSON.stringify(json))
    if (json && json.ch) {
      const data = json.tick.data
      switch (json.ch) {
        case 'market.btcusdt.trade.detail':
          dbClient.writeHuobiTrades('BTCUSDT', data)
          break
        case 'market.ethusdt.trade.detail':
          dbClient.writeHuobiTrades('ETHUSDT', data)
          break
        default:
          break
      }
    }
  })
}

if (options.coinbase) {
  const params = {
    "type": "subscribe",
    "product_ids": [
      "BTC-USD",
      "ETH-USD"
    ],
    "channels": [
      {
        "name": "ticker",
        "product_ids": [
          "BTC-USD",
          "ETH-USD"
        ]
      }
    ]
  }
  /*
  { type: 'ticker',
  sequence: 7740219303,
  product_id: 'BTC-USD',
  price: '3802.57000000',
  open_24h: '3871.50000000',
  volume_24h: '8182.5012603',
  low_24h: '3752.98000000',
  high_24h: '3881.57000000',
  volume_30d: '463136.85819831',
  best_bid: '3802.57',
  best_ask: '3803.45',
  side: 'sell',
  time: '2019-01-04T03:55:01.155000Z',
  trade_id: 57147352,
  last_size: '0.06202829' }

  { type: 'ticker',
  sequence: 7740718949,
  product_id: 'BTC-USD',
  price: '3798.22000000',
  open_24h: '3861.98000000',
  volume_24h: '8423.80220885',
  low_24h: '3752.98000000',
  high_24h: '3862.81000000',
  volume_30d: '463119.97174515',
  best_bid: '3798.21',
  best_ask: '3798.22' }
  */
  const ss = createCoinbaseClient(params, options, function (json) {
    // console.log('new -----')
    // console.log(json)
    if (json && json.type === 'ticker') {
      if (json.side) {
        // console.log('wrong data?')
        // console.log(json)
        let symbol = json.product_id
        if (symbol.indexOf('-USD')) {
          symbol = symbol.replace('-USD', 'USDT')
        }
        dbClient.writeCoinbaseTrades(symbol, [json])
      }
    }
  })
}

if (options.bitstamp) {
  const pusher = new Pusher('de504dc5763aeef9ff52')
  const tradesChannel = pusher.subscribe('live_trades')
  const tradesChannelEth = pusher.subscribe('live_trades_ethusd')
  /*
  { amount: 1,
  buy_order_id: 2673985763,
  sell_order_id: 2673987830,
  amount_str: '1.00000000',
  price_str: '154.04',
  timestamp: '1546585487',
  price: 154.04,
  type: 1,
  id: 80997270 }
  */
  tradesChannel.bind('trade', function (data) {
    dbClient.writeBitstampTrades('BTCUSDT', [data])
  })
  tradesChannelEth.bind('trade', function (data) {
    dbClient.writeBitstampTrades('ETHUSDT', [data])
  })
}
