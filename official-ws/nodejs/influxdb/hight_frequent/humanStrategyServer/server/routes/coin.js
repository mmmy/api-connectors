var express = require('express');
var router = express.Router();
const manager = require('../strategy')

// return user list
router.get('/', function (req, res, next) {
  res.send({
    result: true,
    items: manager.getAllUsersAccount()
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
  } else if (!price && !auto_price) {
    res.send({
      result: false,
      info: 'price 或者 auto_price（bool）至少需要一个',
    })
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

router.post('/order_stop', function (req, res, next) {
  const { user, symbol, qty, side, stopPx, offset } = req.body
  if (!symbol || !qty && !side) {
    res.send({
      result: false,
      info: '缺少symbol, qty, side参数'
    })
  }
  if (!stopPx && !offset) {
    res.send({
      result: false,
      info: 'stopPx adn offset, at last one'
    })
  }
  manager.orderStop(user, symbol, qty, stopPx, side, offset).then(json => {
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

module.exports = router
