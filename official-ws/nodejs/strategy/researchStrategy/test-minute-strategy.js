
// var minuteStrategy = require('./minute/MinuteStrategy')

// var ms = new minuteStrategy()

// console.log(ms)

const BitmexManager = require('./BitmexManager')

var bm = new BitmexManager()

bm.listenCandle({ binSize: '5m' }, function(data) {}, function(data) {
  console.log(data)
})
