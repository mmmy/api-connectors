import React from 'react'
import axios from 'axios'

import { PirceUnitMap } from '../../constant'

const supportOpenMethods = ['limit_auto', 'limit', 'market', 'stop_auto', 'stop']

export default class Scalping extends React.Component {
  constructor(props) {
    super(props)
    const { scalping } = props.options
    const symbolConfig = scalping.config[scalping.symbol]
    this.state = {
      pending: false,
      symbol: scalping.symbol,
      risk: 0,
      stopDistance: 10,
      side: 'Sell',
      openMethod: 'limit_auto', // or stop or market or limit or stop_auto
      openPrice: 0, // limit or stop price
      autoOffset: 0, // auto的偏移
      profitRate: 2,
      ...symbolConfig
    }
  }

  render() {
    const { options } = this.props
    const {
      side, symbol, risk, stopDistance, openMethod,
      openPrice, autoOffset, profitRate, pending,
    } = this.state
    const isBuy = side === 'Buy'
    const unit = PirceUnitMap[symbol]

    return <div>
      <div className="row">
        <select value={side} onChange={this.handleChangeValue.bind(this, 'side')}>
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>
        <select value={symbol} onChange={this.handleChangeValue.bind(this, 'symbol')}>
          <option value="XBTUSD">XBTUSD</option>
          <option value="ETHUSD">ETHUSD</option>
        </select>
        &nbsp;
        <label>损距</label>
        <input style={{color: isBuy ? 'green' : 'red', width: 40}} min="0" type="number" onChange={this.handleChangeValue.bind(this, 'stopDistance')} value={stopDistance} />
        &nbsp;
        <label>risk$</label>
        <input min="1" style={{ width: 50 }} type="number" onChange={this.handleChangeValue.bind(this, 'risk')} value={risk} />
        &nbsp;
        <label>ProfitR</label>
        <input min="1" style={{ width: 30 }} type="number" step="0.1" onChange={this.handleChangeValue.bind(this, 'profitRate')} value={profitRate} />
        <select value={openMethod} onChange={this.handleChangeValue.bind(this, 'openMethod')}>
          {
            supportOpenMethods.map(m => <option value={m}>{m}</option>)
          }
        </select>
        &nbsp;
        {
          ['limit', 'stop'].indexOf(openMethod) > -1 && <>
            <label>price</label>
            <input min="0" style={{ width: 60 }} type="number" step={unit} onChange={this.handleChangeValue.bind(this, 'openPrice')} value={openPrice} />
          </>
        }
        {
          ['limit_auto', 'stop_auto'].indexOf(openMethod) > -1 && <>
            <label>offset</label>
            <input min="0" style={{ width: 50 }} type="number" step={unit} onChange={this.handleChangeValue.bind(this, 'autoOffset')} value={autoOffset} />
          </>
        }
        &nbsp;
        <button onClick={this.onSubmit}>submit</button>
      </div>
    </div>
  }

  handleChangeValue = (key, e) => {
    this.setState({
      [key]: e.target.value
    })
    if (key === 'symbol') {
      const { scalping } = this.props.options
      const symbolConfig = scalping.config[e.target.value]
      this.setState({
        ...symbolConfig
      })
    }
  }

  onSubmit = () => {
    if (window.confirm(`Scalping ${this.state.side} ${this.state.symbol} ${this.state.openMethod} ?`)) {
      this.setState({
        pending: true
      })
      this.fetchOrder().then(() => {
        this.setState({
          pending: false
        })
        this.props.onFetchUserList()
      }).catch((e) => {
        alert(`error ${e}`)
        console.log('error', e)
        this.setState({
          pending: false
        })
      })
    }
  }

  fetchOrder = () => {
    const { user } = this.props.options
    const path = '/api/coin/order_scalping'
    return new Promise((resolve, reject) => {
      axios.post(path, {
        user,
        ...this.state,
      })
        .then(({ status, data }) => {
          if (status === 200 && data.result) {
            resolve()
          } else {
            reject(data.info)
          }
        })
    })
  }
}