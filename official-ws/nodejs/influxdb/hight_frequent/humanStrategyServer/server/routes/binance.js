var express = require('express')
var router = express.Router()
const manager = require('../binance_strategy')

// return user list
router.get('/', function (req, res, next) {
  const { user } = req.query
  res.send({
    result: true,
    data: manager.getUserData(user)
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

router.post('/delete_order', function (req, res, next) {
  const { user, order_id, symbol } = req.body
  if (!order_id || !symbol) {
    res.send({
      result: false,
      info: '缺少参数order_id， symbol'
    })
    return
  }
  manager.deleteOrder(user, symbol, order_id).then(json => {
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

module.exports = router
