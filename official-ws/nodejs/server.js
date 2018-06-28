const WebSocket = require('ws');
const BitMEXClient = require('./index');

const wss = new WebSocket.Server({ port: 8099 });
 
wss.on('connection', function connection(ws) {
  // See 'options' reference below
  const client = new BitMEXClient({testnet: false});
  // handle errors here. If no 'error' callback is attached. errors will crash the client.
  client.on('error', console.error);
  client.on('open', () => console.log('Connection opened.'));
  client.on('close', () => console.log('Connection closed.'));
  client.on('initialize', () => console.log('Client initialized, data is flowing.'));

  client.addStream('XBTUSD', 'orderBookL2', function(data, symbol, tableName) {
    // console.log(`Got update for ${tableName}:${symbol}. Current state:\n${JSON.stringify(data).slice(0, 100)}...`);
    // Do something with the table data...
    ws.readyState == WebSocket.OPEN && ws.send(JSON.stringify(data));
  });

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  
  ws.on('close', function() {
    client.close()
  })
})
