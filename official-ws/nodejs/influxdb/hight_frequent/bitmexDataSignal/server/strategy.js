
// const { apiKey, apiSecret } = require('../../../../strategy/test-secret.json')
// var daishu = require('../../../../strategy/daishu-secret.json')
// var qq = require('../../../../strategy/secret.json')
const isProduction = process.env.NODE_ENV === 'production'
const { sendMessageToGroup } = require('../../../../telegram/createMyBot')

const createStratey = require('../createStratey')
const dataManager = createStratey({
  user: 'yq',
  test: false,
  testnet: false,
  // testnet: isProduction ? false : true,
  // apiKey: isProduction ? qq.apiKey : apiKey,
  // apiSecret: isProduction ? qq.apiSecret : apiSecret,
  database: false,
})

dataManager._onOrderBookSignal = (symbol, signals) => {
  const lastSignal = signals[signals.length - 1]
  const { buySide, sellSide } = lastSignal
  if (buySide || sellSide) {
    let msg = `${symbol} ${buySide ? "buySide" : ""} ${sellSide ? "sellSide" : ""}`
    sendMessageToGroup(msg)
  }
}

module.exports = dataManager
