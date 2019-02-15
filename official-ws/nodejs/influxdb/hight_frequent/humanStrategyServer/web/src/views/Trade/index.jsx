import React from 'react'
import axios from 'axios'

import './index.css'

function formatPosition(val, key, position) {
  switch (key) {
    case 'realisedPnl':
    case 'unrealisedPnl':
    case 'realisedGrossPnl':
      return (val / 1E8).toFixed(4)
    case 'unrealisedPnlPcnt':
      return (val * position.leverage * 100).toFixed(3) + '%'
    default:
      return val
  }
}

const positionKeyText = {
  'leverage': '倍',
  'currentQty': 'Qty',
  'avgCostPrice': 'Price',
  'realisedGrossPnl': 'rG Pnl',
  'realisedPnl': 'r Pnl',
  'unrealisedPnl': 'ur Pnl',
  'unrealisedPnlPcnt': 'ur Pnl%'
}

const supportSymbols = ['XBTUSD', 'ETHUSD', 'XRPH19']

export default class Trade extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      logs: [],
      users: [],
      list_pending: false,
      order_book: [],
    }
  }

  componentDidMount() {
    this.fetchUserList()
    this.fetchOrderbookDepth()
  }

  render() {
    const { logs, users, order_book } = this.state
    const obBuy = order_book[0]
    const obSell = order_book[1]
    return <div className="trade-container">
      <div>
        {
          users.map((user, i) => {
            const { options, positions, orders, form, pending } = user
            // 检查止损是否设置正常
            const orderStopValide = this.checkStop(i)
            const positionKeys = ['symbol', 'leverage', 'currentQty', 'avgCostPrice', 'unrealisedPnl', 'unrealisedPnlPcnt', 'realisedGrossPnl', 'realisedPnl']
            return <div className="user-row">
              <div>user: {user.options.user}</div>
              <div className="account clearfix">
                <table style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      {[<th></th>].concat(positionKeys.map(key => <th>{positionKeyText[key] || key}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {
                      positions.map(position => {
                        return <tr>
                          {
                            [
                              <td><button style={{ margin: "5px 2px" }} onClick={this.handleClosePosition.bind(this, i, position)}>Close</button></td>
                            ].concat(positionKeys.map(key => {
                              const val = position[key]
                              const format = formatPosition(val, key, position)
                              let cn = ''
                              if (['currentQty', 'realisedGrossPnl', 'realisedPnl', 'unrealisedPnl', 'unrealisedPnlPcnt'].indexOf(key) > -1) {
                                if (val > 0) {
                                  cn = 'green'
                                } else if (val < 0) {
                                  cn = 'red'
                                }
                              }
                              return <td className={cn}>{format}</td>
                            }))}
                        </tr>
                      })
                    }

                  </tbody>
                </table>
              </div>
              <hr />
              <div className="title">Orders</div>
              <div className="orders-container">
                <table>
                  <thead><tr>
                    <th></th>
                    <th>symbol</th>
                    <th>qty</th>
                    <th>price</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>剩余</th>
                    <th>时间</th>
                  </tr></thead>
                  <tbody>
                    {
                      orders.filter(o => o.ordType !== 'Stop').map((order, j) => {
                        const isBuy = order.side === 'Buy'
                        return <tr>
                          <td><button onClick={this.handleDelOrder.bind(this, i, order)}>Del</button></td>
                          <td>{order.symbol}</td>
                          <td style={{ cursor: 'pointer' }} title="点击修改" className={isBuy ? 'green' : 'red'} onClick={this.handleUpdateOrder.bind(this, i, order, 'orderQty')}>{order.orderQty * (isBuy ? 1 : -1)}</td>
                          <td style={{ cursor: 'pointer' }} title="点击修改" onClick={this.handleUpdateOrder.bind(this, i, order, 'price')}>{order.price}</td>
                          <td>{order.ordType}{order.execInst.indexOf('ReduceOnly') > -1 ? '只减仓' : ''}</td>
                          <td>{order.ordStatus}</td>
                          <td className={isBuy ? 'green' : 'red'}>{order.leavesQty * (isBuy ? 1 : -1)}</td>
                          <td>{new Date(order.timestamp).toLocaleString()}</td>
                        </tr>
                      })
                    }
                  </tbody>
                </table>
              </div>
              <div>OrderBook: ({obBuy && (obBuy.size / 1E3 + 'k')})<span className="green">{obBuy && obBuy.price}</span> : <sapn className="red">{obSell && obSell.price}</sapn>({obSell && (obSell.size / 1E3 + 'k')})</div>
              <div style={{ marginBottom: '10px' }}>
                <select value={form.order_symbol} onChange={this.handleSelectChangeFormData.bind(this, i, 'order_symbol')}>
                  {supportSymbols.map(s => <option value={s}>{s}</option>)}
                </select>
                <select value={form.order_side} onChange={this.handleSelectChangeFormData.bind(this, i, 'order_side')}>
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
                <input className={form.order_side === 'Buy' ? 'green' : 'red'} onChange={this.handleInputChangeFormData.bind(this, i, 'order_qty')} style={{ width: '80px' }} type="number" value={form.order_qty} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>P:</label><input value={form.order_price} style={{ width: '100px' }} type="number" onChange={this.handleInputChangeFormData.bind(this, i, 'order_price')} /><button onClick={this.handleOrderLimit.bind(this, i)} disabled={pending || !form.order_price}>Order Limit</button>
                <input type="checkbox" id="reduce-only-checkbox" checked={form.reduce_only} style={{ marginLeft: '10px' }} onChange={this.handleChangeCheckbox.bind(this, i, 'reduce_only')} /><label for="reduce-only-checkbox">reduce only</label>
              </div>
              <div>
                <button disabled={pending} onClick={this.handleOrderMarket.bind(this, i)}>Order Market</button>
              </div>
              <hr />
              <div className="title">Stop Orders
                {
                  !orderStopValide && <span className="red">!!止损设置有误</span>
                }
              </div>
              <div>
                <table>
                  <thead><tr>
                    <th></th>
                    <th>symbol</th>
                    <th>数量</th>
                    <th>触发P</th>
                    <th>止损P</th>
                    <th>状态</th>
                    <th>剩余</th>
                    <th>时间</th>
                  </tr></thead>
                  <tbody>
                    {
                      orders.filter(o => o.ordType === 'Stop').map(order => {
                        return <tr>
                          <td><button onClick={this.handleDelOrder.bind(this, i, order)}>Del</button></td>
                          <td>{order.symbol}</td>
                          <td style={{ cursor: 'pointer' }} title="点击修改" className={order.side == 'Buy' ? 'green' : 'red'} onClick={this.handleUpdateOrder.bind(this, i, order, 'orderQty')}>{order.orderQty}</td>
                          <td style={{ cursor: 'pointer' }} title="点击修改" onClick={this.handleUpdateOrder.bind(this, i, order, 'stopPx')}>{order.stopPx}</td>
                          <td>{order.price || '市价'}</td>
                          <td>{order.ordStatus}</td>
                          <td>{order.leavesQty}</td>
                          <td>{new Date(order.timestamp).toLocaleString()}</td>
                        </tr>
                      })
                    }
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <select value={form.stop_symbol} onChange={this.handleSelectChangeFormData.bind(this, i, 'stop_symbol')}>
                    {supportSymbols.map(s => <option value={s}>{s}</option>)}
                  </select>
                  <select value={form.stop_side} onChange={this.handleSelectChangeFormData.bind(this, i, 'stop_side')}>
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                  <input className={form.stop_side === 'Buy' ? 'green' : 'red'} onChange={this.handleInputChangeFormData.bind(this, i, 'stop_qty')} style={{ width: '80px' }} type="number" value={form.stop_qty} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>stopPx:</label><input value={form.stop_price} style={{ width: '100px' }} type="number" onChange={this.handleInputChangeFormData.bind(this, i, 'stop_price')} /><button onClick={this.handleOrderStop.bind(this, i)} disabled={pending || !form.stop_price}>Order Stop Market</button>
                </div>
              </div>
              <hr />
              <div className="actions">
                <div>

                </div>
                <div>
                  <button onClick={this.handleDeleteAll.bind(this, i)} disabled={pending}>Delete All Orders</button>
                </div>
                <div></div>
              </div>
              {
                pending && <div className="pending-container">fetching...</div>
              }
            </div>
          })
        }
      </div>
      <div className="logs">
        <h5>日志</h5>
        <ul>
          {
            logs.map(log => <li>{JSON.stringify(log)}</li>)
          }
        </ul>
      </div>
    </div>
  }

  fetchOrderbookDepth() {
    axios.get(`/api/coin/xbtusd_depth?level=1&t=${+new Date()}`).then(({ status, data }) => {
      if (status === 200 && data.result) {
        const order_book = data.data || []
        // const obBuy = order_book[0]
        this.setState({
          order_book,
        })
      } else {
        this.pushLog(data.info)
      }
    })
  }

  fetchUserList() {
    this.setState({
      list_pending: true
    })
    axios.get('/api/coin').then(({ data, status }) => {
      if (status === 200 && data.result) {
        this.setState({
          users: data.items.map(item => {
            item.form = {
              order_side: 'Buy', order_qty: 100, pending: false, order_price: null,
              stop_side: 'Sell', stop_qty: 1000, stop_price: null,
              reduce_only: false,
              order_symbol: 'XBTUSD',
              stop_symbol: 'XBTUSD',
            }
            return item
          }),
          list_pending: false,
        })
      } else {
        alert('服务器错误')
        this.state.logs.push(data)
        this.setState({
          list_pending: false
        })
      }
    }).catch(e => {
      alert('程序错误')
      this.state.logs.push(e)
      this.setState({
        list_pending: false
      })
    })
  }

  handleSelectChangeFormData(index, key, e) {
    this.state.users[index].form[key] = e.target.value
    this.setState({})
  }

  handleInputChangeFormData(index, key, e) {
    this.state.users[index].form[key] = e.target.value
    this.setState({})
  }

  handleChangeCheckbox(index, key, e) {
    this.state.users[index].form[key] = e.target.checked
    this.setState({})
  }

  handleOrderLimit(index) {
    var userData = this.state.users[index]
    const user = userData.options.user
    const { order_side, order_qty, order_price, reduce_only, order_symbol } = userData.form
    var info = `${user}\n ${order_symbol} ${order_side} ${order_qty} at ${order_price} ${reduce_only ? '只减仓' : ''}`
    if (window.confirm(info)) {
      userData.pending = true
      this.setState({})
      let path = '/api/coin/order_limit'
      if (reduce_only) {
        path = '/api/coin/order_reduce_only_limit'
      }
      axios.post(path, {
        user,
        symbol: order_symbol,
        qty: order_qty,
        side: order_side,
        price: order_price,
      }).then(({ status, data }) => {
        userData.pending = false
        if (status === 200 && data.result) {
          let isCaceled = false
          if (data.data && data.data.ordStatus === "Canceled") {
            this.pushLog(data.data.text)
            isCaceled = true
          }
          alert(`success! ${isCaceled ? 'but Canceled 详细请看日志' : ''}`)
          this.fetchUserList()
        } else {
          this.pushLog(data.info)
        }
      }).catch(e => {
        userData.pending = false
        this.pushLog(e)
      })
    }
  }

  handleOrderMarket(index) {
    var userData = this.state.users[index]
    const user = userData.options.user
    const { order_side, order_qty, order_symbol } = userData.form
    var info = `${user}\n ${order_symbol} ${order_side} ${order_qty} Market?`
    if (window.confirm(info)) {
      userData.pending = true
      this.setState({})
      axios.post('/api/coin/order_market', {
        user: user,
        symbol: order_symbol,
        qty: order_qty,
        side: order_side,
      }).then(({ status, data }) => {
        userData.pending = false
        if (status === 200 && data.result) {
          alert('success!')
          this.fetchUserList()
        } else {
          this.pushLog(data.info)
        }
      }).catch(e => {
        userData.pending = false
        this.pushLog(e)
      })
    }
  }
  // 市价止损
  handleOrderStop(index) {
    var userData = this.state.users[index]
    const user = userData.options.user
    const { stop_side, stop_qty, stop_price, stop_symbol } = userData.form
    var info = `${user} order stop market?\n ${stop_symbol} ${stop_side} ${stop_qty} at ${stop_price}?`
    if (window.confirm(info)) {
      userData.pending = true
      this.setState({})
      axios.post('api/coin/order_stop', { user, symbol: stop_symbol, qty: stop_qty, side: stop_side, stopPx: stop_price }).then(({ status, data }) => {
        userData.pending = false
        if (status === 200 && data.result) {
          alert('order stop success')
          this.fetchUserList()
        } else {
          this.pushLog(data.info)
        }
      }).catch(e => {
        userData.pending = false
        this.pushLog(e)
      })
    }
  }

  handleDelOrder(index, order) {
    var userData = this.state.users[index]
    const { user } = userData.options
    const info = `user: ${user}, Delete order:\n side: ${order.side} qty: ${order.orderQty} type: ${order.ordType}`
    if (window.confirm(info)) {
      userData.pending = true
      this.setState({})
      axios.post('api/coin/delete_order', { user, order_id: order.orderID }).then(({ status, data }) => {
        userData.pending = false
        if (status === 200 && data.result) {
          alert('success!')
          this.fetchUserList()
        } else {
          this.pushLog(data.info)
        }
      }).catch(e => {
        userData.pending = false
        this.pushLog(e)
      })
    }
  }

  handleDeleteAll(index) {
    var userData = this.state.users[index]
    const { user } = userData.options
    const info = `user: ${user}, Delete All Orders ?`
    if (window.confirm(info)) {
      userData.pending = true
      this.setState({})
      axios.post('api/coin/delete_order_all', { user }).then(({ status, data }) => {
        userData.pending = false
        if (status === 200 && data.result) {
          alert('delete all success')
          this.fetchUserList()
        } else {
          this.pushLog(data.info)
        }
      }).catch(e => {
        userData.pending = true
        this.pushLog(e)
      })
    }
  }

  handleClosePosition(index, position) {
    var userData = this.state.users[index]
    const { user } = userData.options
    const symbol = position.symbol
    const info = `user: ${user}, close position ${symbol} market?`
    if (window.confirm(info)) {
      userData.pending = true
      this.setState({})
      axios.post('api/coin/close_position', { user, symbol, }).then(({ status, data }) => {
        userData.pending = false
        if (status === 200 && data.result) {
          alert('close postion success')
          this.fetchUserList()
        } else {
          this.pushLog(data.info)
        }
      }).catch(e => {
        this.pushLog(e)
      })
    }
  }

  handleUpdateOrder(index, order, key) {
    var userData = this.state.users[index]
    const { user } = userData.options
    const oldValue = order[key]
    const newVal = window.prompt(`${user} update order: ${key}`, oldValue)
    if (newVal) {
      const newOrder = {
        orderID: order.orderID,
        [key]: newVal
      }
      userData.pending = true
      this.setState({})
      axios.post('api/coin/update_order', { user, params: newOrder }).then(({ status, data }) => {
        userData.pending = false
        if (status === 200 && data.result) {
          alert('修改成功')
          this.fetchUserList()
        } else {
          this.pushLog(data.info)
        }
      }).catch(e => {
        userData.pending = false
        this.pushLog(e)
      })
    }
  }

  pushLog(info) {
    this.state.logs.push(info)
    this.setState({})
  }

  checkStop(index) {
    var userData = this.state.users[index]
    return false
    if (this.hasPostion(index)) {
      const isbuyPosition = userData.position.currentQty > 0
      let totalQty = 0
      userData.orders.forEach(o => {
        const side = isbuyPosition ? 'Sell' : 'Buy'
        if (o.ordType === 'Stop' && o.side === side) {
          totalQty += o.orderQty
        }
      })
      if (totalQty >= Math.abs(userData.position.currentQty)) {
        return true
      }
    } else {
      return true
    }
    return false
  }

  hasPostion(index) {
    var userData = this.state.users[index]
    return userData.position.currentQty != 0
  }
}
