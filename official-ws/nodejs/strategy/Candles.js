
var signal = require('./signal')

function RealTimeCandle(price) {
  this._data = {
    open: price,
    close: price,
    high: price,
    low: price,
    timestamp: new Date(),
  }
}
// 开始下个k线数据, 那么新K线继承上个close 的价格
RealTimeCandle.prototype.reset = function() {
  var price = this._data.close
  this._data.open = price
  this._data.high = price
  this._data.low = price
}

RealTimeCandle.prototype.update = function(price) {
  this._data.close = price
  this._data.high = Math.max(this._data.high, price)
  this._data.low = Math.min(this._data.low, price)
  this._data.timestamp = new Date()
}

RealTimeCandle.prototype.getCandle = function() {
  return Object.assign({}, this._data)
}

function Candles() {
  this._histories = []  // 官方格式的json schema, 最新的需要是数组的最后一个
  this._latestCandle = null
  this._maxLength = 200
  this._mayTrendSignal = { long: false, short: false }
}

Candles.prototype.setHistoryData = function(list) {
  this._histories = list
}
// 这是用来订阅 某时间级别的数据调用的
Candles.prototype.updateLastHistory = function(data) {
  var len = this._histories.length
  var lastData = this._histories[len - 1]
  var time = +new Date(data.timestamp)
  var lastTime = +new Date(lastData.timestamp)
  if (time > lastTime) {
    this._histories.push(data)
  } else if (time == lastTime) {
    this._histories[len - 1] = data
  } else {
    throw 'Candles: 最近的时间不是最新数据时间'
  }
  // 去掉多余数据
  if (this._histories.length > this._maxLength) {
    this._histories.shift()
  }
  // 计算缓存 信号
  this._mayTrendSignal = this.mayTrendReverseSignal()
  // 开始新的candle
  this._latestCandle && this._latestCandle.reset()
}

// 检验时间是否正常
Candles.prototype.checkData = function() {
  var _histories = this._histories
  var timeIntervals = []
  for(var i=1; i<_histories.length; i++) {
    var interval = new Date(_histories[i].timestamp) - new Date(_histories[i - 1].timestamp)
    if (interval < 0) {
      throw 'Candles: 顺序不对'
    }
    if (timeIntervals.length > 0 && interval !== timeIntervals[timeIntervals.length - 1]) {
      throw 'Candles: _histories 时间序列不合法'
    }
    timeIntervals.push(interval)
  }
}
// data 为bitmex 的realtime price
/*
{ table: 'trade',
  action: 'insert',
  data:
   [ { timestamp: '2018-07-09T06:32:43.133Z',
       symbol: 'XBTUSD',
       side: 'Buy',
       size: 404,
       price: 6709,
       tickDirection: 'ZeroPlusTick',
       trdMatchID: '2377c6c5-48e3-56f6-38d7-d6d8eccfbbda',
       grossValue: 6021620,
       homeNotional: 0.0602162,
       foreignNotional: 404 } ] } 
*/
Candles.prototype.updateRealTimeCandle = function(data) {
  this._latestCandle = this._latestCandle || new RealTimeCandle(data.price)
  this._latestCandle.update(data.price)
}

Candles.prototype.bollSignal = function(realTime) {
  var data = this.getCandles(realTime)
  var bbSignal = signal.BollingerBandsSignal(data)
  // console.log(bbSignal)
  return bbSignal
}

Candles.prototype.rsiSignal = function(realTime) {
  var data = this.getCandles(realTime)
  var rsi = signal.RSI(data)
  // console.log('rsi', rsi)
  return rsi
}
// 也许开始趋势反转, 这个根据历史数据
Candles.prototype.mayTrendReverseSignal = function() {
  const bbSignal = this.bollSignal()
  const rsi = this.rsiSignal()
  let long = false,
      short = false
  if (bbSignal.short && rsi < 30) {
    long = true
  } else if (bbSignal.long && rsi > 70) {
    short = true
  }

  return {
    long,
    short
  }
}
// 注意要先调用上面的, 在用这个
Candles.prototype.isReversed = function(maySignal) {
  const rsi = this.rsiSignal(true)
  let long = false,
      short = false

  if (maySignal.long && rsi > 30) {
    long = true
  } else if (maySignal.short && rsi < 70) {
    short = true
  }

  return { long, short }
}

Candles.prototype.getCandles = function(realTime) {
  return realTime ? this._histories.concat([this._latestCandle.getCandle()]) : this._histories
}

Candles.prototype.getMayTrendSignal = function() {
  return this._mayTrendSignal
}

module.exports = Candles
