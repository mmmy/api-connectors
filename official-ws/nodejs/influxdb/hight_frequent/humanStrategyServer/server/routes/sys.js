var express = require('express');
var router = express.Router();
const manager = require('../strategy')

router.post('/reboot', function (req, res, next) {
  const { pwd } = req.body
  // todo: 校验密码
  res.send({
    result: true,
  })
  console.log('重启程序')
  process.exit(0)
})

router.post('/wh', function (req, res) {
  // const { symbol, name, interval } = req.body
  manager.watchTvAlert(req.body)
  res.send({
    result: true
  })
})

module.exports = router