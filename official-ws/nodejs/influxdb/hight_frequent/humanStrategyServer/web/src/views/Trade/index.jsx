import React from 'react'
import axios from 'axios'
import AutoOrderStopList from './AutoOrderStopList'
import IndicatorValues from './IndicatorValues'

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
  'unrealisedPnlPcnt': 'ur Pnl%',
  'liquidationPrice': '强平',
}

const AUTO_STOP_OFFSET_MAP = {
  'XBTUSD': 8,
  'ETHUSD': 1,
  'ADAH19': 0.0000001,
  'XRPH19': 0.0000002,
  'ETHH19': 0.0001,
  'EOSH19': 0.000002,
  'LTCH19': 0.0001,
  'TRXH19': 0.00000008,
  'BCHH19': 0.001,
}

const supportSymbols = ['XBTUSD', 'ETHUSD', 'ADAH19', 'XRPH19', 'ETHH19', 'EOSH19', 'LTCH19', 'TRXH19', 'BCHH19']

export default class Trade extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      logs: [],
      users: [],
      list_pending: false,
      all_quotes: [],
      all_instruments: [],
      name: '',
    }
  }

  componentDidMount() {
    if (window.location.pathname === '/u' && window.location.search) {
      const name = window.location.search.split('?n=')[1]
      if (name) {
        this.setState({
          name
        }, () => {
          this.fetchUserList()
          this.fetchOrderbookDepth()
          this.fetchAllInstruments()
        })
      }
    }
  }

  render() {
    const { logs, users, all_quotes } = this.state
    const xbtInstrument = this.findInstrumentBySymbol('XBTUSD')
    const xbtBidPrice = xbtInstrument ? xbtInstrument.bidPrice : 0
    return <div className="trade-container">
      <div>
        {
          users.map((user, i) => {
            const { options, positions, margin, orders, form, pending } = user
            const { walletBalance, availableMargin } = margin || {}
            const totalRPnl = positions.reduce((pre, cur) => pre + cur.unrealisedPnl, 0) / 1E8
            // 检查止损是否设置正常
            const orderStopValideMsg = this.checkStop(i)
            const positionKeys = ['symbol', 'leverage', 'currentQty', 'avgCostPrice', 'unrealisedPnl', 'unrealisedPnlPcnt', 'realisedGrossPnl', 'realisedPnl', 'liquidationPrice']
            const balance = walletBalance / 1E8
            const balaceUsd = xbtBidPrice ? (balance * xbtBidPrice).toFixed(0) : null
            const rpnBalance = balance + totalRPnl
            const rpnBalanceUsd = xbtBidPrice ? (rpnBalance * xbtBidPrice).toFixed(0) : null

            return <div className="user-row">
              <div>user: {options.user} ({(availableMargin / 1E8).toFixed(3)}/{balance.toFixed(3)})({balaceUsd})&nbsp;close:{rpnBalanceUsd}</div>
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
                              let format = formatPosition(val, key, position)
                              if (['unrealisedPnl'].indexOf(key) > -1 && xbtBidPrice) {
                                format = `${format} (${(format * xbtBidPrice).toFixed(0)})`
                              }
                              let cn = ''
                              if (['currentQty', 'realisedGrossPnl', 'realisedPnl', 'unrealisedPnl', 'unrealisedPnlPcnt'].indexOf(key) > -1) {
                                if (val > 0) {
                                  cn = 'green'
                                } else if (val < 0) {
                                  cn = 'red'
                                }
                              }
                              return <td className={cn} onClick={this.handlePositionCellClick.bind(this, i, position, key)}>{format}</td>
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
              <div>
                {
                  all_quotes.map(quote => {
                    const instrument = this.findInstrumentBySymbol(quote.symbol)
                    return <div style={{ whiteSpace: 'nowrap' }}>
                      {quote.symbol}:&nbsp;
                      ({quote.bidSize / 1E3 + 'k'})<span className="green">{quote.bidPrice}</span> :&nbsp;
                      <sapn className="red">{quote.askPrice}</sapn>({quote.askSize / 1E3 + 'k'})
                      {
                        instrument && `[${instrument.fundingRate * 100}% ${new Date(instrument.fundingTimestamp).toLocaleString()}]`
                      }
                    </div>
                  })
                }
              </div>
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
                <label for="auto_price_checkbox">auto price</label><input checked={form.auto_price} type="checkbox" id="auto_price_checkbox" onChange={this.handleChangeCheckbox.bind(this, i, 'auto_price')} />
                {
                  !form.auto_price && <span><label>P:</label><input value={form.order_price} style={{ width: '100px' }} type="number" onChange={this.handleInputChangeFormData.bind(this, i, 'order_price')} /></span>
                }
                <button onClick={this.handleOrderLimit.bind(this, i)} disabled={pending || (!form.auto_price && !form.order_price)}>Order Limit</button>
                <input type="checkbox" id="reduce-only-checkbox" checked={form.reduce_only} style={{ marginLeft: '10px' }} onChange={this.handleChangeCheckbox.bind(this, i, 'reduce_only')} /><label for="reduce-only-checkbox">reduce only</label>
              </div>
              <div>
                <button disabled={pending} onClick={this.handleOrderMarket.bind(this, i)} title="市价">Order Market</button>
                <button disabled={pending} onClick={this.handleOrderScalping.bind(this, i, false)} title="限价单，并自动挂一个止损单">Order Scalping</button>
                <button disabled={pending} onClick={this.handleOrderScalping.bind(this, i, true)} title="市价单，并自动挂一个止损单">Order Scalping Market</button>
              </div>
              <hr />
              <div className="title">
                Stop Orders
                <input type="checkbox" checked={options.autoUpdateStopOpenMarketOrder} onChange={this.handleChangeZZSD.bind(this, i)} /> 5m自动追涨杀跌
                <input type="checkbox" checked={options.autoUpdateStopOpenMarketOrder1h} onChange={this.handleChangeZZSD1h.bind(this, i)} /> 1h自动追涨杀跌
                {
                  <span className="red">{orderStopValideMsg}</span>
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
                    <th>execInst</th>
                    <th>ordType</th>
                  </tr></thead>
                  <tbody>
                    {
                      orders.filter(o => o.ordType === 'Stop' || o.ordType === 'MarketIfTouched').map(order => {
                        const isBuy = order.side === 'Buy'
                        return <tr>
                          <td><button onClick={this.handleDelOrder.bind(this, i, order)}>Del</button></td>
                          <td>{order.symbol}</td>
                          <td style={{ cursor: 'pointer' }} title="点击修改" className={order.side == 'Buy' ? 'green' : 'red'} onClick={this.handleUpdateOrder.bind(this, i, order, 'orderQty')}>{order.orderQty * (isBuy ? 1 : -1)}</td>
                          <td style={{ cursor: 'pointer' }} title="点击修改" onClick={this.handleUpdateOrder.bind(this, i, order, 'stopPx')}>{order.stopPx}</td>
                          <td>{order.price || '市价'}</td>
                          <td>{order.ordStatus}</td>
                          <td className={isBuy ? 'green' : 'red'}>{order.leavesQty * (isBuy ? 1 : -1)}</td>
                          <td>{new Date(order.timestamp).toLocaleString()}</td>
                          <td title="如果包含了Close, 那么只是平仓用，否则可以开仓">{order.execInst}</td>
                          <td>{order.ordType}</td>
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
                  <button onClick={this.handleOrderStopByPreK.bind(this, i, '5m')}>前5m极点</button>
                  <button onClick={this.handleOrderStopByPreK.bind(this, i, '1h')}>前1h极点</button>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>stopPx:</label>
                  <input value={form.stop_price} style={{ width: '100px' }} type="number" onChange={this.handleInputChangeFormData.bind(this, i, 'stop_price')} />
                  <button onClick={this.handleOrderStop.bind(this, i, 0)} disabled={pending || !form.stop_price}>Order Stop Market</button>
                  <label for="checkbox-stop-close">Close</label>
                  <input checked={form.stop_close} type="checkbox" id="checkbox-stop-close" onChange={this.handleChangeCheckbox.bind(this, i, 'stop_close')} />
                  <button onClick={this.handleOrderStop.bind(this, i, 1)} disabled={pending || !form.stop_price}>Take Profit Market</button>
                </div>
              </div>
              <AutoOrderStopList user={options.user} onPushLog={this.pushLog.bind(this)} />
              <hr />
              <IndicatorValues />
              <div className="actions">
                <div>

                </div>
                <div>
                  <button onClick={this.handleDeleteAll.bind(this, i)} disabled={pending}>Delete All Orders</button>
                </div>
                <div></div>
              </div>
              <div>
                <h5>Config</h5>
                <table>
                  <thead>
                    <tr><th>序号</th><td>自动平仓</td><td>信号</td></tr>
                  </thead>
                  <tbody>
                    {
                      [
                        // 'autoCloseMacdDivergence5m',
                        // 'autoCloseMacdDivergence1h',                    
                        'autoCloseStochOverTrade_2575_5m',
                        'autoCloseRsiOverTrade5m',
                        'autoCloseRsiDivergence5m',
                        'autoCloseStochOverTrade_3070_1h',
                        'autoCloseStochOverTrade_2575_1h',
                        'autoCloseRsiOverTrade_3070_1h',
                        'autoCloseRsiOverTrade_2575_1h',
                        'autoCloseRsiOverTrade1h',
                        'autoCloseRsiDivergence_3070_1h',
                        'autoCloseRsiDivergence_2575_1h',
                        'autoCloseRsiDivergence1h',
                        'autoCloseStochOverTrade_3070_1d',
                        // 'autoCloseStochOverTrade5m',
                        // 'autoCloseStochDivergence5m',
                        // 'autoCloseStochDivergence1h',
                      ].map((key, j) => {
                        return <tr>
                          <td>
                            {j + 1}
                          </td>
                          <td>
                            <input id={`config-${j}`} type="checkbox" onChange={this.handleCheckboxOption.bind(this, i, key)} checked={options[key]} />
                          </td>
                          <td>
                            <label for={`config-${j}`}>{key}</label>
                          </td>
                        </tr>
                      })
                    }
                  </tbody>
                </table>
              </div>
              <div>
                <h5>
                  BOT&nbsp;&nbsp;
                  <label title="开启后 套保才是空仓">usdMode</label>
                  <input type="checkbox" id="bot-rsi-divergence-checkbox-usdmode" onClick={this.handleCheckboxOption.bind(this, i, 'BotConfig.usdMode')} checked={options.BotConfig.usdMode} />
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <label>currentPostionBotId-XBTUSD</label>
                  <select onChange={this.handleSelectPositonBotId.bind(this, i, 'BotConfig.currentPositionBotId.XBTUSD')} value={options.BotConfig.currentPositionBotId['XBTUSD']}>
                    <option value="">无</option>
                    <option value="__rsi_divergence_bot">__rsi_divergence_bot</option>
                    <option value="__break_candle_bot">__break_candle_bot</option>
                    <option value="__pin_bar_bot">__pin_bar_bot</option>
                  </select>
                </h5>
                <div>
                  <input type="checkbox" id="bot-rsi-divergence-checkbox" onClick={this.handleCheckboxOption.bind(this, i, 'botRsiDivergence.on')} checked={options.botRsiDivergence.on} />
                  <label>rsi divergence</label>
                </div>
                <div>
                  <input type="checkbox" id="bot-breakcandle-checkbox" onClick={this.handleCheckboxOption.bind(this, i, 'botBreakCandle.on')} checked={options.botBreakCandle.on} />
                  <label>break candle</label>
                </div>
                <div>
                  <input type="checkbox" id="bot-pinbar-checkbox" onClick={this.handleCheckboxOption.bind(this, i, 'botPinBar.on')} checked={options.botPinBar.on} />
                  <label>hour pin bar</label>
                </div>
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
    axios.get(`/api/coin/all_quotes?t=${+new Date()}`).then(({ status, data }) => {
      if (status === 200 && data.result) {
        const all_quotes = data.data || []
        // const obBuy = order_book[0]
        this.setState({
          all_quotes,
        })
      } else {
        this.pushLog(data.info)
      }
    })
  }

  fetchAllInstruments() {
    axios.get(`/api/coin/all_instruments?t=${+new Date()}`).then(({ status, data }) => {
      if (status === 200 && data.result) {
        const all_instruments = data.data || []
        this.setState({
          all_instruments
        })
      } else {
        this.pushLog(data.info)
      }
    })
  }

  findInstrumentBySymbol(symbol) {
    const { all_instruments } = this.state
    for (let i = 0; i < all_instruments.length; i++) {
      const item = all_instruments[i]
      if (item.symbol === symbol) {
        return item
      }
    }
  }

  fetchUserList() {
    this.setState({
      list_pending: true
    })
    axios.get(`/api/coin?user=${this.state.name}`).then(({ data, status }) => {
      if (status === 200 && data.result) {
        this.setState({
          users: data.items.map(item => {
            item.form = {
              order_side: 'Buy', order_qty: 100, pending: false, order_price: null,
              stop_side: 'Sell', stop_qty: 1000, stop_price: null,
              reduce_only: false,
              order_symbol: 'XBTUSD',
              stop_symbol: 'XBTUSD',
              auto_price: false,
              stop_close: true,
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
    const { order_side, order_qty, order_price, reduce_only, order_symbol, auto_price } = userData.form
    var info = `${user}\n ${order_symbol} ${order_side} ${order_qty} at ${auto_price ? '自动价格' : order_price} ${reduce_only ? '只减仓' : ''}`
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
        auto_price: auto_price,
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
  // order limit auto stop and order a stop market at the same time
  // market 市价
  handleOrderScalping(index, market) {
    var userData = this.state.users[index]
    const user = userData.options.user
    const { order_side, order_qty, order_symbol } = userData.form
    var info = `${user}\n ${order_symbol} ${order_side} ${order_qty} Scalping ${market ? "Market" : "Limit"}?`

    const stopOffset = AUTO_STOP_OFFSET_MAP[order_symbol]

    if (window.confirm(info)) {
      userData.pending = true
      Promise.all([
        axios.post(market ? '/api/coin/order_market' : '/api/coin/order_limit', {
          user,
          symbol: order_symbol,
          qty: order_qty,
          side: order_side,
          auto_price: true
        }),
        axios.post('api/coin/order_stop', {
          user,
          symbol: order_symbol,
          qty: order_qty,
          side: order_side === 'Buy' ? 'Sell' : 'Buy',
          offset: stopOffset
        })
      ]).then(() => {
        userData.pending = false
        alert('success!')
        this.fetchUserList()
      }).catch(e => {
        userData.pending = false
        this.pushLog(e)
      })
    }
  }
  // 市价止损
  handleOrderStop(index, type) {
    var userData = this.state.users[index]
    const user = userData.options.user
    const { stop_side, stop_qty, stop_price, stop_symbol, stop_close } = userData.form
    var info = `${user} ${type === 1 ? 'order MarketIfTouched' : 'order stop market'}?\n ${stop_symbol} ${stop_side} ${stop_qty} at ${stop_price}?`
    if (window.confirm(info)) {
      userData.pending = true
      this.setState({})
      const path = type === 1 ? 'api/coin/order_market_if_touched' : 'api/coin/order_stop'
      axios.post(path, { user, symbol: stop_symbol, qty: stop_qty, side: stop_side, stopPx: stop_price, stop_close }).then(({ status, data }) => {
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

  handleOrderStopByPreK(index, period) {
    const path = 'api/coin/order_stop_open_by_lastcandle'
    var userData = this.state.users[index]
    const { user } = userData.options
    const { stop_symbol, stop_side, stop_qty } = userData.form
    userData.pending = true
    this.setState({})
    const info = `${user} order stop open: ${stop_side} ${stop_symbol} ${stop_qty} 前一K线（${period}）?`
    if (window.confirm(info)) {
      axios.post(path, { user, period, symbol: stop_symbol, qty: stop_qty, side: stop_side }).then(({ status, data }) => {
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

  handlePositionCellClick(index, position, key) {
    var userData = this.state.users[index]
    const val = position[key]
    const { user } = userData.options
    const symbol = position.symbol

    if (key === 'leverage') {
      const newLeverage = window.prompt('leverage', val)
      userData.pending = true
      this.setState({})
      axios.post('api/coin/change_leverage', { user, symbol, leverage: newLeverage }).then(({ status, data }) => {
        userData.pending = false
        if (status === 200 && data.result) {
          alert('change leverage success!')
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
    const { positions } = userData
    let msg = ''
    positions.forEach(p => {
      const isbuyPosition = p.currentQty > 0
      let totalQty = 0
      userData.orders.filter(o => o.symbol === p.symbol).forEach(o => {
        const side = isbuyPosition ? 'Sell' : 'Buy'
        if (o.ordType === 'Stop' && o.side === side) {
          totalQty += o.orderQty
        }
      })
      if (totalQty < Math.abs(p.currentQty)) {
        msg = msg + `${p.symbol}止损设置有误！`
      }
    })

    return msg
  }

  handleCheckboxOption(index, key, e) {
    this.fetchChangeUserOption(index, key, e.target.checked)
  }

  handleSelectChangeOption(index, key, e) {
    this.fetchChangeUserOption(index, key, e.target.value)
  }

  handleSelectPositonBotId(index, key, e) {
    if (window.confirm('强制修改bot id?')) {
      this.handleSelectChangeOption(index, key, e)
    }
  }

  handleChangeZZSD(index, e) {
    const key = 'autoUpdateStopOpenMarketOrder'
    this.fetchChangeUserOption(index, key, e.target.checked)
  }

  handleChangeZZSD1h(index, e) {
    const key = 'autoUpdateStopOpenMarketOrder1h'
    this.fetchChangeUserOption(index, key, e.target.checked)
  }

  fetchChangeUserOption(index, path, value) {
    var userData = this.state.users[index]
    const { user } = userData.options
    userData.pending = true
    this.setState({})

    axios.post('api/coin/change_option', { user, path, value }).then(({ status, data }) => {
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
