


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

class BitmexManager {
  constructor(options) {
    this._options = {
      ...options
    }
    this._client = null
    this._initClient()
  }

  _initClient() {
    const client = new BitMEXClient({testnet: false});
    client.on('error', console.error);
    client.on('close', () => console.log('BitmexManager Connection closed.'));
    client.on('initialize', () => console.log('BitmexManager Client initialized, data is flowing.'));
    this._client = client
  }

  listenOrderBook(cb) {
    this._client.addStream('XBTUSD', 'orderBookL2_25', function(data, symbol, tableName) {
      cb(data, symbol, tableName)
    })
  }

  listenCandle({ binSize }, histCb, cb) {
    bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize, count: 200 }).then(json => {
      json = JSON.parse(json)
      const list = json.reverse()
      histCb(list)
      this._client.addStream('XBTUSD', `tradeBin${binSize}`, function(data, symbol, tableName) {
        cb(data, symbol, tableName)
      })
    })
  }

  listenTrade(cb) {
    this._client.addStream('XBTUSD', 'trade', function(data, symbol, tableName) {
      cb(data, symbol, tableName)
    })
  }
}

module.exports = BitmexManager
