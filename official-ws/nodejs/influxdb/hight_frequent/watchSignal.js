const notifyPhone = require('../../strategy/notifyPhone').notifyPhone

function orderAction(strategy, autoOrder) {
  const { symbol, side, amount, order_method, signal_name, signal_operator } = autoOrder
  const sdk = strategy._orderManager.getSignatureSDK()
  switch(order_method) {
    case 'stopMarket1h':
      strategy.orderStopOrderByLastCandle(symbol, '1h', amount, side).catch(e => {
        setTimeout(() => { strategy.orderStopOrderByLastCandle(symbol, '1h', amount, side) }, 10 * 1000)
      })
      notifyPhone(`oa:${symbol} ${side} ${amount} ${order_method}, ${signal_name} ${signal_operator}`)
      break
    case 'stopMarket5m':
      notifyPhone(`oa:${symbol} ${side} ${amount} ${order_method}, ${signal_name} ${signal_operator}`)
      strategy.orderStopOrderByLastCandle(symbol, '5m', amount, side).catch(e => {
        setTimeout(() => { strategy.orderStopOrderByLastCandle(symbol, '5m', amount, side) }, 10 * 1000)
      })
      break
    case 'market':
      notifyPhone(`oa:${symbol} ${side} ${amount} ${order_method}, ${signal_name} ${signal_operator}`)
      sdk.orderMarket(symbol, amount, side).catch(e => {
        setTimeout(() => { sdk.orderMarket(symbol, amount, side) }, 10 * 1000)
      })
      break
    default:
      notifyPhone(`不支持的oa:${symbol} ${side} ${amount} ${order_method}, ${signal_name} ${signal_operator}`)
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
    const now = new Date()
    const { last_exec_time, min_interval } = autoOrder
    // 小于最小时间间隔不执行 （小时）
    if (last_exec_time && (now - new Date(last_exec_time) < min_interval * 3600 * 1000 )) {
      return
    }
    //执行
    autoOrder.last_exec_time = now
    autoOrder.remain_times = autoOrder.remain_times - 1
    orderAction(strategy, autoOrder)
  })
}

module.exports = watchSignal