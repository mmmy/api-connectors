
const WebSocket = require('ws')

// 增量式的socks , 初次连接的时候是全部数据, 然后会增量传输update 的数据
function SockServer() {
  this._port = 9002
  this._sock = null
  this._clients = []
  // 需要缓存所有的数据
  this._data = {
  }
}

SockServer.prototype.startServer = function() {
  const wss = new WebSocket.Server({ port: this._port })
  wss.on('connection', this._onConnection)
  this._sock = wss
}

SockServer.prototype._onConnection = function(ws) {
  ws.on('message', this._onMessage.bind(this, ws))
  ws.on('close', this._onClose.bind(this, ws))
  this._sendInitDataMessage(ws)
  this._clients.push(ws)
}

SockServer.prototype._onMessage = function(ws, msg) {

}

SockServer.prototype._onClose = function(ws) {
  var index = this._clients.indexOf(ws)
  this._clients.splice(index, 1)
}

SockServer.prototype._sendMessage = function(msg) {
  this._clients.forEach(c => {
    c.send(msg)
  })
}

SockServer.prototype._sendInitDataMessage = function(ws) {
  var message = {
    tableName: 'init',
    data: this._data
  }

  ws.send(JSON.stringify(message))
}

SockServer.prototype.sendUpdateMessage = function(key, data) {
  var message = {
    tableName: 'update',
    key,
    data
  }
  this._sendMessage(JSON.stringify(message))
}

SockServer.prototype.setData = function(key, value) {
  this._data[key] = value
}
