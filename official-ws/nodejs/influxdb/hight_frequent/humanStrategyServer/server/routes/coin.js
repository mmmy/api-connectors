var express = require('express');
var router = express.Router();
const manager = require('../strategy')

// return user list
router.get('/', function (req, res, next) {
  const { user } = req.query
  res.send({
    result: true,
    items: manager.getUserData(user)
  })
});

router.get('/user', function (req, res, next) {
  const { user } = req.query
  if (!user) {
    res.send({
      result: false,
      info: 'user is required'
    })
    return
  }
  res.send({
    result: true,
    data: '此接口目前无用'
  })
})

router.post('/order_limit', function (req, res, next) {
  const { user, symbol, qty, side, price, auto_price } = req.body
  if (!symbol || !qty || !side) {
    res.send({
      result: false,
      info: '缺少symbol qty, side 参数',
    })
    return
  } else if (!price && !auto_price) {
    res.send({
      result: false,
      info: 'price 或者 auto_price（bool）至少需要一个',
    })
    return
  }
  manager.orderLimit(user, symbol, qty, side, price, auto_price).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e,
    })
  })
})
// 只减仓
router.post('/order_reduce_only_limit', function (req, res, next) {
  const { user, symbol, qty, side, price } = req.body
  if (!symbol || !qty || !side || !price) {
    res.send({
      result: false,
      info: '缺少symbol qty, side, price 参数',
    })
    return
  }
  manager.orderReduceOnlyLimit(user, symbol, qty, side, price).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e,
    })
  })
})

