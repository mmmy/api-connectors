const SignatureSDK = require('../../strategy/signatureSDK')
const { notifyPhone } = require('../../strategy/notifyPhone')

class OrderManager {
  constructor(options, orderBook, accountPosition, accountOrder) {
    this._options = {
      secondsForClose1: 90,                        // 第一个持仓最大时间,如果仓位有利,那么平仓
      secondsForClose2: 150,                       // 第二个, 平仓最后开始时间
      openLastingSeconds: 40,
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
      updatingClosePosition: false,                   // 正在更新close position
    }
    this._postionStartTime = 0
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
        const currentQty = this.getCurrentPositionQty()
        const longPosition = currentQty > 0
        if ((long && !longPosition) || (short && longPosition)) {
          console.log(`SIGNAL: current position is long:${longPosition} and signal is long:${long}, so start close position`)
          this._closePosition()
        }
      } else {
        this._openPosition(signal)
      }
    }
    this.tryStartCloseByTime()
  }

  _openPosition(signal) {
    const { long, short, bid0, ask0, timestamp } = signal
    if (long || short) {
      if (!this.state.openingSignal) {
        console.log('SIGNAL: open position\n')
        this.notify(`start open ${long}`)
        this._postionStartTime = new Date(timestamp)
        this.state.openingSignal = signal
        const price = long ? ask0 : bid0                 // 注意这里
        console.log('OPEN startGrabOrderLimit', long, price)
        const d0 = new Date()
        this.startGrabOrderLimit(long, price).then((res, times) => {
          console.log('OPEN grab order success, times:', times, 'and spent', (new Date() - d0) / 1000)
          // console.log(res)
          this.startAutoAdjustOrder()
        }).catch(() => {
          console.log('OPEN grab order error time out spent', (new Date() - d0) / 1000)
          this.state.openingSignal = null
        })
      }
    }
  }

  startGrabOrderLimit(long, price) {
    const maxTimes = 10
    const amount = this._options.amount
    let times = 0
    let lastOrderTime = new Date()
    const miniInterval = 1500             // 毫秒

    const tryFunc = (successCb, failureCb) => {
      if (times >= maxTimes) {
        failureCb()
        return
      }
      this.signatureSDK.orderLimit(amount, long ? 'Buy' : 'Sell', price).then(json => {
        if (json.ordStatus === 'New') {
          successCb(json, times)
        } else {
          times++
          // console.log('startGrabOrderLimit times --', times, 'ordStatus', json.ordStatus)
          const now = new Date()
          const delay = miniInterval - (now - lastOrderTime)
          // console.log('delay+++++++++++', delay)
          lastOrderTime = now
          setTimeout(() => {
            tryFunc(successCb, failureCb)
          }, Math.max(delay, 0))
        }
      }).catch(err => {
        console.error(err)
        times++
        const now = new Date()
        const delay = miniInterval - (now - lastOrderTime)
        lastOrderTime = now
        setTimeout(() => {
          tryFunc(successCb, failureCb)
        }, Math.max(delay, 0))
        lastOrderTime = now
      })
    }
    return new Promise((resove, reject) => tryFunc(resove, reject))
  }

  startAutoAdjustOrder() {
    console.log('OPEN start auto adjust order')
    this._adjustOrderInterval = setInterval(() => {
      const { timestamp, long, bid0, ask0 } = this.state.openingSignal
      const stopTime = +new Date(timestamp) + this._options.openLastingSeconds * 1000
      const accountOrders = this.getAccountLimitOrders(long)
      const order1 = accountOrders[0]
      const currentQty = this.getCurrentPositionQty()

      if (new Date() >= stopTime) {
        // 超时了取消order
        if (order1) {
          this.signatureSDK.deleteOrder(order1.orderID).then(json => {
            console.log('OPEN auto adjust order time out: cancel order success')
            console.log('OPEN currentQty', currentQty, '\n')
            this.stopAutoAdjustOrder()
          }).catch(e => {
            console.log('OPEN auto adjust order time out: cancel order failed and retry after 5 seconds...')
          })
        } else {
          this.stopAutoAdjustOrder()
        }
      } else {
        if (order1) {
          const endPrice = long ? (ask0 + 1) : (bid0 - 1)        // 0.5的差异
          const { price } = order1
          if (long ? (price >= endPrice) : (price <= endPrice)) {
            return
          }
          const obPrice = long ? Math.min(endPrice, this._ob.getTopBidPrice2(0)) : Math.max(endPrice, this._ob.getTopAskPrice2(0))
          if (long ? (price < obPrice) : (price > obPrice)) {
            this.signatureSDK.updateOrder({
              orderID: order1.orderID,
              price: obPrice
            }).then(json => {
              console.log('OPEN: updateOrder success', price, '-->', obPrice)
            })
          }
        } else {
          if (currentQty === 0) {
            console.warn('warning: has no order ?\n')
          } else {
            console.log('OPEN: order filled success')
            console.log('OPEN: currentQty', currentQty, '\n')
          }
          this.stopAutoAdjustOrder()
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

  getReduceOnlyCloseOrders() {
    return this._accountOrder.getReduceOnlyOrders()
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
              console.log('STOP: currentQty is 0 and delete stop order success')
            }).catch(e => {
              this.state.orderingStop = false
              console.log('STOP: currentQty is 0 and delete stop order failed', e)
            })
            // 数量或者价格不对, 重新设置
          } else if (orderQty < Math.abs(currentQty) || stopPx !== targetStopPx) {
            this.signatureSDK.updateOrder({
              orderID: stopOrder1.orderID,
              stopPx: targetStopPx,
              orderQty: Math.abs(currentQty),
            }).then(json => {
              console.log('STOP: update stop order success')
              this.state.orderingStop = false
            }).catch(e => {
              console.log('STOP: update stop order failed\n', e)
              this.state.orderingStop = false
            })
          } else {
            this.state.orderingStop = false
          }
        } else {            // 新增一个stopOrder
          const qty = Math.max(Math.abs(currentQty), this._options.amount * 2) // 这个大一点没有关系
          this.signatureSDK.orderStop(qty, targetStopPx, longPosition ? 'Sell' : 'Buy').then(json => {
            console.log('STOP: add a stop order success at', targetStopPx, qty)
            this.state.orderingStop = false
          }).catch(e => {
            console.log('STOP: add a stop order error at', targetStopPx, qty, e)
            this.state.orderingStop = false
          })
        }
      }
    }
  }
  // 
  tryStartCloseByTime() {
    const { secondsForClose1, secondsForClose2 } = this._options
    if (this.hasPosition() && this._postionStartTime > 0 && !this.isClosing()) {
      const now = new Date()
      const timePassed = now - this._postionStartTime
      if (secondsForClose1 && (timePassed > secondsForClose1 * 1000)) {
        const bid0 = this._ob.getTopBidPrice2(0)
        const ask0 = this._ob.getTopAskPrice2(0)
        const longPosition = this.getCurrentPositionQty() > 0
        if (ask0 - bid0 === 0.5) {
          const costPrice = this.getCurrentCostPrice()
          const winP = 3  //$3
          const isWin = longPosition ? (bid0 - costPrice >= winP) : (costPrice - ask0 >= winP)
          if (isWin) {
            console.log(`time has pass ${secondsForClose1}s position:${longPosition} costPrice:${costPrice} and price now is ${longPosition ? bid0 : ask0} is win, so close position`)
            this._closePosition()
          }
        }
      }
      // 无条件开始平仓
      if (secondsForClose2 && (timePassed > secondsForClose2 * 1000)) {
        console.log(`时间已过${secondsForClose2}s 开始无条件开始平仓`)
        this._closePosition()
      }
    }
  }

  _closePosition() {
    if (this._closePositionInterval) {
      return
    }
    this._closePositionInterval = setInterval(() => {
      if (!this.hasPosition()) {
        console.log('CLOSE: position has closed\n')
        this._stopClosePosition()
        return
      }
      this.updateClosePosition()
    }, 3000)
  }

  _stopClosePosition() {
    clearInterval(this._closePositionInterval)
    this._closePositionInterval = null
  }

  isClosing() {
    return !!this._closePositionInterval
  }

  updateClosePosition() {
    const stopOrder = this.getReduceOnlyCloseOrders()[0]
    const currentQty = this.getCurrentPositionQty()

    if (this.state.updatingClosePosition) {
      return
    }
    // 注意里面的每一个逻辑里面都要updatingClosePosition = false, 否则可能导致整个逻辑只能执行一次
    if (currentQty !== 0) {
      this.state.updatingClosePosition = true               // 防止重复请求
      const longPosition = currentQty > 0
      const targetPrice = longPosition ? (this._ob.getTopBidPrice2(0) + 0.5) : (this._ob.getTopAskPrice2(0) - 0.5)
      const targetSide = longPosition ? 'Sell' : 'Buy'
      const targetAmount = Math.max(Math.abs(currentQty), this._options.amount)
      if (!stopOrder) {
        const costPrice = this.getCurrentCostPrice()
        console.log(`CLOSE:try request a reduce only order, longPosition:${longPosition}, ${costPrice} ===> ${targetPrice}, profit:${longPosition ? (targetPrice - costPrice) : (costPrice - targetPrice)}`)
        this.notify(`${longPosition} ${costPrice} ==> ${targetPrice} profit:${longPosition ? (targetPrice - costPrice) : (costPrice - targetPrice)}`)
        this.signatureSDK.orderReduceOnlyLimit(
          targetAmount,
          targetSide,
          targetPrice
        ).then(json => {
          console.log('CLOSE: create a reduce only close order success')
          this.state.updatingClosePosition = false
        }).catch(e => {
          console.log('CLOSE: create a reduce only close order failed', e)
          this.state.updatingClosePosition = false
        })
      } else {
        const { price, side, orderQty, orderID } = stopOrder
        if (side !== targetSide) {
          console.log('CLOSE: stop order is wrong side should delete', side)
          this.signatureSDK.deleteOrder(orderID).then(json => {
            this.state.updatingClosePosition = false
            console.log('CLOSE: delete success')
          }).catch(e => {
            this.state.updatingClosePosition = false
            console.log('CLOSE: delete failed', e)
          })
        } else if (orderQty < targetAmount || price !== targetPrice) {
          this.signatureSDK.updateOrder({
            orderID,
            price: targetPrice,
            orderQty: targetAmount,
          }).then(json => {
            console.log('CLOSE: (OK) update stop order to', targetPrice, targetAmount)
            this.state.updatingClosePosition = false
          }).catch(e => {
            this.state.updatingClosePosition = false
            console.log('CLOSE: (ERROR) update stop order to', targetPrice, targetAmount, e)
          })
        } else {
          this.state.updatingClosePosition = false
        }
      }
    }
  }

  notify(msg) {
    if (this._options.notify) {
      notifyPhone(msg)
    }
  }
}

module.exports = OrderManager
