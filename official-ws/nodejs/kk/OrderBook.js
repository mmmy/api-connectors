function OrderBook () {
	this.data = null
}

OrderBook.prototype._updateItem = function(side, item) {
	var price = item[0]
	var amount = item[1]
	var list = this.data.data[side]
	var index = list.length  // push
	var replace = false
	for (var i=0; i<list.length; i++) {
		var d = list[i]
		var p = d[0]
		if (price <= p) {
			index = i
			if (price === p) {
				replace = true
			}
			break
		}
	}
	if (amount === 0) {
		// 删除
		if (replace) {
			list.splice(index, 1)
		}
	} else {
		// 修改或者插入
		list.splice(index, replace ? 1 : 0, item)
	}
	this.data.data[side] = list
}

OrderBook.prototype.update = function(data) {
	if (!data.data.bids) {
		return
	}
	if (!this.data) {
		// 后台的数据是价格从高到低
		data.data.asks = data.data.asks.reverse()
		data.data.bids = data.data.bids.reverse()
		this.data = data
	} else {
		data.data.asks.forEach(item => {
			this._updateItem('asks', item)
		})
		data.data.bids.forEach(item => {
			this._updateItem('bids', item)
		})
		// test
		// for (var i=1; i<this.data.data.asks.length; i++) {
		// 	if (this.data.data.asks[i-1] > this.data.data.asks[i]) {
		// 		console.log('sort is wrong')
		// 	}
		// }
	}
}

function calcDepthRight(list) {
  var sum = 0
  var l = list.length
  for (var i=0; i<l; i++) {
    var v = list[i]
    if (v !== null) {
      sum += v
      list[i] = sum
    }
  }
  return list
}

function calcDepthLeft(list) {
  var sum = 0
  var l = list.length
  for (var i=l-1; i>=0; i--) {
    var v = list[i]
    if (v !== null) {
      sum += v
      list[i] = sum
    }
  }
  return list
}

OrderBook.prototype.calcData = function(depth) {
	var data = this.data.data
  var asks = data.asks,
      bids = data.bids,
      alls = bids.concat(asks)

  var bidsLen = bids.length,
      asksLen = asks.length,
      x = [],
      yGreen = [],
      yRed = []
  //asks(array):卖单深度 数组索引(string) 0 价格, 1 量(张), 2 量(币) 3, 累计量(币) 4,累积量(张)
  alls.forEach((item, i) => {
    x.push(item[0])
    var isGreen = i < bidsLen
    yGreen.push(isGreen ? +item[1] : null)
    yRed.push(!isGreen ? +item[1] : null)
  })

  if (depth) {
  	yGreen = calcDepthLeft(yGreen)
  	yRed = calcDepthRight(yRed)
  }

	return {
		x,
		yGreen,
		yRed
	}
}