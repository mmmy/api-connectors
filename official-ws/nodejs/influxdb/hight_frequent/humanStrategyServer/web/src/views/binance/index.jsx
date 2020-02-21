import React from 'react'
import axios from 'axios'
import StopLimitProfit from './StopLimitProfit'

const assetKeys = {
  asset: 'asset',
  walletBalance: 'wb',
  unrealizedProfit: 'ur Pnl',
  marginBalance: 'mb',
}

const positionKeyText = {
  'pa': '数量',
  'entryPrice': 'price',
  'unrealizedProfit': 'ur Pnl',
  'leverage': '倍',
  'positionInitialMargin': 'iw',
}

const orderKeys = {
  symbol: 'symbol',
  side: 'side',
  type: 'type',
  origQty: 'quantity',
  executedQty: 'fill q',
  status: 'status',
  reduceOnly: 'Reduce',
  stopPrice: 'stop',
}

export default class BinanceMainPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: '',
      data: null,
      pending: false,
      logs: [],
    }
  }

  componentDidMount() {
    if (window.location.search) {
      const name = window.location.search.split('?n=')[1]
      if (name) {
        this.setState({
          name,
        }, () => {
          this.fetchUserData()
        })
      }
    }
  }

  render() {
    const { logs, pending, data } = this.state
    if (!data) {
      return 'waiting'
    }
    return <div className="trade-container">
      <div>
        {this.renderMargin()}
        <br />
        {this.renderPostions()}
        <br />
        {this.renderOrders()}
        <br />
        <StopLimitProfit
          options={data.options}
          onChangeOption={this.fetchChangeUserOption}
          onFetchUserData={this.fetchUserData}
          exchangeInfo={data.exchangeInfo}
        />
      </div>
      <div className="logs">
        <h5>日志</h5>
        <ul>
          {
            logs.map(log => <li>{JSON.stringify(log)}</li>)
          }
        </ul>
      </div>
      {
        pending && <div className="pending-container">fetching...</div>
      }
    </div>
  }

  renderMargin() {
    const { data } = this.state
    // const usdtData = data && data.accountData && data.accountData.account.assets.find(d => d.asset === 'USDT')
    const keys = ['asset', 'walletBalance', 'unrealizedProfit', 'marginBalance']
    return <div className="margin">
      <table style={{ fontSize: '12px' }}>
        <thead>
          <tr>
            {
              keys.map(k => <th>{assetKeys[k] || k}</th>).concat(<th>可用</th>)
            }
          </tr>
        </thead>
        <tbody>
          {
            data && data.accountData && data.accountData.account.assets.map(a => {
              const remain = a.marginBalance - a.initialMargin
              return <tr>
                {
                  keys.map(k => {
                    const val = a[k]
                    let format = val
                    if (['walletBalance', 'unrealizedProfit', 'marginBalance'].indexOf(k) > -1) {
                      format = (+format).toFixed(1)
                    }
                    return <td>{format}</td>
                  }).concat(<td>{remain.toFixed(1)}</td>)
                }
              </tr>
            })
          }
        </tbody>
      </table>
    </div>
  }

  renderPostions() {
    const { data } = this.state
    const positionKeys = ['symbol', 'pa', 'entryPrice', 'unrealizedProfit', 'positionInitialMargin', 'leverage', 'isolated']

    return <div className="account clearfix">
      <table style={{ fontSize: '12px' }}>
        <thead>
          <tr>
            {[<th>
              <th><button onClick={this.handleRefreshAccount}>refresh</button></th>
            </th>].concat(positionKeys.map(key => <th>{positionKeyText[key] || key}</th>))}
          </tr>
        </thead>
        <tbody>
          {
            data && data.accountData && data.accountData.account && data.accountData.account.positions &&
            data.accountData.account.positions.filter(p => p.entryPrice > 0).map(position => {
              return <tr>
                {
                  [
                    <td><button style={{ margin: "5px 2px" }} onClick={this.handleClosePosition.bind(this, position)}>Close</button></td>
                  ].concat(positionKeys.map(key => {
                    const val = position[key]
                    let format = val
                    if (key === 'isolated') {
                      format = val ? 'Y' : ''
                    }
                    let cn = ''
                    if (['pa', 'unrealizedProfit'].indexOf(key) > -1) {
                      if (val > 0) {
                        cn = 'green'
                      } else if (val < 0) {
                        cn = 'red'
                      }
                    }
                    return <td className={cn} onClick={this.handlePositionCellClick.bind(this, position, key)}>{format}</td>
                  })).concat(
                    <td><button onClick={this.handleSetCostStop.bind(this, position.symbol)}>cost stop</button></td>
                  )
                }
              </tr>
            })
          }
        </tbody>
      </table>
    </div>
  }

  renderOrders() {
    const { data } = this.state
    const keys = ['symbol', 'side', 'price', 'type', 'origQty', 'executedQty', 'status', 'reduceOnly', 'stopPrice']
    const orders = data && data.accountData && data.accountData.orders || []
    const grayStatus = ['FILLED', 'CANCELED', 'STOPPED', 'REJECTED', 'EXPIRED']
    return <div>
      <div>orders</div>
      <table style={{ fontSize: '12px' }}>
        <thead>
          <tr>
            {
              [<th></th>].concat(keys.map(k => <th>{orderKeys[k] || k}</th>))
            }
          </tr>
        </thead>
        <tbody>
          {
            orders.map(order => {
              const gray = grayStatus.indexOf(order.status) > -1
              return <tr style={{ opacity: gray ? 0.5 : 1 }}>
                {
                  [
                    <td>{!gray && <button onClick={this.handleDeleteOrder.bind(this, order)}>Del</button>}</td>
                  ].concat(
                    keys.map(key => {
                      const val = order[key]
                      let format = val
                      const style={}
                      if (key === 'reduceOnly') {
                        format = val ? 'Y' : ''
                        if (val) {
                          style.background = 'rgba(0,0,0,0.1)'
                        }
                      }
                      let cn = ''
                      if (key === 'side') {
                        cn = val === 'BUY' ? 'green' : 'red'
                      }
                      return <td className={cn} style={style}>{format}</td>
                    })
                  )
                }
              </tr>
            })
          }
        </tbody>
      </table>
    </div>
  }

  fetchUserData = () => {
    this.setState({
      pending: true
    })
    axios.get(`/api/bn?user=${this.state.name}`).then(({ data, status }) => {
      if (status === 200 && data.result) {
        this.setState({
          data: data.data,
          pending: false
        })
      } else {
        alert('服务器错误')
        this.state.logs.push(data)
        this.setState({
          pending: false
        })
      }
    }).catch(e => {
      alert('程序错误')
      this.state.logs.push(e)
      this.setState({
        pending: false
      })
    })
  }

  handleClosePosition(positionData) {
    if (window.confirm(`close ${positionData.symbol}`)) {
      this.startPending()
      axios.post('/api/bn/close_position', { user: this.state.name, symbol: positionData.symbol }).then(({ status, data }) => {
        if (status === 200 && data.result) {
          alert('close postion success')
          this.fetchUserData()
        } else {
          this.pushLog(data.info)
        }
        this.stopPending()
      }).catch(e => {
        this.pushLog(e)
        this.stopPending()
      })
    }
  }

  startPending() {
    this.setState({
      pending: true
    })
  }

  stopPending() {
    this.setState({
      pending: false
    })
  }

  pushLog(info) {
    this.state.logs.push(info)
    this.setState({})
  }

  handlePositionCellClick(positionData) {

  }

  handleDeleteOrder(order) {
    const info = `del order:\n ${order.symbol} ${order.side}`
    if (window.confirm(info)) {
      this.startPending()
      axios.post('/api/bn/delete_order', {
        user: this.state.name,
        order_id: order.orderId,
        symbol: order.symbol
      }).then(({ status, data }) => {
        if (status === 200 && data.result) {
          alert('success!')
          this.fetchUserData()
        } else {
          this.pushLog(data.info)
        }
        this.stopPending()
      }).catch(e => {
        this.stopPending()
        this.pushLog(e)
      })
    }
  }

  fetchChangeUserOption = (path, value) => {
    var userData = this.state.data
    const { user } = userData.options
    this.startPending()
    return new Promise((resolve, reject) => {
      axios.post('/api/bn/change_option', { user, path, value }).then(({ status, data }) => {
        this.stopPending()
        if (status === 200 && data.result) {
          alert('修改成功')
          this.fetchUserData()
          resolve()
        } else {
          this.pushLog(data.info)
          reject()
        }
      }).catch(e => {
        this.stopPending()
        this.pushLog(e)
        reject()
      })
    })
  }

  handleSetCostStop(symbol) {
    var userData = this.state.data
    const { user } = userData.options
    if (window.confirm(`${symbol} 设置保本止损？`)) {
      this.startPending()
      axios.post('/api/bn/set_stop_at_const_pirce', { user, symbol }).then(({ status, data }) => {
        this.stopPending()
        if (status === 200 && data.result) {
          alert(`修改成功:${data.data}`)
          this.fetchUserData()
        } else {
          alert(data.info)
          this.pushLog(data.info)
        }
      }).catch(e => {
        this.stopPending()
        this.pushLog(e)
      })
    }
  }

  handleRefreshAccount = () => {
    const {user} = this.state.data.options
    axios.post('/api/bn/refresh_account_ws_data', { user }).then(({ status, data }) => {
      if (status === 200 && data.result) {
        alert(`refresh成功:${data.data}`)
        this.fetchUserData()
      } else {
        alert(data.info)
        this.pushLog(data.info)
      }
    }).catch(e => {
      this.pushLog(e)
    })
  }
}
