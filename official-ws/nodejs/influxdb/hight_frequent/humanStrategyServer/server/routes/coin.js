var express = require('express');
var router = express.Router();

// return user list
router.get('/', function(req, res, next) {
  res.send({
    result: true,
    items: [{
      user: 'yq',

    }]
  })
});

router.get('/user', function(req, res, next) {

})

router.post('/action', function(req, res, next) {
  
})

module.exports = router;
