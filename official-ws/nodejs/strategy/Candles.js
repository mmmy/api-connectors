
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
RealTimeCandle.prototype.reset = function () {
  var price = this._data.close
  this._data.open = price
  this._data.high = price
  this._data.low = price
}

RealTimeCandle.prototype.mergeHighLow = function (candle) {
  this._data.high = Math.max(this._data.high, candle.high)
  this._data.low = Math.min(this._data.low, candle.low)
}

RealTimeCandle.prototype.setOpen = function (open) {
  this._data.open = open
}

RealTimeCandle.prototype.update = function (price) {
  this._data.close = price
  this._data.high = Math.max(this._data.high, price)
  this._data.low = Math.min(this._data.low, price)
  this._data.timestamp = new Date()
}

RealTimeCandle.prototype.getCandle = function () {
  return Object.assign({}, this._data)
}

function Candles(options) {
  this.setOptions(options)
  this._histories = []  // 官方格式的json schema, 最新的需要是数组的最后一个
  this._latestCandle = null
  this._maxLength = 400
  this._mayTrendSignal = { long: false, short: false }
  this._stochRsiSignals = []      // { long: false, short: false, timestamp: 0 }
}

Candles.prototype.setOptions = function (options) {
  this._options = {
    smaFastLen: 29,
    smaSlowLen: 50,
    smaFilterLen: 8, // 一般用于均线过滤, 比如日线在8日均线以上
    sarStart: 0.02,
    sarStep: 0.02,
    sarMax: 0.11, // 0.11 - 0.13 good
    ...options
  }
}

Candles.prototype.getOptions = function () {
  return this._options
}

Candles.prototype.setHistoryData = function (list) {
  this._histories = list
}
// 这是用来订阅 某时间级别的数据调用的
Candles.prototype.updateLastHistory = function (data) {
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

  this.removeOldData()
  // 计算缓存 信号
  // this._mayTrendSignal = this.mayTrendReverseSignal()
  // 开始新的candle
  this._latestCandle && this._latestCandle.reset()
}

Candles.prototype.removeOldData = function () {
  // 去掉多余数据
  if (this._histories.length > this._maxLength) {
    this._histories.shift()
  }
}

