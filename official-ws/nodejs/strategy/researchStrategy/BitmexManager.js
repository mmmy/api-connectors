


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
  /* 
  { table: 'orderBookL2_25',
  action: 'update',  // 'insert', 'delete'
  data:
   [ { symbol: 'XBTUSD', id: 8799570200, side: 'Sell', size: 76715 },
     { symbol: 'XBTUSD', id: 8799570550, side: 'Sell', size: 10617 },
     { symbol: 'XBTUSD', id: 8799570600, side: 'Sell', size: 187141 },
     { symbol: 'XBTUSD', id: 8799570700, side: 'Sell', size: 1012791 },
     { symbol: 'XBTUSD', id: 8799570800, side: 'Sell', size: 182780 },
     { symbol: 'XBTUSD', id: 8799570900, side: 'Sell', size: 51365 },
     { symbol: 'XBTUSD', id: 8799571400, side: 'Buy', size: 754186 },
     { symbol: 'XBTUSD', id: 8799571700, side: 'Buy', size: 56857 },
     { symbol: 'XBTUSD', id: 8799571850, side: 'Buy', size: 25311 },
     { symbol: 'XBTUSD', id: 8799572200, side: 'Buy', size: 47089 },
     { symbol: 'XBTUSD', id: 8799572300, side: 'Buy', size: 38650 } ] }
  */
  listenOrderBook(cb) {
    this._client.addStream('XBTUSD', 'orderBookL2_25', function(data, symbol, tableName) {
      cb(data, symbol, tableName)
    })
  }

  listenCandle({ binSize, count }, histCb, cb) {
    bitmextSdk.getTradeHistory({ symbol: 'XBTUSD', binSize, count: count || 200 }).then(json => {
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
