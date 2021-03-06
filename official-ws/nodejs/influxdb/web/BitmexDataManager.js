
function xbtPriceFromID(id) {
	const instrumentIdx = 88
	const tickSize = 0.01
	return ((1e8 * instrumentIdx) - id) * tickSize
}

function BitmexDataManager(options) {
  this._options = {
    ...options
  }
  this._ob = new OrderBookWeb()
  this._orderbookHistory = []
  this._originData = []
}

BitmexDataManager.prototype.listenJson = function(json, index) {
  const { table, action, data } = json
  switch(table) {
    case 'orderBookL2_25':
      this.updateOrderBook(json, index)
      break
    default:
      break
  }
}
// index 为原始数据索引
BitmexDataManager.prototype.updateOrderBook = function(json, index) {
  if (json.action === 'partial') {
    json.keys = ['symbol', 'id', 'side']
  }
  this._ob.update(json)
  this._orderbookHistory.push({
    book: this._ob.getData(),
    index: index
  })
}

BitmexDataManager.prototype.setData = function(list) {
  this._originData = list
  this.canculate()
}

BitmexDataManager.prototype.canculate = function() {
  this._originData.forEach((json, i) => {
    this.listenJson(json, i)
  })
}

BitmexDataManager.prototype.getOrderBookByIndex = function(index) {
  return this._orderbookHistory[index]
}
// 根据原始数据的索引获取 interval 秒之前的交易数据
BitmexDataManager.prototype.getTrades = function(index, seconds = 5) {
  let endTime = null
  let trades = []
  for (i = index; i >= 0; i--) {
    const json = this._originData[i]
    if (json.table === 'trade') {
      const data = json.data
      trades.unshift(data)
      if (!endTime) {
        endTime = new Date(json.data[0].timestamp)
      }
      if (endTime - new Date(data[0].timestamp) > seconds * 1000) {
        break
      }
    }
  }
  return trades
}

BitmexDataManager.prototype.getOrderBookActions = function(index, count=2) {
  const updates = []
  for (i = index; i >= 0; i--) {
    if (updates.length >= count) {
      break
    }
    const json = this._originData[i]
    if (json.table === 'orderBookL2_25') {
      json.data.forEach(d => d.price = xbtPriceFromID(d.id))
      updates.push(json)
    }
  }
  return updates
}

function BitmexDataDB() {

}

BitmexDataDB.prototype.getData = function(from, to) {
  let url = `http://127.0.0.1:8086/query?db=raw_data&q=select * from json where time > '${from}' and time < '${to}'`
  // console.log(url)
  return new Promise((resovle) => {
    $.get(url, function(data) {
      let list = []
      if (data.results.length > 0) {
        list = data.results[0].series[0].values.map(row => ({
          time: row[0],
          action: row[1],
          data: JSON.parse(row[2]),
          table: row[3],
        }))
      }
      resovle(list)
    })
  })
}
