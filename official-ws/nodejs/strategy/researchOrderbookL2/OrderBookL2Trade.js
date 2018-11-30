
const DeltaParser = require('../../libForBrowser')
const common = require('../common')

function OrderBook(options) {
  this.setOptions(options)
  this._data = []
  this._CLIENT = {
    _data: {},
    _keys: {}
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
    ...options
  }
}

OrderBook.prototype.update = function (json) {
  // this.watchUpdate(json)
  var newData = DeltaParser.onAction(json.action, json.table, 'XBTUSD', this._CLIENT, json)
  this._data = newData
  this.calcOrderLimitSignal()
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

OrderBook.prototype.calcOrderLimitSignal = function () {
  const lastBuyIndex = this.getLastBuyIndex()
  // 缓存成交价格两边的orderbook
  this._bid = this._data[lastBuyIndex]
  this._ask = this._data[lastBuyIndex + 1]
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

OrderBook.prototype.getTopBid = function () {
  return this._bid
}

OrderBook.prototype.getTopBidPrice = function () {
  return this._bid && this._bid.price
}

OrderBook.prototype.getTopAsk = function () {
  return this._ask
}

OrderBook.prototype.getTopAskPrice = function () {
  return this._ask && this._ask.price
}

OrderBook.prototype.getPriceGap = function() {
  return this.getTopAskPrice() - this.getTopBidPrice()
}

OrderBook.prototype.getOptions = function () {
  return this._options
}

module.exports = OrderBook
