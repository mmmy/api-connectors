var express = require('express');
var router = express.Router();
var dataManager = require('../strategy')

/* GET home page. */
router.get('/', function (req, res, next) {
  const options = dataManager.getCheckOptions()
  res.send({
    result: true,
    data: options
  })
})

router.post('/start_check_interval', function(req, res) {
  dataManager.startCheckInterval()
  res.send({
    result: true
  })
})

router.post('/stop_check_interval', function(req, res) {
  dataManager.stopCheckInterval()
  res.send({
    result: true
  })
})

router.post('/update_check_options', function(req, res) {
  const { path, value } = req.body
  dataManager.setCheckOption(path, value)
  res.send({
    result: true,
    data: dataManager.getCheckOptions()
  })
})

module.exports = router;
