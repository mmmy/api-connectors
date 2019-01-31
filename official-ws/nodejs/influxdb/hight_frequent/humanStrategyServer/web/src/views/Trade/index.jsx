import React from 'react'
import axios from 'axios'

import './index.css'

function formatPosition(val, key, position) {
  switch(key) {
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

export default class Trade extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      logs: [],
      users: [],
      list_pending: false,
    }
  }

  componentDidMount() {
    this.fetchUserList()
  }

  render() {
    const { logs, users } = this.state
    return <div className="trade-container">
      <div>
        {
          users.map((user, i) => {
            const { options, position, orders, form, pending } = user
            const positionKeys = ['leverage', 'currentQty', 'avgCostPrice', 'realisedGrossPnl', 'realisedPnl', 'unrealisedPnl', 'unrealisedPnlPcnt']
            return <div className="user-row">
              <div>user: {user.options.user}</div>
              <div className="account clearfix">
                <table>
                  <tbody>
                    {positionKeys.map(key => {
                      const val = position[key]
                      const format = formatPosition(val, key, position)
                      return <tr><td>{key}</td><td>{format}</td></tr>
                    })}
                  </tbody>
                </table>
              </div>
              <div className="actions">
                <div>
                  <div>
                    <select value={form.order_side} onChange={this.handleSelectChangeFormData.bind(this, i, 'order_side')}>
                      <option value="Buy">Buy</option>
                      <option value="Sell">Sell</option>
                    </select>
                    <input onChange={this.handleInputChangeFormData.bind(this, i, 'order_qty')} style={{width: '80px'}} type="number" value={form.order_qty}/>
                  </div>
                  <div>
                    <button disabled={pending} onClick={this.handleOrderMarket.bind(this, i)}>Order Market</button>
                  </div>
                  <div>
                    <button disabled={pending}>Order Limit</button>
                  </div>
                </div>
                <div>
                  <button disabled={pending}>Close Position</button>
                  <button disabled={pending}>Delete All</button>
                </div>
                <div></div>
              </div>
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

  fetchUserList() {
    this.setState({
      list_pending: true
    })
    axios.get('/api/coin').then(({data, status}) => {
      if (status === 200) {
        this.setState({
          users: data.items.map(item => {
            item.form = {
              order_side: 'Buy', order_qty: 100, pending: false
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

  handleOrderMarket(index) {
    var userData = this.state.users[index]
    var info = `${userData.options.user}\n ${userData.form.order_side} ${userData.form.order_qty}?`
    if (window.confirm(info)) {
      userData.pending = true
      this.setState({})
      axios.post('/api/coin/order_market', {
        user: userData.options.user,
        qty: userData.form.order_qty,
        side: userData.form.order_side,
      }).then(({ status, data }) => {
        userData.pending = false
        if (status === 200) {
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
}
