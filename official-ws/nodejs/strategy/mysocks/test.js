const WebSocketClient = require('../../lib/ReconnectingSocket')
var WebSocket = require('ws')
var SockServer = require('./SockServer')
var server = new SockServer()

server.startServer()
server.setData('book', [{k:+new Date() - 200, v:[Math.random() * 10 + 100, Math.random()*20 + 100]}, {k:new Date() - 100, v:[Math.random() * 10 + 100, Math.random()*20 + 100]}])
// console.log(server)
// return
setTimeout(() => {}, 5000)
var wsClient = new WebSocket('ws://127.0.0.1:8091')

wsClient.onopen = function() {
  console.log('Connection opened.')
  // wsClient.send(JSON.stringify(params))
}
wsClient.onclose = function(code) {
  console.log('Connection closed.')
}
wsClient.onmessage = function(data) {
  console.log('onmessage ============')
  console.log(data.data)
}
wsClient.onerror = function(e) {
  // console.log('ee------------',e)
}
wsClient.onend = function() {

}
// wsClient.open('ws://127.0.0.1:8091')

setInterval(() => {
  server.updateData('book', {k: +new Date(), v:[Math.random() * 10 + 100, Math.random()*20 + 100]})
}, 1000)
console.log(server._clients)
setTimeout(() => {
  wsClient.close()
}, 5000);
