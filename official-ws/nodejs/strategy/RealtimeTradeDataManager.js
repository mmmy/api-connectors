
/*
{ timestamp: '2018-07-09T12:22:54.662Z',
       symbol: 'XBTUSD',
       side: 'Buy',
       size: 100,
       price: 6706,
       tickDirection: 'ZeroPlusTick',
       trdMatchID: 'b36b58cf-29b3-4297-6450-089f75a89b0f',
       grossValue: 1491200,
       homeNotional: 0.014912,
       foreignNotional: 100 },
*/
function RealtimeTradeDataManager () {
  this._data = []
  this._maxLength = 100
}

RealtimeTradeDataManager.prototype.appendData = function(list) {
  this._data = this._data.concat(list).slice(this._data.length - this._maxLength)
}

RealtimeTradeDataManager.prototype.trendSignal = function() {
  var len = 15
  var data = this._data
  var dataLen = this._data.length
  var long = false
  var short = false
  // side 连续方向一致
  if (dataLen >= len) {
    var side = data[dataLen - 1].side
    if (side == 'Buy') {
      long = true
    } else {
      short = true
    }
    for(var i=dataLen - 1; i >= dataLen - len; i--) {
      if (data[i].side != side) {
        long = false
        short = false
        break
      }
    }
  }

  return { long, short }
}

RealtimeTradeDataManager.prototype.stableSignal = function() {
  var len = 30
  var data = this._data
  var dataLen = this._data.length
  // var long = false
  // var short = false
  if (dataLen >= len) {
    var prices = []
    var price0Count = 0
    for (var i=dataLen - len; i<dataLen; i++) {
      var price = data[i].price
      if (prices.indexOf(price) == -1) {
        prices.push(price)
      }
      if (price === prices[0]) {
        price0Count ++
      }
    }
    if (prices.length === 2 && Math.abs(price0Count - len / 2) < 4) {
      return true
    }
  }
  return false
}

module.exports = RealtimeTradeDataManager