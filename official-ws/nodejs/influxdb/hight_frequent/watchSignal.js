const notifyPhone = require('../../strategy/notifyPhone').notifyPhone

function orderAction(strategy, autoOrder) {
  const { symbol, side, amount, order_method } = autoOrder
  switch(order_method) {
    case 'stopMarket1h':
      // strategy.orderStopOrderByLastCandle(symbol, '1h', amount, side)
      notifyPhone(`oa:${symbol} ${side} ${amount} ${order_method}`)
      break
    case 'stopMarket5m':
      notifyPhone(`oa:${symbol} ${side} ${amount} ${order_method}`)
      // strategy.orderStopOrderByLastCandle(symbol, '5m', amount, side)
      break
    case 'market':
      notifyPhone(`oa:${symbol} ${side} ${amount} ${order_method}`)
      // strategy._orderManager.getSignatureSDK().orderMarket(symbol, amount, side)
      break
    default:
      notifyPhone(`不支持的oa:${symbol} ${side} ${amount} ${order_method}`)
      console.log('不支持的order_method: ', order_method)
      break
  }
}

function watchSignal(strategy, symbol, signal_name, signal_operator, signal_value) {
  const autoOrderSignals = strategy.getAutoOrderSignalList()
  const signalNameAutoOrdes = autoOrderSignals.filter(a => 
    a.symbol === symbol
    && a.signal_name === signal_name
    && a.signal_operator === signal_operator
    && a.remain_times > 0
  )
  
  if (signalNameAutoOrdes.length === 0) {
    return
  }

  signalNameAutoOrdes.forEach(autoOrder => {
    autoOrder.remain_times = autoOrder.remain_times - 1
    orderAction(strategy, autoOrder)
  })
}

module.exports = watchSignal