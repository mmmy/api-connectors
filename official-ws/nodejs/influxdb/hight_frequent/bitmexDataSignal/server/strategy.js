
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

const lastSend = {
  date: new Date(),
  msg: '',
}

dataManager._onOrderBookSignal = (symbol, signals) => {
  const lastSignal = signals[signals.length - 1]
  const { buySide, sellSide, bid0, ask0, rateBuySignal, rateSellSignal, sizeRate } = lastSignal
  if (buySide || sellSide || rateBuySignal || rateSellSignal) {
    let msg = `${symbol} 
                ${buySide ? bid0 : ask0} 
                ${buySide ? "S🔻" : ""} 
                ${sellSide ? "B✅" : ""} 
                ${rateBuySignal ? ("💹 " + sizeRate) : ""} 
                ${rateSellSignal ? ("🧨 " + sizeRate) : ""} 
              `
    let now = new Date()
    if (lastSend.msg === msg && (now - lastSend.date) < 10 * 1000) {
      return
    }
    sendMessageToGroup(msg)
    lastSend.date = now
    lastSend.msg = msg
  }
}

module.exports = dataManager
