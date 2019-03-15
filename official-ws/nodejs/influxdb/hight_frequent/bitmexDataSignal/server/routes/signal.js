var express = require('express');
var router = express.Router();
var strategy = require('../strategy')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send({
    result: true,
    data: 'test'
  })
});

module.exports = router;
