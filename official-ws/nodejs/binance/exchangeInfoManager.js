let data = null
let interval = null
const sdkCommon = require('./sdk/common')
const Decimal = require('decimal.js')

function fetchExchangeInfo(testnet) {
  // 暂时不优化次数
  sdkCommon.getExchangeInfo(testnet).then(jsonStr => {
    data = JSON.parse(jsonStr)
  })
}

exports.fetchExchangeInfo = fetchExchangeInfo

exports.startIntervalToGetInfo = function (testnet) {
  if (!interval) {
    interval = setInterval(() => {
      fetchExchangeInfo(testnet)
    }, 10 * 3600 * 1000)
  }
}

function getSymbolData(symbol) {
  if (!data) {
    return
  }
  return data.symbols.find(s => s.symbol === symbol)
}

function getAllSymbols() {
  if (!data) {
    return []
  }
  return data.symbols.map(s => s.symbol)
}

function getSymbolPricePrecision(symbol) {
  const info = getSymbolData(symbol)
  if (info) {
    return info.pricePrecision
  }
}

function getSymbolQuantityPrecision(symbol) {
  const info = getSymbolData(symbol)
  if (info) {
    return info.quantityPrecision
  }
}
// 最小价格的基数
function getSymbolPriceStepSize(symbol) {
  const info = getSymbolData(symbol)
  if (info) {
    return info.filters.find(f => f.filterType === 'PRICE_FILTER').tickSize
  }
}
// 限价最小数量的基数
function getSymbolQuantityStepSize(symbol) {
  const info = getSymbolData(symbol)
  if (info) {
    return info.filters.find(f => f.filterType === 'LOT_SIZE').stepSize
  }
}
// 市价最小数量的基数
function getSymbolMarketQuantityStepSize(symbol) {
  const info = getSymbolData(symbol)
  if (info) {
    return info.filters.find(f => f.filterType === 'MARKET_LOT_SIZE').stepSize
  }
}

function getSymbolConfig(symbol) {
  return {
    priceStepSize: getSymbolPriceStepSize(symbol),
    quantityStepSize: getSymbolQuantityStepSize(symbol),
    marketQuantityStepSize: getSymbolMarketQuantityStepSize(symbol),
  }
}

function adjustOrderParam(symbol, price, usdt, isMarket) {
  const symbolInfo = getSymbolConfig(symbol)
  // 将价格调整为基准的整数倍
  const step = new Decimal(symbolInfo.priceStepSize)
  // const priceR = 1 / symbolInfo.priceStepSize
  // price = Math.round(price * priceR) / priceR
  price = (new Decimal(price)).div(step).round().mul(step).toNumber()
  let quantity = usdt / price
  // 将数量调整为基准的整数倍
  const quantityStep = new Decimal(isMarket ? +symbolInfo.marketQuantityStepSize : +symbolInfo.quantityStepSize)
  // const quantityR = 1 / quantityStep
  // quantity = Math.round(quantity * quantityR) / quantityR
  quantity = (new Decimal(quantity)).div(quantityStep).round().mul(quantityStep).toNumber()
  return {
    price,
    quantity
  }
}

function transformPrice(symbol, price) {
  const symbolInfo = getSymbolConfig(symbol)
  const step = new Decimal(symbolInfo.priceStepSize)
  price = (new Decimal(price)).div(step).round().mul(step).toNumber()
  return price
}

exports.getSymbolPriceStepSize = getSymbolPriceStepSize
exports.getSymbolQuantityStepSize = getSymbolQuantityStepSize
exports.getSymbolMarketQuantityStepSize = getSymbolMarketQuantityStepSize
exports.getSymbolConfig = getSymbolConfig
exports.getExchangeInfo = () => data
exports.adjustOrderParam = adjustOrderParam
exports.transformPrice = transformPrice
exports.getAllSymbols = getAllSymbols