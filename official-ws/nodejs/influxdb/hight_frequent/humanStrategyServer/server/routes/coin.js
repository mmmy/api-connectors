var express = require('express');
var router = express.Router();
const manager = require('../strategy')

// return user list
router.get('/', function(req, res, next) {
  res.send({
    result: true,
    items: manager.getAllUsersAccount()
  })
});

router.get('/user', function(req, res, next) {
  const { user } = req.query
  if (!user) {
    res.status(500).send({
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

router.post('/order_market', function(req, res, next) {
  const { user, qty, side } = req.body
  if (!qty || !side) {
    res.status(500).send({
      result: true,
      info: '缺少 qty, side 参数'
    })
    return
  }
  manager.orderMarket(user, qty, side).then(json => {
    res.send({
      result: true,
      data: json,
    })
  }).catch(e => {
    res.status(500).send({
      result: false,
      info: e
    })
  })
})

router.post('/delete_order_all', function(req, res, next) {
  const { user } = req.body
  manager.deleteOrderAll(user).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.status(500).send({
      result: false,
      info: e
    })
  })
})

router.post('/delete_order_all', function(req, res, next) {
  const { user, order_id } = req.body
  if (!order_id) {
    res.status(500).send({
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
    res.status(500).send({
      result: false,
      info: e
    })
  })
})

router.post('/close_position', function(req, res, next) {
  const { user } = req.body
  manager.closePositionMarket(user).then(json => {
    res.send({
      result: true,
      data: json
    })
  }).catch(e => {
    res.status(500).send({
      result: false,
      info: e
    })
  })
})

module.exports = router