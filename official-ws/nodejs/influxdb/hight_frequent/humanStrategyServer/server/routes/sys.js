var express = require('express');
var router = express.Router();

router.post('/reboot', function (req, res, next) {
  const { pwd } = req.body
  // todo: 校验密码
  res.send({
    result: true,
  })
  console.log('重启程序')
  process.exit(0)
})

module.exports = router