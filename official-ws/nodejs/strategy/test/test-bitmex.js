
const bitmextSdk = require('../bitmexSdk')
const BitMEXClient = require('../../index')
const common = require('../common')

function slow(func, wait) {
	var lastCall = 0
	return function() {
		var now = +new Date()
		if (now - lastCall > wait) {
			func.apply(null, arguments)
			lastCall = now
		}
	}
}

var log2min = slow(function() { console.log.call(null, arguments) }, 2 * 60 * 1000)

var _minMaxPrice = []
var _minMaxPrice1 = []

var testTradePrice = () => {}

const client = new BitMEXClient({testnet: false});
client.on('error', console.error);
client.on('close', () => console.log('Connection closed.'));
client.on('initialize', () => console.log('Client initialized, data is flowing.'));

client.addStream('XBTUSD', 'trade', function(data, symbol, tableName) {
  
  var lastData = data.data.slice(-1)[0]
  var lastPrice = lastData.price
  if (_minMaxPrice.length == 0) {
    _minMaxPrice[0] = lastPrice
    _minMaxPrice[1] = lastPrice
  } else {
    _minMaxPrice[0] = Math.min(_minMaxPrice[0], lastPrice)
    _minMaxPrice[1] = Math.max(_minMaxPrice[1], lastPrice)
  }
  var list = []
  if (_minMaxPrice1.length == 0) {
    _minMaxPrice1[0] = lastPrice
    _minMaxPrice1[1] = lastPrice
  } else {
    data.data.forEach(item => {
      var price = item.price
      _minMaxPrice1[0] = Math.min(_minMaxPrice1[0], price)
      _minMaxPrice1[1] = Math.max(_minMaxPrice1[1], price)
      list.push(price)
    })
  }

  var diff = [_minMaxPrice[0] - _minMaxPrice1[0], _minMaxPrice[1] - _minMaxPrice1[1]]
  var msg = `${diff} ${_minMaxPrice} ${_minMaxPrice1} datalen: ${data.data.length} ${Math.min.apply(null, list)} ${Math.max.apply(null, list)}`
  if (diff[0] != 0 || diff[1] != 0) {
    common.consoleRed(msg)
  } else {
    if (list.length > 1) {
      common.consoleGreen(msg)
    } else {
      console.log(msg)
    }
  }
});
