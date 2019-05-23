import React from 'react'
import axios from 'axios'

const SYMBOLS = [
  'XBTUSD',
  'ETHUSD',
]

const SIGNALS =                   [
  // 'autoCloseMacdDivergence5m',
  // 'autoCloseMacdDivergence1h',
  'autoCloseStochOverTrade5m',
  'autoCloseStochOverTrade1h',
  'autoCloseStochDivergence5m',
  'autoCloseStochDivergence1h',
  'autoCloseRsiOverTrade5m',
  'autoCloseRsiOverTrade1h',
  'autoCloseRsiDivergence5m',
  'autoCloseRsiDivergence1h',
]

export default class AutoOrderStopList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      symbol: 'XBTUSD',
      side: 'Buy',
      amount: 1000,
      signal_name: SIGNALS[0],
      signal_side: 'long',
      loading: false,
      list: [],
    }
  }
  componentDidMount() {
    this.fetchList()
  }
  render() {
    const { symbol, side, amount, signal_name, signal_side, loading } = this.state
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
        <input type="number" value={amount} style={{width: '100px'}} onChange={this.handleChangeForm.bind(this, 'amount')}/>
        <select value={signal_name} onChange={this.handleChangeForm.bind(this, 'signal_name')}>
          {
            SIGNALS.map(s => <option value={s}>{s}</option>)
          }
        </select>
        <select value={signal_side} onChange={this.handleChangeForm.bind(this, 'signal_side')}>
          <option value={'long'}>long</option>
          <option value={'short'}>short</option>
        </select>
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
          <th>signal_name</th>
          <th>signal_side</th>
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
              <td>{a.signal_name}</td>
              <td>{a.signal_side}</td>
              <td>
                <input onChange={this.handleSetOn.bind(this, i, !a.on)} checked={a.on} type="checkbox" id={`on-${i}`}/><label for={`on-${i}`} style={{marginRight: '5px'}}>on</label>
                <input onChange={this.handleSetRepeat.bind(this, i, !a.repeat)} checked={a.repeat} type="checkbox" id={`repeat-${i}`}/><label for={`repeat-${i}`}>repeat</label>
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
    const { symbol, side, amount, signal_name, signal_side } = this.state
    const repeat = false
    const on = true
    const auto_order = {
      symbol,
      side,
      amount,
      signal_name,
      signal_side,
      repeat,
      on,
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
}
