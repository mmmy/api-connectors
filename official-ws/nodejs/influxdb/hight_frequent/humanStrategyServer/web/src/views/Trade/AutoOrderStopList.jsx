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
      signal_side: true,
      loading: false,
    }
  }
  componentDidMount() {

  }
  render() {
    const { symbol, side, amount, signal_name, signal_side, loading } = this.state
    return <div>
      <div>
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
    </div>
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
    axios.post('api/coin/auto_order_by_signal')
  }
}
