const _ = require('lodash')
const WebSocket = require('ws');
var SocksProxyAgent = require('socks-proxy-agent');
var agent = new SocksProxyAgent('socks://127.0.0.1:1080');
const BFX = require('bitfinex-api-node')

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
// test
/*
	const bfx = new BFX({
	  ws: {
	    autoReconnect: true,
	    seqAudit: true,
	    agent: agent,
	    packetWDDelay: 10 * 1000
	  }
	})
	const bfxClient = bfx.ws(2, {
		manageOrderBooks: true,
		transform: true
	})
	bfxClient.on('error', (err) => console.log(err))
	bfxClient.on('open', () => {
	  bfxClient.subscribeOrderBook('tBTCUSD', 'P0', '25')
	})

	bfxClient.onOrderBook({ symbol: 'tBTCUSD' }, slow((ob) => {
		var data = {
			midPrice: ob.midPrice(),
			asks: ob.asks,
			bids: ob.bids
		}
		var dataStr = JSON.stringify(data)
	  console.log(`trades: ${dataStr}`)
    // ws.readyState == WebSocket.OPEN && ws.send(dataStr);
	}, 3000))
	bfxClient.open()
  
  // handle errors here. If no 'error' callback is attached. errors will crash the client.
  bfxClient.on('error', console.error);
  bfxClient.on('open', () => console.log('Connection opened.'));
  bfxClient.on('close', () => console.log('Connection closed.'));
return
*/
const wss = new WebSocket.Server({ port: 8098 });
 
wss.on('connection', function connection(ws) {
  // See 'options' reference below
	const bfx = new BFX({
	  ws: {
	    autoReconnect: true,
	    seqAudit: true,
	    agent: agent,
	    packetWDDelay: 10 * 1000
	  }
	})
	const bfxClient = bfx.ws(2, {
		manageOrderBooks: true,
		transform: true
	})
	bfxClient.on('error', (err) => console.log(err))
	bfxClient.on('open', () => {
	  bfxClient.subscribeOrderBook('tBTCUSD', 'P0', '100')
	})

	bfxClient.onOrderBook({ symbol: 'tBTCUSD' }, slow((ob) => {
		var data = {
			midPrice: ob.midPrice(),
			asks: ob.asks,
			bids: ob.bids
		}
		var dataStr = JSON.stringify(data)
	  // console.log(`trades: ${dataStr}`)
    ws.readyState == WebSocket.OPEN && ws.send(dataStr);
	}, 4000))

	bfxClient.open()
  
  // handle errors here. If no 'error' callback is attached. errors will crash the client.
  bfxClient.on('error', console.error);
  bfxClient.on('open', () => console.log('Connection opened.'));
  bfxClient.on('close', () => console.log('Connection closed.'));

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  
  ws.on('close', function() {
    bfxClient.close()
  })
})
