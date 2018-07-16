
const WebSocket = require('ws')

// 增量式的socks , 初次连接的时候是全部数据, 然后会增量传输update 的数据
function SockServer() {
  this._port = 9003
  this._sock = null
  this._clients = []
  this._maxLength = 1000
  // 需要缓存所有的数据
  this._data = {
  }
}

SockServer.prototype.startServer = function() {
  const wss = new WebSocket.Server({ port: 8091 })
  wss.on('connection', this._onConnection.bind(this))
  wss.on('error', (e) => {
    console.log('SockSever error', e)
  })
  this._sock = wss
}

SockServer.prototype._onConnection = function(ws) {
  console.log('SockServer onconnection')
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
  console.log('ws close, clients length:', this._clients.length)
}

SockServer.prototype._sendMessage = function(msg) {
  this._clients.forEach(c => {
    if (c.readyState == WebSocket.OPEN) {
      c.send(msg)
    }
  })
}

SockServer.prototype._sendInitDataMessage = function(ws) {
  var message = {
    action: 'init',
    data: this._data
  }

  ws.send(JSON.stringify(message))
}

SockServer.prototype.updateData = function(name, data) {
  var oldData = this._data[name] || []
  oldData.push(data)
  if (oldData.length > this._maxLength) {
    oldData.shift()
  }
  this._data[name] = oldData
  this._sendUpdateMessage(name, data)
}

SockServer.prototype._sendUpdateMessage = function(name, data) {
  var message = {
    action: 'update',
    data: [data],
    name, 
  }
  this._sendMessage(JSON.stringify(message))
}

SockServer.prototype.setData = function(name, data) {
  this._data[name] = data
}

module.exports = SockServer
