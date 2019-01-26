const WebSocketClient = require('../../lib/ReconnectingSocket')
const pako = require('pako')

const okfutureUri = "wss://real.okex.com:10440/websocket/okexapi"
const okspotUri = "wss://real.okex.com:10440/ws/v1"

function createOkClient(uri, options, params, handleData) {
  const wsClient = new WebSocketClient(options);
  let _interval = null

  wsClient.onopen = function () {
    console.log('okex Connection opened.')
    wsClient.send(JSON.stringify(params))
    _interval = setInterval(() => {
      wsClient.send(JSON.stringify({ 'event': 'ping' }))
    }, 30 * 1000)
  }
  wsClient.onclose = function (code) {
    console.log('okex Connection closed.')
  }
  wsClient.onmessage = function (buffer) {
    try {
      const json = pako.inflateRaw(buffer, { to: 'string' })
      handleData(json)
    } catch (err) {
      console.log('okex parse data error', err)
    }
  }
  wsClient.onerror = function (err) {
    console.log('okex onerror', err)
  }
  wsClient.onend = function () {
    console.log('okex Connection onend.')
    clearInterval(_interval)
  }
  wsClient.open(uri)
  return wsClient
}

function createCommonClient(name, uri, params, options, handleData) {
  const wsClient = new WebSocketClient(options);
  wsClient.onopen = function () {
    console.log(`${name} Connection onopen.`)
    if (params) {
      console.log(`${name} send params`, params)
      wsClient.send(JSON.stringify(params))
    }
  }
  wsClient.onmessage = function (rawData) {
    handleData(JSON.parse(rawData))
  }

  wsClient.onerror = function (e) {
    console.log(`${name} onerror`, e)
  }

  wsClient.onclose = function (code) {
    console.log(`${name} Connection closed.`, code)
  }

  wsClient.onend = function () {
    console.log(`${name} Connection onend.`)
  }

  wsClient.open(uri)
  return wsClient
}

function createBinanceClient(streams, options, handleData) {
  const uri = 'wss://stream.binance.com:9443/stream?streams=' + streams.join('/')
  return createCommonClient('binance', uri, null, options, handleData)
}

function createHitbtcClient(symbol, options, handleData) {
  const uri = null
}
// params
// [{sub: "market.$symbol.trade.detail"}]
function createHuobiClient(subs, options, handleData) {
  const uri = 'wss://api.huobi.pro/ws'
  const wsClient = new WebSocketClient(options);

  wsClient.onopen = function () {
    console.log('huobi Connection opened.')
    subs.forEach(sub => {
      wsClient.send(JSON.stringify(sub))
    })
  }
  wsClient.onclose = function (code) {
    console.log('huobi Connection closed.')
  }
  wsClient.onmessage = function (buffer) {
    try {
      let text = pako.inflate(buffer, {
        to: 'string'
      });
      let msg = JSON.parse(text);
      if (msg.ping) {
        wsClient.send(JSON.stringify({
          pong: msg.ping
        }));
      } else if (msg.tick) {
        // console.log(msg);
        handleData(msg);
      } else {
        console.log(text);
      }
    } catch (err) {
      console.log('huobi parse data error', err)
    }
  }
  wsClient.onerror = function (err) {
    console.log('huobi onerror', err)
  }
  wsClient.onend = function () {
    console.log('huobi Connection onend.')
    clearInterval(_interval)
  }
  wsClient.open(uri)
  return wsClient
}

exports.createOkSpotClient = function (options, params, handleData) {
  return createOkClient(okspotUri, options, params, handleData)
}

exports.createOkFutureClient = function (options, params, handleData) {
  return createOkClient(okfutureUri, options, params, handleData)
}

exports.createBinanceClient = createBinanceClient
exports.createHuobiClient = createHuobiClient

exports.createCoinbaseClient = function(params, options, handleData) {
  const uri = 'wss://ws-feed.pro.coinbase.com'
  return createCommonClient('coinbase', uri, params, options, handleData)
}
