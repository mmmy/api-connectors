
const DeltaParser = require('../../libForBrowser')
const common = require('../common')

function OrderBook(options) {
  this.setOptions(options)
  this._data = []
  this._CLIENT = {
    _data: {},
    _keys: {}
  }
  this._buySellBigCompares = []
  this._buySellSmallCompares = []
  this._compareMaxLenth = 100
  this._signal = {
    long: false,
    short: false
  }
  // 最近的big
  this._bid = {}
  // 最近的ask
  this._ask = {}

  this._dataObject = {}// {price: object}
  this._partialed = false
}

OrderBook.prototype.setOptions = function (options) {
  this._options = {
    lenSmall: 1,
    lenBig: 16,
    rateSmall: 1.3,
    rateBig: 2,
    histLenSmall: 8,
    histLenBig: 30,
    ...options
  }
}

OrderBook.prototype.removeOldData = function () {
  if (this._buySellBigCompares.length > this._compareMaxLenth) {
    this._buySellBigCompares.shift()
  }
  if (this._buySellSmallCompares.length > this._compareMaxLenth) {
    this._buySellSmallCompares.shift()
  }
}

OrderBook.prototype.update = function (json) {
  this.watchUpdate(json)
  var newData = DeltaParser.onAction(json.action, json.table, 'XBTUSD', this._CLIENT, json)
  this._data = newData
  // this.calcOrderLimitSignal()
  // return this._buySellBigCompares.slice(-1).concat(this._buySellSmallCompares.slice(-1))
}

OrderBook.prototype.watchUpdate = function (json) {
  const bigSize = 1E6
  const bigUpdates = []
  const action = json.action
  const len = json.data.length
  if (action === 'partial') {
    for (let i = 0; i < len; i++) {
      const item = json.data[i]
      const price = item.price
      if (this._dataObject[price]) {
        throw Error('price is exist ?' + price)
      }
      this._dataObject[price] = { ...item }
    }
    this._partialed = true
  } else if (this._partialed) {

    if (action === 'insert') {
      for (let i = 0; i < len; i++) {
        const item = json.data[i]
        const price = item.price || common.xbtPriceFromID(item.id)
        const preData = this._dataObject[price]
        if (preData) {
          throw Error('insert 之前存在?' + json.data)
        }
        const size = item.size
        const newItem = {
          ...item,
          sizeDiff: size
        }
        this._dataObject[price] = newItem
        if (size > bigSize) {
          bigUpdates.push(newItem)
        }
      }
    } else if (action === "update") {
      for (let i = 0; i < len; i++) {
        const item = json.data[i]
        const price = common.xbtPriceFromID(item.id)
        const preData = this._dataObject[price]
        let preSize = 0
        if (preData) {
          preSize = preData.size
        }
        const sizeDiff = item.size - preSize
        const newItem = {
          ...preData,
          ...item,
          sizeDiff
        }

        this._dataObject[price] = newItem

        if (sizeDiff > bigSize) {
          bigUpdates.push(newItem)
        }
      }
    } else if (action === 'delete') {
      for (let i = 0; i < len; i++) {
        const item = json.data[i]
        const price = common.xbtPriceFromID(item.id)
        const preData = this._dataObject[price]
        if (preData) {
          const size = preData.size
          if (size > bigSize) {
            bigUpdates.push(preData)
          }
        }
        delete this._dataObject[price]
      }
    } else {
      throw Error('未知的action ?' + action)
    }
  }
  if (bigUpdates.length > 0 && this._options.watchBigOrder) {
    this._options.watchBigOrder(bigUpdates, action)
  }
}
// 为了保准orderlimit, 挂单, 需要确定挂单时机 和 价格, 计算方法需要 以后根据经验后不断调整!!
// 使用短深度与大深度 背离指标
OrderBook.prototype.calcOrderLimitSignal = function () {
  const lastBuyIndex = this.getLastBuyIndex()
  // 缓存成交价格两边的orderbook
  this._bid = this._data[lastBuyIndex]
  this._ask = this._data[lastBuyIndex + 1]

  var long = false
  var short = false
  var lenSmall = this._options.lenSmall
  var lenBig = this._options.lenBig
  var buyRange0 = [lastBuyIndex - lenSmall + 1, lastBuyIndex]
  var buyRange1 = [lastBuyIndex - lenSmall - lenBig + 1, lastBuyIndex - lenSmall]
  var sellRange0 = [lastBuyIndex + 1, lastBuyIndex + lenSmall]
  var sellRange1 = [lastBuyIndex + lenSmall + 1, lastBuyIndex + lenSmall + lenBig]

  var sumBuySize0 = this.sumSizeRange(buyRange0)
  var sumBuySize1 = this.sumSizeRange(buyRange1)
  var sumSellSize0 = this.sumSizeRange(sellRange0)
  var sumSellSize1 = this.sumSizeRange(sellRange1)

  var bigCompare = sumBuySize1 / sumSellSize1
  var smallCompare = sumBuySize0 / sumSellSize0
  this._buySellBigCompares.push(bigCompare)
  this._buySellSmallCompares.push(smallCompare)
  this.removeOldData()

  // 数据量需要大点, 平均才有意义, 突然的信号可是反向的一个波动!!, 不能取
  var signalLen = this._options.histLenBig
  var datalen = this._buySellBigCompares.length
  if (datalen > signalLen) {
    var signalRate = this._options.rateBig
    var bigIsLong = bigCompare > signalRate
    var bigIsShort = bigCompare < (1 / signalRate)
    // 判断该信息是不是稳定信息
    if (bigIsLong || bigIsShort) {
      for (var i = datalen - signalLen; i < datalen - 1; i++) {
        var sumv = this._buySellBigCompares[i]
        if (bigIsLong && sumv < signalRate) {
          bigIsLong = false
          break
        } else if (bigIsShort && sumv > (1 / signalRate)) {
          bigIsShort = false
          break
        }
      }
    }

    var smallRate = this._options.rateSmall
    var smallIsLong = smallCompare > smallRate
    var smallIsShort = smallCompare < (1 / smallRate)
    if (smallIsLong || smallIsShort) {
      var len = this._options.histLenSmall
      for (var i = datalen - len; i < datalen - 1; i++) {
        var ssumv = this._buySellSmallCompares[i]
        if (smallIsLong && ssumv < smallRate) {
          smallIsLong = false
          break
        } else if (smallIsShort && ssumv > smallRate) {
          smallIsShort = false
          break
        }
      }
    }

    // if (bigCompare > 2 || bigCompare < 1/2) {
    //   console.log(lastBuyIndex, bigCompare)
    // }
    // 背离, 挂单时机
    if (bigIsLong && smallIsShort/*&& sumBuySize0 > 5E5*/) {
      long = true
    } else if (bigIsShort && smallIsLong/*&& sumSellSize0 > 5E5*/) {
      short = true
    }
  }
  // 缓存到本地
  this._signal.long = long
  this._signal.short = short
  return this._signal
}

