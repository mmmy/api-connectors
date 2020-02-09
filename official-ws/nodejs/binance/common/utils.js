exports.getWsEndpoint = function(testnet) {
  return testnet ? 'wss://stream.binancefuture.com' : 'wss://fstream.binance.com'
}
// [pricePrecision, quantityPrecision]
const SymbolInfo = {
  BTCUSDT: [ 2, 3 ],
  ETHUSDT: [ 2, 3 ],
  BCHUSDT: [ 2, 3 ],
  XRPUSDT: [ 4, 1 ],
  EOSUSDT: [ 3, 1 ],
  LTCUSDT: [ 2, 3 ],
  TRXUSDT: [ 5, 0 ],
  ETCUSDT: [ 3, 2 ],
  LINKUSDT: [ 3, 2 ],
  XLMUSDT: [ 5, 0 ],
  ADAUSDT: [ 5, 0 ],
  XMRUSDT: [ 2, 3 ],
  DASHUSDT: [ 2, 3 ],
  ZECUSDT: [ 2, 3 ],
  XTZUSDT: [ 3, 1 ],
  ATOMUSDT: [ 3, 2 ]
}

function getSymbolInfo(symbol) {
  return {
    pricePrecision: SymbolInfo[symbol][0],
    quantityPrecision: SymbolInfo[symbol][1]
  }
}

function adjustOrderParam(symbol, price, usdt) {
  const symbolInfo = getSymbolInfo(symbol)
  price = parseFloat(price.toFixed(symbolInfo.pricePrecision))
  let quantity = usdt / price
  quantity = parseFloat(quantity.toFixed(symbolInfo.quantityPrecision))
  return {
    price,
    quantity
  }
}

exports.getSymbolInfo = getSymbolInfo
exports.adjustOrderParam = adjustOrderParam
