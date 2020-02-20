const _ = require('lodash')
const WebSocketClient = require('../lib/ReconnectingSocket')
const utils = require('./common/utils')

const BaseStreams = [
  '!miniTicker@arr' //
]

class MarketManager {
  constructor(options) {
    this._options = _.merge({
      testnet: true
    }, options)

    this.wsClient = new WebSocketClient(this._options)
    this.wsClient.onopen = this._onopen.bind(this)
    this.wsClient.onclose = this._onclose.bind(this)
    this.wsClient.onmessage = this._onmessage.bind(this)
    this.wsClient.onerror = this._onerror.bind(this)
    this.wsClient.onend = this._onend.bind(this)

    this._data = {
      '24hrMiniTicker': {
      }
    }

    this._observers = []

    this._openWs()
    
  }
  // 获取最新成交价
  getCurrentPrice(symbol) {
    const tickerData = this._data['24hrMiniTicker'][symbol]
    if (tickerData) {
      const now = new Date()
      const updateTime = new Date(tickerData.E)
      // 判断有效性
      if (Math.abs(now - updateTime) < 5 * 60 * 1000) {
        return +tickerData.c
      }
    }
    return 0
  }

  addAbserver(observer) {
    if (this._observers.indexOf(observer) === -1) {
      this._observers.push(observer)
    }
  }

  _initPongInterval() {
    clearInterval(this._pongInterval)
    // 每5分钟
    this._pongInterval = setInterval(() => {
      this.wsClient.send(JSON.stringify({
        pong: +new Date()
      }))
    }, 5 * 60 * 1000)
  }

  _subscribeStream(params) {
    this.wsClient.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params,
      id: Math.round(Math.random() * 10000)
    }))
  }

  _openWs() {
    this.wsClient.close()
    const baseurl = utils.getWsEndpoint(this._options.testnet)
    const url = `${baseurl}/ws/${this._listenKey}`
    this.wsClient.open(url)
  }

  _onopen() {
    console.log('Market Manager ws opened')
    this.wsClient.addListener('reconnect', () => {
      console.log('recconect MarketManager ws')
      this._subscribeStream(BaseStreams)
    })
    this._subscribeStream(BaseStreams)
  }

  _onclose() {
    console.log('MarketManager ws closed...')
  }

  _onmessage(data) {
    try {
      data = JSON.parse(data)
    } catch (e) {
      console.log('binace MarketManager Unable to parse incoming data:', e)
      return
    }
    const d0 = data[0]
    if (d0 && d0.e === '24hrMiniTicker') {
      this._data['24hrMiniTicker'][d0.s] = d0
      this._triggerEvent('24hrMiniTicker', d0)
    }
    // console.log(this._accountDataManager.getData())
    // if (data.ping) {
      // console.log(data[0])
    // }
  }

  _triggerEvent(eventName, data) {
    this._observers.forEach((observer) => {
      if (observer && observer.listenMarketData) {
        observer.listenMarketData(eventName, data, this)
      } 
    })
  }

  _onerror(e) {
    console.log('MarketManager ws error...', e)
  }

  _onend(code) {
    console.log('MarketManager ws end...', code)
  }
}

module.exports = MarketManager