router.post('/order_market', function (req, res, next) {
  const { user, symbol, qty, side } = req.body
  if (!symbol || !qty || !side) {
    res.send({
      result: false,
      info: '缺少symbol qty, side 参数'
    })
    return
  }
  manager.orderMarket(user, symbol, qty, side).then(json => {
    res.send({
      result: true,
      data: json,
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/delete_order_all', function (req, res, next) {
  const { user } = req.body
  manager.deleteOrderAll(user).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/delete_order', function (req, res, next) {
  const { user, order_id } = req.body
  if (!order_id) {
    res.send({
      result: false,
      info: '缺少参数order_id'
    })
    return
  }
  manager.deleteOrder(user, order_id).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/close_position', function (req, res, next) {
  const { user, symbol } = req.body
  if (!symbol) {
    res.send({
      result: false,
      info: '缺少参数symbol'
    })
    return
  }
  manager.closePositionMarket(user, symbol).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})
/**
 * params
 * {
 *  orderID is required
 * }
 */
router.post('/update_order', function (req, res, next) {
  const { user, params } = req.body
  manager.updateOrder(user, params).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})
// TODO: 此接口暂时有问题
router.get('/xbtusd_depth', function (req, res, next) {
  const { level } = req.query
  manager.getBidAsk(level).then(list => {
    res.send({
      result: true,
      data: list,
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e,
    })
  })
})

router.get('/all_quotes', function (req, res, next) {
  manager.getAllLatestQuote().then(list => {
    res.send({
      result: true,
      data: list
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.get('/all_instruments', function (req, res, next) {
  manager.getAllInstrument().then(list => {
    res.send({
      result: true,
      data: list
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/order_stop', function (req, res, next) {
  const { user, symbol, qty, side, stopPx, offset, stop_close } = req.body
  if (!symbol || !qty && !side) {
    res.send({
      result: false,
      info: '缺少symbol, qty, side参数'
    })
    return
  }
  if (!stopPx && !offset) {
    res.send({
      result: false,
      info: 'stopPx adn offset, at last one'
    })
    return
  }
  manager.orderStop(user, symbol, qty, stopPx, side, offset, stop_close).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/order_stop_open_by_lastcandle', function (req, res, next) {
  const { user, period, symbol, qty, side } = req.body
  if (!symbol || !qty || !side || !period) {
    res.send({
      result: false,
      info: '缺少symbol, qty, side, period参数'
    })
    return
  }
  manager.orderStopOrderByLastCandle(user, symbol, period, qty, side).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/order_market_if_touched', function (req, res, next) {
  const { user, symbol, qty, side, stopPx, stop_close } = req.body
  if (!symbol || !qty && !side) {
    res.send({
      result: false,
      info: '缺少symbol, qty, side参数'
    })
    return
  }
  if (!stopPx && !offset) {
    res.send({
      result: false,
      info: 'stopPx adn offset, at last one'
    })
    return
  }
  manager.orderMarketIfTouched(user, symbol, qty, stopPx, side, stop_close).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/change_leverage', function (req, res) {
  const { user, symbol, leverage } = req.body
  if (!user || !symbol || !leverage) {
    res.send({
      result: false,
      info: '缺少symbol, user, leverage参数'
    })
    return
  }
  manager.changeLeverage(user, symbol, leverage).then(json => {
    res.send({
      result: true,
      data: json
    }).catch(e => {
      res.send({
        result: false,
        info: e
      })
    })
  })
})

router.post('/change_options', function (req, res) {
  const { user, options } = req.body
  if (!user) {
    res.send({
      result: false,
      info: '缺少user参数'
    })
    return
  }
  manager.updateOptions(user, options).then(json => {
    res.send({
      result: true,
      data: json
    }).catch(e => {
      res.send({
        result: false,
        info: e
      })
    })
  })
})

router.post('/change_option', function (req, res) {
  const { user, path, value } = req.body
  if (!user) {
    res.send({
      result: false,
      info: '缺少user参数'
    })
    return
  }
  manager.updateOption(user, path, value).then(json => {
    res.send({
      result: true,
      data: json
    }).catch(e => {
      res.send({
        result: false,
        info: e
      })
    })
  })
})

router.get('/auto_order_signal_list', function (req, res) {
  const { user } = req.query
  if (!user) {
    res.send({
      result: false,
      info: '缺少user参数'
    })
    return
  }
  manager.getAutoOrderSignalList(user).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/add_auto_order_signal', function (req, res) {
  const { user, auto_order } = req.body
  if (!user) {
    res.send({
      result: false,
      info: '缺少user参数'
    })
    return
  }
  manager.addAutoOrderSignal(user, auto_order).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/order_limit_with_stop', function(req, res, next) {
  const { user } = req.body
  const valideKeys = ['user', 'symbol', 'side', 'amount', 'price', 'stopPx', 'openMethod']
  if (valideKeys.some(key => !req.body[key])) {
    req.send({
      result: false,
      info: `${valideKeys} some missed value`
    })
    return
  }
  manager.orderLimitWithStop(user, req.body).then(() => {
    res.send({
      result: true,
      data: null
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/order_scalping', function(req, res, next) {
  const { user } = req.body
  const valideKeys = ['user', 'symbol', 'side', 'profitRate', 'openPrice', 'autoOffset', 'openMethod', 'stopDistance', 'leverage', 'order']
  if (valideKeys.some(key => req.body[key] === undefined)) {
    req.send({
      result: false,
      info: `${valideKeys} some missed value`
    })
    return
  }
  manager.orderScalping(user, req.body).then((result) => {
    res.send({
      result: true,
      data: result
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/update_auto_order_signal', function (req, res) {
  const { user, index, auto_order } = req.body
  if (!user || index === undefined) {
    res.send({
      result: false,
      info: '缺少user, index参数'
    })
    return
  }
  manager.updateAutoOrderSignal(user, index, auto_order).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/set_stop_at_const_pirce', function (req, res) {
  const { user, symbol } = req.body
  if (!user || symbol === undefined) {
    res.send({
      result: false,
      info: '缺少user, symbol参数'
    })
    return
  }
  manager.setStopAtCostPrice(user, symbol).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.post('/delete_auto_order_signal', function (req, res) {
  const { user, index } = req.body
  if (!user || index === undefined) {
    res.send({
      result: false,
      info: '缺少user, index参数'
    })
    return
  }
  manager.deleteAutoOrderSignal(user, index).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.get('/all_indicator_values', function (req, res, next) {
  manager.getAllIndicatorValues().then(list => {
    res.send({
      result: true,
      data: list
    })
  }).catch(e => {
    res.send({
      result: false,
      info: e
    })
  })
})

router.get('/candle_data', function(req, res, next) {
  const { symbol, period, offset } = req.query
  manager.getCandleData(symbol, period, offset).then(data => {
    res.send({
      result: true,
      data,
    })
  }).catch(() => {
    res.send({
      result: false,
      info: '未找到'
    })
  })
})

module.exports = router
