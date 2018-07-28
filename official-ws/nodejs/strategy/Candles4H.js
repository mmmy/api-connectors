
const CandlesMerged = require('./CandlesMerged')

class Candles4H extends CandlesMerged {
  _mergeSize = 4
  _mergeValidTimeStart(timestamp) {
    var date = new Date(timestamp)
    // 为4小时的整数倍
    return date.getHours() % 4 === 0
  }
}

exports = Candles4H
