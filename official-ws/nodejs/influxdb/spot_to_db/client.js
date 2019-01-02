const WebSocketClient = require('../../lib/ReconnectingSocket')
const pako = require('pako')

const okfutureUri = "wss://real.okex.com:10440/websocket/okexapi"
const okspotUri = "wss://real.okex.com:10440/ws/v1"

function createOkClient(uri, options, params, handleData) {
  const wsClient = new WebSocketClient(options);

  wsClient.onopen = function() {
    console.log('okex Connection opened.')
    wsClient.send(JSON.stringify(params))
  }
  wsClient.onclose = function(code) {
    console.log('okex Connection closed.')
  }
  wsClient.onmessage = function(buffer) {
    try {
      const json = pako.inflateRaw(buffer, {to: 'string'})
      handleData(json)
    } catch (err) {
      console.log('okex parse data error', err)
    }
  }
  wsClient.onerror = function(err) {
    console.log('okex onerror', err)
  }
  wsClient.onend = function() {
    console.log('okex Connection onend.')
  }
  wsClient.open(uri)
  return wsClient
}

function createBinanceClient(options, handleData) {
  const streams = ['btcusdt@trade', 'bnbbtc@trade'].join('/')
  const uri = 'wss://stream.binance.com:9443/stream?streams=' + streams
  const wsClient = new WebSocketClient(options);
  wsClient.onopen = function() {
    console.log('binance Connection onopen.')
  }
  wsClient.onmessage = function(rawData) {
    handleData(JSON.parse(rawData))
  }

  wsClient.onerror = function(e) {
    console.log('binance onerror', e)
  }

  wsClient.onclose = function(code) {
    console.log('binace Connection closed.', code)
  }

  wsClient.onend = function() {
    console.log('binace Connection onend.')
  }

  wsClient.open(uri)
  return wsClient
}

exports.createOkSpotClient = function(options, params, handleData) {
  return createOkClient(okspotUri, options, params, handleData)
}

exports.createBinanceClient = createBinanceClient
