const SignatureSDK = require('../../strategy/signatureSDK')

class OrderManager {
  constructor(options) {
    this._options = {
      ...options
    }
    this.signatureSDK = new SignatureSDK(this._options)
  }

  addAutoCancelOrder(amount, long, price) {
    this.signatureSDK.orderLimit(amount, long ? 'Buy' : 'Sell', price).then(json => {
      this.cancelOrderLimit(json, 30)
    }).catch(err => {
      console.log('OrderManager addAutoCancelOrder 失败', amount, long, price, err)
    })
  }

  cancelOrderLimit(res, seconds = 30) {
    var cancelTimes = 0
    var orderID = res.orderID
    var cancelFunc = () => {
      this.signatureSDK.deleteOrder(orderID).then(json => {
        // this.notify('取消了orderLimit,请看position')
      }).catch(err => {
        if (cancelTimes < 3) {
          cancelTimes++
          setTimeout(() => {
            cancelFunc()
          }, 10 * 1000)
        } else {
          console.log('cancelOrderLimit 失败', cancelTimes, err)
        }
      })
    }

    return setTimeout(() => {
      cancelFunc()
    }, seconds * 1000)
  }
}

module.exports = OrderManager
