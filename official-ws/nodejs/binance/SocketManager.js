const WebSocket = require('ws');
var SocksProxyAgent = require('socks-proxy-agent');
var agent = new SocksProxyAgent('socks://127.0.0.1:7891');

class SocketManager {
  constructor(options) {
    this._options = {
      ...options
    }
  }

  open(url) {
    const noProxy = this._options.noProxy
    this.url = url;
    this.instance = new WebSocket(this.url, { agent: noProxy ? null : agent });
    this.instance.on('open', () => {
      this.onopen()
    })
    this.instance.on('message', (data, flags) => {
      this.instance.on('message')
    })
  }
}