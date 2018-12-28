const SignatureSDK = require('../../strategy/signatureSDK')

class OrderManager {
  constructor(options, orderBook, accountPosition, accountOrder) {
    this._options = {
      secondsForClose: 130,
      openLastingSeconds: 30,
      ...options
    }

    this._ob = orderBook
    this._accountPosition = accountPosition
    this._accountOrder = accountOrder

    this.signatureSDK = new SignatureSDK(this._options)
    this.state = {
      openingSignal: null,
      closing: false,
      orderingStop: false,
    }
    this._lastBuyOpenTime = null
    this._lastSellOpenTime = null
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

  listenOrderBookSignal(signal) {
    const { long, short } = signal
    if (long || short) {
      if (this.hasPosition()) {

      } else {
        this._openPosition(signal)
      }
    }
  }

  _openPosition(signal) {
    const { long, short, bid0, ask0 } = signal
    if (long || short) {
      if (!this.state.openingSignal) {
        this.state.openingSignal = signal
        const price = long ? ask0 : bid0                 // 注意这里
        console.log('startGrabOrderLimit', long, price)
        this.startGrabOrderLimit(long, price).then((res, times) => {
          console.log('grab order success, times:', times)
          console.log(res)
          console.log('start auto adjust order')
          this.startAutoAdjustOrder()
        }).catch(() => {
          console.log('grab order error time out')
          this.state.openingSignal = null
        })
      }
    }
  }

  startGrabOrderLimit(long, price) {
    const maxTimes = 10
    const amount = this._options.amount
    let times = 1
    const tryFunc = (successCb, failureCb) => {
      if (times >= maxTimes) {
        failureCb()
      }
      this.signatureSDK.orderLimit(amount, long ? 'Buy' : 'Sell', price).then(json => {
        if (json.ordStatus === 'New') {
          successCb(json, times)
        } else {
          times++
          setTimeout(() => {
            tryFunc(successCb, failureCb)
          }, 0)
        }
      }).catch(err => {
        console.error(err)
        times++
        setTimeout(() => {
          tryFunc(successCb, failureCb)
        }, 0)
      })
    }
    return new Promise((resove, reject) => tryFunc(resove, reject))
  }

  startAutoAdjustOrder() {
    this._adjustOrderInterval = setInterval(() => {
      const { timestamp, long, bid0, ask0 } = this.state.openingSignal
      const stopTime = +new Date(timestamp) + this._options.openLastingSeconds * 1000
      const accountOrders = this.getAccountLimitOrders(long)
      const order1 = accountOrders[0]

      if (new Date() >= stopTime) {
        // 超时了取消order
        if (order1) {
          this.signatureSDK.deleteOrder(order1.orderID)
          console.log('auto adjust order time out: cancel order')
        }
        this.stopAutoAdjustOrder()
      } else {
        if (order1) {
          const endPrice = long ? (ask0 + 0.5) : (bid0 - 0.5)        // 0.5的差异
          const { price } = order1
          if (long ? (price >= endPrice) : (price <= endPrice)) {
            return
          }
          const obPrice = long ? this._ob.getTopBidPrice2(0) : this._ob.getTopAskPrice2(0)
          if (long ? (price < obPrice) : (price > obPrice)) {
            this.signatureSDK.updateOrder({
              orderID: order1.orderID,
              price: obPrice
            }).then(json => {
              console.log('updateOrder success', price, '-->', obPrice)
            })
          }
        } else {
          console.warn('warning: has no order ?')
          stopAutoAdjustOrder()
        }
      }
    }, 5 * 1000)
  }

  stopAutoAdjustOrder() {
    clearInterval(this._adjustOrderInterval)
    this._adjustOrderInterval = null
    this.state.openingSignal = null
  }

  stopOpening() {
    this.state.openingSignal = null
  }

  startClosePosition() {

  }

  hasPosition() {
    return this._accountPosition.hasPosition()
  }

  getCurrentPositionQty() {
    return this._accountPosition.getCurrentQty()
  }
  // 注意这里不一定是 0.5的整数倍
  getCurrentCostPrice() {
    return this._accountPosition.getCostPrice()
  }

  getAccountLimitOrders(long) {
    return this._accountOrder.getLimitOrders(long)
  }

  hasAccountOrder() {
    return this._accountOrder.hasOrder()
  }

  orderStopIfNeed(deltaPrice = 8) {
    if (!this.state.orderingStop) {
      this.state.orderingStop = true
      const stopOrders = this._accountOrder.getStopOrders()
      const stopOrder1 = stopOrders[0]
      const currentQty = this.getCurrentPositionQty()
      const costPrice = this.getCurrentCostPrice()

      // 暂时不删除不必要的stop order, 因为order stop的存在没有关系
      if (currentQty === 0) {
        this.state.orderingStop = false
        // if (stopOrder1) {
        //   this.signatureSDK.deleteOrder(stopOrder1.orderID).then(json => {
        //     this.state.orderingStop = false
        //     console.log('currentQty is 0 and delete stop order success')
        //   }).catch(e => {
        //     this.state.orderingStop = false
        //     console.log('currentQty is 0 and delete stop order failed', e)
        //   })
        // } else {  // 重置state
        //   this.state.orderingStop = false
        // }
      } else if (currentQty !== 0) {
        const longPosition = currentQty > 0
        let targetStopPx = costPrice + (longPosition ? (-deltaPrice) : deltaPrice)
        targetStopPx = Math.round(targetStopPx * 2) / 2  // 0.5的整数倍

        if (stopOrder1) {
          const { orderQty, stopPx } = stopOrder1
          // 方向有误 应该删除
          if ((currentQty > 0 && stopOrder1.side === 'Buy') || (currentQty < 0 && stopOrder1.side === 'Sell')) {
            this.signatureSDK.deleteOrder(stopOrder1.orderID).then(json => {
              this.state.orderingStop = false
              console.log('currentQty is 0 and delete stop order success')
            }).catch(e => {
              this.state.orderingStop = false
              console.log('currentQty is 0 and delete stop order failed', e)
            })
            // 数量或者价格不对, 重新设置
          } else if (orderQty < Math.abs(currentQty) || stopPx !== targetStopPx) {
            this.signatureSDK.updateOrder({
              orderID: stopOrder1.orderID,
              stopPx: targetStopPx,
              orderQty: Math.abs(currentQty),
            }).then(json => {
              console.log('update stop order success')
              this.state.orderingStop = false
            }).catch(e => {
              console.log('update stop order failed', e)
              this.state.orderingStop = false
            })
          } else {
            this.state.orderingStop = false
          }
        } else {            // 新增一个stopOrder
          const qty = Math.max(Math.abs(currentQty), this._options.amount * 2) // 这个大一点没有关系
          console.log(qty)
          this.signatureSDK.orderStop(qty, targetStopPx, longPosition ? 'Sell' : 'Buy').then(json => {
            console.log('add a stop order success at', targetStopPx)
            this.state.orderingStop = false
          }).catch(e => {
            console.log('add a stop order error at', targetStopPx, e)
            this.state.orderingStop = false
          })
        }
      }
    }
  }
}

module.exports = OrderManager
