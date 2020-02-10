let data = null
let interval = null
const sdkCommon = require('./sdk/common')

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
  price = Math.round(price / symbolInfo.priceStepSize) * symbolInfo.priceStepSize
  let quantity = usdt / price
  // 将数量调整为基准的整数倍
  const quantityStep = isMarket ? symbolInfo.marketQuantityStepSize : symbolInfo.quantityStepSize
  quantity = Math.round(quantity / quantityStep) * quantityStep
  return {
    price,
    quantity
  }
}

function transformPrice(symbol, price) {
  const symbolInfo = getSymbolConfig(symbol)
  price = Math.round(price / symbolInfo.priceStepSize) * symbolInfo.priceStepSize
  return price
}

exports.getSymbolPriceStepSize = getSymbolPriceStepSize
exports.getSymbolQuantityStepSize = getSymbolQuantityStepSize
exports.getSymbolMarketQuantityStepSize = getSymbolMarketQuantityStepSize
exports.getSymbolConfig = getSymbolConfig
exports.getExchangeInfo = () => data
exports.adjustOrderParam = adjustOrderParam
exports.transformPrice = transformPrice