OrderBook.prototype.sumSizeRange = function (range) {
  var s = range[0]
  var e = range[1]
  var sum = 0
  for (var i = s; i <= e; i++) {
    var order = this._data[i]
    if (order) {
      sum += order.size
    }
  }
  return sum
}

OrderBook.prototype.getLastBuyIndex = function () {
  var len = this._data.length
  if (len > 1) {
    for (var i = 1; i < len; i++) {
      var preBook = this._data[i - 1]
      var book = this._data[i]
      if (preBook.side == 'Buy' && book.side == 'Sell') {
        return i - 1
      }
    }
  }
  return -1
}

OrderBook.prototype.getDepth = function (depth = 1) {
  var lastBuyIndex = this.getLastBuyIndex()
  if (lastBuyIndex > -1) {
    return this._data.slice(lastBuyIndex - depth + 1, lastBuyIndex + depth * 2)
  }
}
// 检查数据有效性 正确性, 一般在交易瞬间变化很大的时候会出现长度错误.
// 测试OK, 偶尔会长度错误, 正常
OrderBook.prototype.checData = function () {
  var len = this._data.length
  if (len > 1) {
    if (len !== 50) {
      throw 'orderbook l2_25 长度错误'
    }
  }
}

// test
OrderBook.prototype.getSumSizeTest = function () {
  var lastBuyIndex = this.getLastBuyIndex()
  var range = [lastBuyIndex - 24, lastBuyIndex]
  return this.sumSizeRange(range)
}

OrderBook.prototype.getSignal = function () {
  return this._signal
}

OrderBook.prototype.getTopBidPrice = function () {
  return this._bid && this._bid.price
}

OrderBook.prototype.getTopAskPrice = function () {
  return this._ask && this._ask.price
}

OrderBook.prototype.getOptions = function () {
  return this._options
}

module.exports = OrderBook
