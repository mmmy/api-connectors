
const Candles = require('./Candles')
const common = require('./common')

// 比如 通过一小时线计算成 4 小时线
class CandlesMerged extends Candles {
 
  constructor(options) {
    super(options)
    this._unMergeCandles = []  // 4小时线， 没过4根bar， 合并成一个bar
    this._mergeSize = 1 // 4小时线这里是4
  }
  // 比如四小时线需要从固定的小时开始
  _mergeValidTimeStart(timestamp) {
    return true
  }
  _mergeCandles() {
    if (this._unMergeCandles.length >= this._mergeSize) {
      const len = this._unMergeCandles.length
      const firstCandle = this._unMergeCandles[0]
      const lastCandle = this._unMergeCandles[len - 1]
      let highs = []
      let lows = []
      let volume = 0
      const open = firstCandle.open
      const close = lastCandle.close
      this._unMergeCandles.forEach(candle => {
        highs.push(candle.high)
        lows.push(candle.low)
        volume += candle.volume
      })
      var newCandle = {
        timestamp: firstCandle.timestamp,
        open,
        close,
        high: Math.max.apply(null, highs),
        low: Math.min.apply(null, lows),
        volume
      }
      this._histories.push(newCandle)
      this._unMergeCandles = []
      // check _histories
      // this.checkData()
      return true
    }
    return false
  }

  _pushCandle(candle) {
    // 初始化的时候需要验证 第一个时间 是否是一个开始时间
    var len = this._unMergeCandles.length
    const valid = (this._histories.length === 0 && len === 0) ? this._mergeValidTimeStart(candle.timestamp) : true
    if (valid) {
      // _unMergeCandles 时间也要合法
      if (len > 0) {
        var lastData = this._unMergeCandles[len - 1]
        var time = +new Date(candle.timestamp)
        var lastTime = +new Date(lastData.timestamp)
        if (time > lastTime) {
          this._unMergeCandles.push(candle)
        } else if (time == lastTime) {
          this._unMergeCandles[len - 1] = candle
        } else {
          throw 'CandlesMerged: 最近的时间不是最新数据时间'
        }
      } else {
        if (!this._mergeValidTimeStart(candle.timestamp)) {
          common.consoleRed('_unMergeCandles[0]不合法', candle)
        }
        this._unMergeCandles.push(candle)
      }
    }
    return this._mergeCandles()
  }
  // 这里list 是一小时线
  setHistoryData(list) {
    const len = list.length
    for (var i=0; i<len; i++) {
      this._pushCandle(list[i])
    }
    // 最后几根bar 需要merge到实时数据candle中, 否则实时数据的open high low 不准确
    this.updateUnmergeCandleToRealTime()
  }
  
  updateUnmergeCandleToRealTime() {
    var len = this._unMergeCandles.length
    if (len > 0) {
      var firstCandle = this._unMergeCandles[0]
      this.initLatestCandle(firstCandle.open)
      this._latestCandle.setOpen(firstCandle.open)
      // 遍历 merge high low
      this._unMergeCandles.map(candle => {
        this._latestCandle.mergeHighLow(candle)
      })
    }
  }
  // 单根K线, 一般来自sock 订阅数据, 比如1小时线, 一个小时推送一次
  updateLastHistory(data) {
    if (this._pushCandle(data)) {
      // 开始新的 _latestCandle: 这是实时的数据, 来源trade data
      this._latestCandle && this._latestCandle.reset()
      this.removeOldData()
    }
  }
}

module.exports = CandlesMerged