// 检验时间是否正常
Candles.prototype.checkData = function () {
  var _histories = this._histories
  var timeIntervals = []
  for (var i = 1; i < _histories.length; i++) {
    var interval = new Date(_histories[i].timestamp) - new Date(_histories[i - 1].timestamp)
    if (interval < 0) {
      throw 'Candles: 顺序不对'
    }
    if (timeIntervals.length > 0 && interval !== timeIntervals[timeIntervals.length - 1]) {
      console.log(_histories.slice(-2))
      // throw 'Candles: _histories 时间序列不合法'
      console.log('Candles: _histories 时间序列不合法')
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
Candles.prototype.updateRealTimeCandle = function (data) {
  this.initLatestCandle(data.price)
  this._latestCandle.update(data.price)
}

Candles.prototype.initLatestCandle = function (price) {
  this._latestCandle = this._latestCandle || new RealTimeCandle(price)
}

Candles.prototype.bollSignalSeries = function (realTime) {
  var klines = this.getCandles(realTime)
  const bbSignal = signal.BBSignalSeries(klines)
  return bbSignal
}

Candles.prototype.bollSignal = function (realTime) {
  var data = this.getCandles(realTime)
  var bbSignal = signal.BollingerBandsSignal(data)
  // console.log(bbSignal)
  return bbSignal
}

Candles.prototype.rsiSignal = function (realTime, len) {
  var data = this.getCandles(realTime)
  var rsis = signal.RSI(data, len)
  // console.log('rsi', rsi)
  return rsis
}
// rsi divergence
Candles.prototype.rsiDivergenceSignal = function(realTime, len = 8, divergenceLen = 24) {
  const data = this.getCandles(realTime)
  const rsis = signal.RSI(data, len)
  const rsisDivergence = rsis.slice(-divergenceLen - 1)
  const lastRsi = rsisDivergence[rsisDivergence.length - 1]
  const histRsis = rsisDivergence.slice(0, rsisDivergence.length - 1)

  let long = false
  let short = false
  let isCurrentHighest = this.isCurrentHighestLowestClose(true, divergenceLen, 0)
  let isCurrentLowest = this.isCurrentHighestLowestClose(false, divergenceLen, 0)
  if (isCurrentHighest) {
    const theshold_top = 80
    // 其中含有了Rsi超高阈值
    const isOverBoughtHappend = Math.max.apply(null, rsisDivergence) > theshold_top
    if (isOverBoughtHappend) {
      const isDivergenceShort = lastRsi < Math.max.apply(null, histRsis)
      if (isDivergenceShort) {
        short = true
      }
    }
  }
  if (isCurrentLowest) {
    const theshold_bottom = 20
    const isOverSoldHappend = Math.min.apply(null, rsisDivergence) < theshold_bottom
    if (isOverSoldHappend) {
      const isDivergenceLong = lastRsi > Math.min.apply(null, histRsis)
      if (isDivergenceLong) {
        long = true
      }
    }
  }
  // const { maxHigh, minLow } = signal.highestLowestHighLow(data, divergenceLen)
  return {
    long,
    short
  }
}

// 也许开始趋势反转, 这个根据历史数据
Candles.prototype.mayTrendReverseSignal = function () {
  const bbSignal = this.bollSignal()
  const rsis = this.rsiSignal()
  const lastRsi = rsis[rsis.length - 1]
  const lastRsi2 = rsis[rsis.length - 2]
  let long = false,
    short = false
  // if (bbSignal.short && lastRsi < lastRsi2 && lastRsi < 28) {
  if (bbSignal.short && lastRsi < 29) {
    // if (bbSignal.short && lastRsi < 29) {
    long = true
    // } else if (bbSignal.long && lastRsi > lastRsi2 && lastRsi > 72) {
  } else if (bbSignal.long && lastRsi > 71) {
    // } else if (bbSignal.long && lastRsi > 71) {
    short = true
  }

  return {
    long,
    short
  }
}
// 注意要先调用上面的, 在用这个
Candles.prototype.isReversed = function (maySignal) {
  const rsis = this.rsiSignal(true)
  const lastRsi = rsis[rsis.length - 1]
  const lastRsi2 = rsis[rsis.length - 2]
  let long = false,
    short = false

  if (maySignal.long && lastRsi - lastRsi2 > 2) {
    // if (maySignal.long && lastRsi > 30 ) {
    long = true
  } else if (maySignal.short && lastRsi - lastRsi2 < -2) {
    // } else if (maySignal.short && lastRsi < 70) {
    short = true
  }

  return { long, short }
}

Candles.prototype.macdTrendSignal = function (realTime = true) {
  var klines = this.getCandles(realTime)
  const macds = signal.MacdSignal(klines)
  let long = false,
    short = false

  if (macds.length > 5) {
    const lastMacd = macds[macds.length - 1]
    const lastMacd2 = macds[macds.length - 2]
    const lastMacd3 = macds[macds.length - 3]
    const lastMacd4 = macds[macds.length - 4]
    long = lastMacd.MACD > lastMacd2.MACD
    // && lastMacd2.MACD > lastMacd3.MACD
    // && lastMacd3.MACD > lastMacd4.MACD
    short = lastMacd.MACD < lastMacd2.MACD
    // && lastMacd2.MACD < lastMacd3.MACD
    // && lastMacd3.MACD < lastMacd4.MACD
  }

  return {
    long,
    short
  }
  // console.log(macds)
  // console.log(long)
}
// MACD 背离信号
Candles.prototype.macdDepartSignal = function (realTime = false, len = 90, offset = 0) {
  var klines = this.getCandles(realTime, offset)
  let macds = signal.MacdSignal(klines)
  let long = false,
    short = false

  let backLen = len
  let isCurrentHighest = this.isCurrentHighestLowestClose(true, backLen, offset)
  let isCurrentLowest = this.isCurrentHighestLowestClose(false, backLen, offset)
  if (isCurrentHighest || isCurrentLowest) {
    macds = macds.slice(-backLen)
    let maxMacd, minMacd
    if (macds.length > 0) {
      const currentMacd = macds[macds.length - 1].MACD
      // console.log(currentMacd)
      macds.forEach((macd, i) => {
        const MACD = macd.MACD
        if (i === 0) {
          maxMacd = MACD
          minMacd = MACD
        } else {
          maxMacd = Math.max(maxMacd, MACD)
          minMacd = Math.min(minMacd, MACD)
        }
      })
      if (isCurrentHighest && (currentMacd * 1.1 < maxMacd)) {
        short = true
      } else if (isCurrentLowest && (currentMacd * 1.1 > minMacd)) {
        long = true
      }
    }
  }

  return {
    long,
    short
  }
}
// 判断当前k线的收盘价是最近最高的
Candles.prototype.isCurrentHighestLowestClose = function (isHighest, backlen, offset) {
  let histories = this.getCandles(false, offset)
  const len = histories.length
  if (len < backlen) {
    return false
  }
  const currentClose = histories[len - 1].close
  for (let i = 1; i < backlen; i++) {
    const candle = histories[len - i - 1]
    if (candle) {
      if (isHighest && candle.close > currentClose) {
        return false
      } else if (!isHighest && candle.close < currentClose) {
        return false
      }
    }
  }
  return true
}

// 抛物线转向计算
Candles.prototype.sarSignal = function (realTime) {
  var klines = this.getCandles(realTime)
  var sarSignal = signal.PasrSignal(klines, this._options.sarStart, this._options.sarStep, this._options.sarMax)
  // list of bool for longs
  return sarSignal.signals
}
// 计算快线sma 和 慢线sma的 各种指标
Candles.prototype.smaSignal = function (realTime) {
  var klines = this.getCandles(realTime)
  smaSignal = signal.SmaSignal(klines, this._options.smaFastLen, this._options.smaSlowLen)
  // 详见signal.js
  return smaSignal
}

// sar he sma 策略, 初步论证在tradingview上
Candles.prototype.sarSmaSignal = function (realTime) {
  const sarS = this.sarSignal(realTime)
  const sarSLen = sarS.length
  // 注意 :按照tradingview 上的回测 来, 需要等一个bar!
  const sarSLatest = sarS[sarSLen - 1]
  const sarSLatest1 = sarS[sarSLen - 2]
  const sarSLatest2 = sarS[sarSLen - 3]
  // 信号反转了
  const sarLong = sarSLatest1 && !sarSLatest2
  // 信号反转了
  const sarShort = !sarSLatest1 && sarSLatest2
  const smaS = this.smaSignal(realTime)
  const { signals, diff } = smaS
  // test ok
  /*
  const barsLastMaShort = signal.barssince(signals, false)
  const barsLastMaLong = signal.barssince(signals, true)
  //console.log('barsLastMa', barsLastMaShort, barsLastMaLong)
  // test ok
  const barsLastSarShort = signal.barssince(sarS, false)
  const barsLastSarLong = signal.barssince(sarS, true)
  // console.log(barsLastSarShort, barsLastSarLong)
  // test ok
  const barsLast2SarShort = signal.barssince2(sarS, false)
  const barsLast2SarLong = signal.barssince2(sarS, true)
  // console.log('barsLast2Sar', barsLast2SarShort, barsLast2SarLong)
  */
  let long = false
  let short = false
  // long: 之前一段时间ma 和 sar 都是向上的, 突然sar 向下了一下, sar 又向上了
  if (sarLong) {
    // 最近一次下跌趋势是很久之前的事
    const barsLastMaShort = signal.barssince(signals, false)
    const barsLast2SarLong = signal.barssince2(sarS, true)
    // 最近上涨趋势
    // < 30 是回测的最优值
    if (barsLastMaShort > barsLast2SarLong && barsLastMaShort < 30) {
      long = true
    }
  } else if (sarShort) {
    const barsLastMaLong = signal.barssince(signals, true)
    const barsLast2SarShort = signal.barssince2(sarS, false)
    // 做空信号要强, 否则不做
    if (barsLastMaLong > barsLast2SarShort && barsLastMaLong < 30) {
      const diffLatest = diff[diff.length - 1]
      const diffLatest1 = diff[diff.length - 2]
      // 均线趋势还在下降
      if (diffLatest < diffLatest1) {
        short = true
      }
    }
  }

  return {
    long,
    short
  }
}
// len = 50, 1min 最佳
Candles.prototype.getMinMaxClose = function (len, realTime) {
  var klines = this.getCandles(realTime)
  return signal.highestLowestClose(klines, len)
}
// 1min sar ma, len: 50, max: 70, min: 30
Candles.prototype.minMaxCloseFilter = function (len, max, min) {
  const { minClose, maxClose } = this.getMinMaxClose(len, false)
  const diff = maxClose - minClose
  return diff > min && diff < max
}


Candles.prototype.priceRateFilter = function (len, rateMin, rateMax = 2) {
  const lastCandle = this.getHistoryCandle(1)
  const { minClose, maxClose } = this.getMinMaxClose(len, false)
  const pMin = minClose + (maxClose - minClose) * rateMin
  const pMax = minClose + (maxClose - minClose) * rateMax
  return lastCandle.close >= pMin && lastCandle.close <= pMax
}

Candles.prototype.getMinMaxHighLow = function (len, realTime) {
  var klines = this.getCandles(realTime)
  return signal.highestLowestHighLow(klines, len)
}

Candles.prototype.priceRateFilterHighLow = function (len, rateMin, rateMax = 2) {
  const lastCandle = this.getHistoryCandle(1)
  const { minLow, maxHigh } = this.getMinMaxHighLow(len, false)
  const pMin = minLow + (maxHigh - minLow) * rateMin
  const pMax = minLow + (maxHigh - minLow) * rateMax
  return lastCandle.close >= pMin && lastCandle.close <= pMax
}

// 主要是为了确认 在backOffset bar 之前是上涨或者下跌趋势, 方法之一是用布林带
Candles.prototype.barsIsInTrend = function (realTime, long, backOffset, bars) {
  const { signals } = this.bollSignalSeries(realTime) // [1, 0, -1] 三种值
  const sLen = signals.length // sLen 100
  if (backOffset + bars > sLen) {
    console.error('barsIsInTrend signals is not enough')
    return false
  }
  let result = true
  for (var i = 0; i < bars; i++) {
    const v = signals[sLen - 1 - backOffset - i]
    // 是否是上升趋势
    if (long && v === -1) {
      result = false
      break
    } else if (!long && v === 1) {
      result = false
      break
    }
  }
  return result
}

// 找到最近的RSI 顶部或者底部 的k线数
Candles.prototype.barsLastRsiOverTrade = function (realTime, len = 14, bottom = 30, top = 70) {
  const rsis = this.rsiSignal(realTime, len)
  let rsiLen = rsis.length
  let atBottom = true
  let index = -1
  for (var i = rsiLen - 1; i >= 0; i--) {
    const rsiV = rsis[i]
    if (rsiV < bottom) {
      atBottom = true
      index = i
      break
    } else if (rsiV > top) {
      atBottom = false
      index = i
      break
    }
  }
  return {
    atBottom,
    bars: rsiLen - index  // 距离最近K线bar数量
  }
}
// realTime = false !!
// 适用于震荡市, 超跌, 超买之后的反弹, 利用rsi 和布林带组合, 这里的默认参数适合1min
Candles.prototype.rsiBbReverseSignal = function (realTime, efficientBars = 10, continuousTrendBars = 40) {
  let long = false
  let short = false
  // const efficientBars = 10  //信号过去了10bar, 我们认为无效了
  // const continuousTrendBars = 40 //信号出现之前连续出现上涨或者下跌
  // rsi 为8, 上下为80, 20
  const { atBottom, bars } = this.barsLastRsiOverTrade(realTime, 10, 20, 80) // bars 最小是 1
  if (bars < efficientBars) {
    const lastCandle = this.getHistoryCandle(1)
    const signalCandle = this.getHistoryCandle(bars)
    // may reverse to long
    if (atBottom) {
      //TODO 当前闭合K线的close价格已经超过信号线的 (open close) 最高值(这个很重要), 表明趋势已经反转
      const isCloseBreakUp = (lastCandle.close > lastCandle.open) && (lastCandle.close > Math.max(signalCandle.open, signalCandle.close))
      if (isCloseBreakUp) {
        // 而且之前的(40)根bar一直在跌, 这个一般作为过滤器
        const isLastBarsIsShort = this.barsIsInTrend(realTime, false, efficientBars, continuousTrendBars)
        if (isLastBarsIsShort) {
          long = true
        }
      }
    } else {
      // 与上面相反
      const isCloseBreakDown = (lastCandle.close < lastCandle.open) && (lastCandle.close < Math.min(signalCandle.open, signalCandle.close))
      if (isCloseBreakDown) {
        const isLastBarsIsLong = this.barsIsInTrend(realTime, true, efficientBars, continuousTrendBars)
        if (isLastBarsIsLong) {
          short = true
        }
      }
    }
  }
  return {
    long,
    short
  }
}

// 用于sma交叉策略
Candles.prototype.smaCrossSignal = function () {
  if (this._histories.length < this._options.smaSlowLen + 2) {
    return {
      long: false,
      short: false
    }
  }
  const smaS = this.smaSignal(false)
  const { signals } = smaS
  const sLen = signals.length
  const lastS = signals[sLen - 1]
  const lastS2 = signals[sLen - 2]
  // 金叉
  const goldCross = lastS && !lastS2
  if (goldCross) {
    let lastBar = this._histories.slice(-1)
    let a = 1
  }
  // 暂时不做空
  const deathCross = !lastS && lastS2
  return {
    long: goldCross,
    short: deathCross
  }
}
// 计算效率更高
Candles.prototype.smaCrossSignalFast = function () {
  if (this._histories.length < this._options.smaSlowLen + 2) {
    return {
      long: false,
      short: false
    }
  }
  const klines = this.getCandles(false)
  const { goldCross, deadCross, fastMa } = signal.SmaCross(klines, this._options.smaFastLen, this._options.smaSlowLen)
  return {
    long: goldCross,
    short: deadCross,
    fastMa
  }
}

// 一般是实时的
Candles.prototype.priceIsAboveSma = function () {
  var klines = this.getCandles(true)
  return signal.PriceAboveSma(klines, this._options.smaFilterLen)
}

Candles.prototype.getLastHistoryClose = function () {
  return this._histories[this._histories.length - 1].close
}
// 从最后一个开始索引
Candles.prototype.getHistoryCandle = function (bars=1) {
  return this._histories[this._histories.length - bars]
}
// 获取 _histories 的最后一个close
Candles.prototype.getLastHistoryClose = function () {
  return this.getHistoryCandle(1).close
}

Candles.prototype.getCandles = function (realTime, offset) {
  let candles = realTime ? this._histories.concat([this._latestCandle.getCandle()]) : this._histories
  if (offset > 0) {
    candles = candles.slice(0, candles.length - offset)
  }
  return candles
}

Candles.prototype.getMayTrendSignal = function () {
  return this._mayTrendSignal
}

Candles.prototype.isReady = function () {
  return this._histories.length > 100 && this._latestCandle
}
// 计算最近的高点低点信息（极值）弃用
Candles.prototype.canculateTopBottomOffest = function (points = 4) {

}

Candles.prototype.calcStochRsiSignal = function (rsiPeriod, stochasticPeriod, kPeriod, dPeriod, timestamp) {
  //[{stochRSI, k, d}]
  const result = signal.StochasticRsi(this.getCandles(false), rsiPeriod, stochasticPeriod, kPeriod, dPeriod)
  const len = result.length
  let long = false
  let short = false
  if (len > 0) {
    const r0 = result[len - 1]
    const r1 = result[len - 2]
    // k线金叉
    if (r0.k >= r0.d && r1.k < r1.d) {
      long = true
    } else if (r0.k <= r0.d && r1.k > r1.d) {
      short = true
    }
  }
  const info = {
    long,
    short,
    timestamp,
  }
  if (long || short) {
    this._stochRsiSignals.push(info)
    if (this._stochRsiSignals.length > 200) {
      this._stochRsiSignals.shift()
    }
  }
  return info
}

Candles.prototype.getStochRsiSignals = function () {
  return this._stochRsiSignals
}

module.exports = Candles
