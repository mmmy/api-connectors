const SignatureSDK = require('../../strategy/signatureSDK')

class OrderManager {
  constructor(options, orderBook) {
    this._options = {
      ...options
    }
    this._ob = orderBook
    this.signatureSDK = new SignatureSDK(this._options)
  }

  addAutoCancelOrder(amount, long, price, cancelSec) {
    return new Promise((resove, reject) => {
      this.signatureSDK.orderLimit(amount, long ? 'Buy' : 'Sell', price).then(json => {
        resove(null, json)
        this.cancelOrderLimit(cancelSec || 300)
      }).catch(err => {
        reject(err)
      })
    })
  }

  cancelOrderLimit(res, seconds = 60) {
    var cancelTimes = 0
    var orderID = res.orderID
    var cancelFunc = () => {
      this.signatureSDK.deleteOrder(orderID).then(json => {
        // this.notify('取消了orderLimit,请看position')
      }).catch(err => {
        if (typeof err === 'string' && err.indexOf('Not Found') > -1) {
          cancelTimes = 2
          console.log('cancelOrderLimit 不存在', err)
        } else {
          if (cancelTimes < 2) {
            cancelTimes++
            setTimeout(() => {
              cancelFunc()
            }, 10 * 1000)
          } else {
            console.log('cancelOrderLimit 失败', cancelTimes, err)
          }
        }
      })
    }

    return setTimeout(() => {
      cancelFunc()
    }, seconds * 1000)
  }
  // 市价平仓
  closePositionMarket() {
    return this.signatureSDK.closePositionMarket()
  }
  // 取消所有挂单
  deleteOrderAll() {
    return this.signatureSDK.deleteOrderAll()
  }
}

module.exports = OrderManager
