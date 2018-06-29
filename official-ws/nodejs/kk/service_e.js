const WebSocket = require('ws');
const WebSocketClient = require('../lib/ReconnectingSocket');
const futureUri = "wss://real.okex.com:10440/websocket/okexapi"
const spotUri = "wss://real.okex.com:10441/websocket"
function createClient(uri, params, handleData) {
  const wsClient = new WebSocketClient();

  wsClient.onopen = function() {
    console.log('Connection opened.')
    wsClient.send(JSON.stringify(params))
  }
  wsClient.onclose = function(code) {
    console.log('Connection closed.')
  }
  wsClient.onmessage = function(data) {
    handleData(data)
  }
  wsClient.onerror = function() {

  }
  wsClient.onend = function() {

  }
  wsClient.open(uri)
  return wsClient
}
// test
/*
var futureParams = {
  event: 'addChannel',
  channel: 'ok_sub_futureusd_eos_depth_quarter'
}
const client = createClient(futureUri, futureParams, function(rawData) {
  console.log(rawData)
})
return
*/
/*
var spotParams = {
  event: 'addChannel',
  channel: 'ok_sub_spot_eos_usdt_depth'
}
const client = createClient(spotUri, spotParams, function(rawData) {
  console.log(rawData)
})
return
*/
const future_wss = new WebSocket.Server({ port: 8090 });
 
future_wss.on('connection', function connection(ws) {
  // See 'options' reference below
  var params = {
    event: 'addChannel',
    channel: 'ok_sub_futureusd_eos_depth_quarter'
  }
  const client = createClient(futureUri, params, function(rawData) {
    ws.readyState == WebSocket.OPEN && ws.send(rawData);
  })

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  
  ws.on('close', function() {
    client.close()
  })
})

const spot_wss = new WebSocket.Server({ port: 8091 });
 
spot_wss.on('connection', function connection(ws) {
  // See 'options' reference below
  var params = {
    event: 'addChannel',
    channel: 'ok_sub_spot_eos_usdt_depth'
  }
  const client = createClient(spotUri, params, function(rawData) {
    ws.readyState == WebSocket.OPEN && ws.send(rawData);
  })

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  
  ws.on('close', function() {
    client.close()
  })
})

