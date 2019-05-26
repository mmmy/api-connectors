import React from 'react'
import axios from 'axios'

const SYMBOLS = [
  'XBTUSD',
  'ETHUSD',
]

const ORDER_METHODS = [
  'stopMarket1h',
  'stopMarket5m',
  'market',
]

const SIGNALS = {
  // 'autoCloseMacdDivergence5m',
  // 'autoCloseMacdDivergence1h',
  'rsiDivergence1h': { operators: ['long', 'short'] },
  'rsiDivergence5m': { operators: ['long', 'short'] },
  'rsiOverTrade1h': { operators: ['long', 'short'] },
  'rsiOverTrade5m': { operators: ['long', 'short'] },
  'stochOverTrade5m': { operators: ['long', 'short'] },
  'stochOverTrade1h': { operators: ['long', 'short'] },
  'stochDivergence5m': { operators: ['long', 'short'] },
  'stochDivergence1h': { operators: ['long', 'short'] },
  'break1h': { operators: ['high1', 'low1'] },
  'break5m': { operators: ['high1', 'low1'] },
}

const signalKeys = Object.keys(SIGNALS)

export default class AutoOrderStopList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      symbol: 'XBTUSD',
      side: 'Buy',
      amount: 1000,
      order_method: 'stopMarket1h',
      signal_name: signalKeys[0],
      signal_operator: 'long',
      signal_value: '',
      remain_times: 1,
      loading: false,
      list: [],
    }
  }
  componentDidMount() {
    this.fetchList()
  }
  render() {
    const { symbol, side, amount, signal_name, signal_operator, order_method, remain_times, loading } = this.state
    const operators = SIGNALS[signal_name].operators
    return <div>
      <div style={{ marginBottom: '5px' }}>
        <select value={symbol} onChange={this.handleChangeForm.bind(this, 'symbol')}>
          {
            SYMBOLS.map(s => <option value={s}>{s}</option>)
          }
        </select>
        <select value={side} onChange={this.handleChangeForm.bind(this, 'side')}>
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>
        <input type="number" value={amount} style={{width: '80px'}} onChange={this.handleChangeForm.bind(this, 'amount')}/>
        <select value={order_method} onChange={this.handleChangeForm.bind(this, 'order_method')}>
          {
            ORDER_METHODS.map(m => <option value={m}>{m}</option>)
          }
        </select>
        <select value={signal_name} onChange={this.handleChangeForm.bind(this, 'signal_name')}>
          {
            signalKeys.map(s => <option value={s}>{s}</option>)
          }
        </select>
        <select value={signal_operator} onChange={this.handleChangeForm.bind(this, 'signal_operator')}>
          {
            operators.map(o => <option value={o}>{o}</option>)
          }
        </select>
        {/* <input value={remain_times} type='number' min="0" step='1' onChange={this.handleChangeForm.bind(this, 'remain_times')} style={{ width: '50px' }} title="剩余次数"/> */}
        <button disabled={loading} onClick={this.onAdd.bind(this)}>添加</button>
      </div>
      {this.renderList()}
    </div>
  }

  renderList() {
    const { list } = this.state
    return <table style={{ fontSize: '12px' }}>
      <thead>
        <tr>
          <th>symbol</th>
          <th>side</th>
          <th>amount</th>
          <th>order_method</th>
          <th>signal_name</th>
          <th>signal_operator</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {
          list.map((a, i) => {
            const isOn = a.on
            let amountColor = ''
            if (isOn) {
              amountColor = a.side === 'Buy' ? 'green' : 'red'
            }
            return <tr key={i}>
              <td>{a.symbol}</td>
              <td>{a.side}</td>
              <td style={{cursor: 'pointer', color: amountColor}} onClick={this.handleChangeAmount.bind(this, i)}>{a.amount}</td>
              <td>{a.order_method}</td>
              <td>{a.signal_name}</td>
              <td>{a.signal_operator}</td>
              <td>
                <span onClick={this.handleChangeRemainTimes.bind(this, i)}>
                  <label for={`remian-span-${i}`}>remain_times</label>&nbsp;<strong id={`remian-span-${i}`} >{a.remain_times}</strong>
                </span>
              </td>
              <td><button onClick={this.handleDeleteItem.bind(this, i)}>x</button></td>
            </tr>
          })
        }
      </tbody>
    </table>
  }

  handleChangeForm(key, e) {
    this.setState({
      [key]: e.target.value
    })
  }

  onAdd() {
    const { user } = this.props
    const { symbol, side, amount, order_method, signal_name, remain_times, signal_operator, signal_value } = this.state
    const auto_order = {
      symbol,
      side,
      amount,
      order_method,
      signal_name,
      signal_operator,
      signal_value,
      remain_times,
    }
    this.setState({
      loading: true
    })
    axios.post('api/coin/add_auto_order_signal', { user, auto_order }).then(({ status, data }) => {
      this.setState({
        loading: false
      })
      if (status === 200) {
        this.fetchList()
      } else {
        this.props.onPushLog(data)
      }
    }).catch(e => {
      this.setState({
        loading: false
      })
      this.props.onPushLog(e)
    })
  }

  fetchList() {
    this.setState({
      loading: true
    })
    axios.get(`api/coin/auto_order_signal_list?user=${this.props.user}`).then(({ status, data }) => {
      this.setState({
        loading: false
      })
      if (status === 200) {
        this.setState({
          list: data.data,
        })
      } else {
        this.props.onPushLog(data)
      }
    }).catch(e => {
      this.props.onPushLog(e)
    })
  }

  handleDeleteItem(index) {
    const { user } = this.props
    if (window.confirm('delete ?')) {
      axios.post('api/coin/delete_auto_order_signal', { user, index }).then(({ status, data }) => {
        if (status === 200) {
          this.fetchList()
        } else {
          this.props.onPushLog(data)
        }
      }).catch(e => this.props.onPushLog(e))
    }
  }

  handleSetOn(index, on) {
    const { list } = this.state
    const autoOrder = list[index]
    const newOrder = {
      ...autoOrder,
      on
    }
    this.updateAutoOrder(index, newOrder)
  }

  handleSetRepeat(index, repeat) {
    const { list } = this.state
    const autoOrder = list[index]
    const newOrder = {
      ...autoOrder,
      repeat
    }
    this.updateAutoOrder(index, newOrder)
  }

  updateAutoOrder(index, auto_order) {
    const { user } = this.props
    axios.post('api/coin/update_auto_order_signal', { user, index, auto_order }).then(({ status, data }) => {
      if (status === 200) {
        this.fetchList()
      } else {
        this.props.onPushLog(data)
      }
    }).catch(e => this.props.onPushLog(e))
  }

  handleChangeAmount(index) {
    const { list } = this.state
    const autoOrder = list[index]
    const newAmount = window.prompt('amount', autoOrder.amount)
    if (newAmount) {
      const newOrder = {
        amount: +newAmount
      }
      this.updateAutoOrder(index, newOrder)
    }
  }

  handleChangeRemainTimes(index) {
    const { list } = this.state
    const autoOrder = list[index]
    const newTimes = window.prompt('remain_times', autoOrder.remain_times)
    if (newTimes !== null) {
      const newOrder = {
        remain_times: +newTimes
      }
      this.updateAutoOrder(index, newOrder)
    }
  }
}
