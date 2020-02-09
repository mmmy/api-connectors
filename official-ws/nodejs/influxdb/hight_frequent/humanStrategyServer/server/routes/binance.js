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

module.exports = router
