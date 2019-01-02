
const args = require('../../strategy/argv')
const _ = require('lodash')
var SocksProxyAgent = require('socks-proxy-agent');
var agent = new SocksProxyAgent('socks://127.0.0.1:1080');
const BFX = require('bitfinex-api-node')
const { createOkSpotClient, createBinanceClient } = require('./client')
const { SpotDB } = require('../db')

const dbClient = new SpotDB()

const options = {
  ...args,
  bitfinex: true,
  okex: true,
  binance: true,
  database: true,
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
  }]
  //[{"channel":"ok_sub_spot_btc_usdt_deals","data":[["818723474","3770.6901","0.0027393","14:21:08","bid"]],"binary":0}]
  const okSpotClient = createOkSpotClient(options, params, function(jsonStr) {
    const json = JSON.parse(jsonStr)
    json.forEach(data => {
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
  const ss = createBinanceClient(options, function(json) {
    switch(json.stream) {
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
