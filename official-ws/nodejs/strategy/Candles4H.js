
const CandlesMerged = require('./CandlesMerged')

class Candles4H extends CandlesMerged {
  constructor(options) {
    super(options)
    this._mergeSize = 4
  }
  _mergeValidTimeStart(timestamp) {
    // 注意交易所的实际时间是有一个小时偏差
    var date = new Date(new Date(timestamp) - 3600 * 1000)
    // 为4小时的整数倍
    return date.getHours() % 4 === 0
  }
}

module.exports = Candles4H
