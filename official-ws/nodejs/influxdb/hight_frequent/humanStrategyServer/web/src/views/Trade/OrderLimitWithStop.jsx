import React from 'react'
import axios from 'axios'

const PirceUnitMap = {
  'XBTUSD': 0.5,
  'ETHUSD': 0.05,
}

function transformPrice(symbol, price) {
  const unit = PirceUnitMap[symbol]
  const rate = 1 / unit
  return Math.round(price * rate) / rate
}

export default class OrderLimitWithStop extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      symbol: 'XBTUSD',
      side: 'Buy',
      defaultProfitRate: 2,
      risk: 100,
      offset: 0,
      price: 0,
      stopPx: 0,
      profitPx: 0,
      amount: 0,
      pending: false,
      kRateForPrice: 0.5,
      ...props.options.limitStopProfit,
    }
  }
  render() {
    const { options, index } = this.props
    const {
      side, symbol, risk, shortMode, profitPx,
      stopPx, price, amount, offset, pending,
      kRateForPrice, defaultProfitRate, autoOrderProfit
    } = this.state
    const isBuy = side === 'Buy'
    const resetProfitPxBtn = <button onClick={this.resetProfitPx}>reset default</button>
    const unit = PirceUnitMap[symbol]

    return <div className="order-limit-withstop-container">
      <div className="row">
        <div>{JSON.stringify(options.limitStopProfit.symbolConfig)}</div>
        <select value={side} onChange={this.handleChangeValue.bind(this, 'side')}>
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>
        <select value={symbol} onChange={this.handleChangeValue.bind(this, 'symbol')}>
          <option value="XBTUSD">XBTUSD</option>
          <option value="ETHUSD">ETHUSD</option>
        </select>
        &nbsp;
        <label>risk$</label>
        <input style={{ width: 50 }} type="number" onChange={this.handleChangeValue.bind(this, 'risk')} value={risk} />
        &nbsp;
        <label>ProfitR</label>
        <input style={{ width: 50 }} type="number" step="0.5" onChange={this.handleChangeValue.bind(this, 'defaultProfitRate')} value={defaultProfitRate} />
        <span>
          <label>autoOrderProfit</label>
          <input type="checkbox"
            checked={autoOrderProfit}
            onChange={this.handleCheckboxOption.bind(this, 'autoOrderProfit')}
          />
        </span>
        &nbsp;
        <span>
          <label>shortMode</label>
          <input type="checkbox"
            disabled
            checked={shortMode}
            onChange={this.handleCheckboxOption.bind(this, 'shortMode')}
          />
        </span>
      </div>
      <div className="row">
        <button onClick={this.handleFetchCandleAndApply.bind(this, '4h')}>auto 4h K</button>
        <button onClick={this.handleFetchCandleAndApply.bind(this, '1h')}>auto 1h K</button>
        &nbsp;
        &nbsp;
        <label>offset</label><input style={{ width: 40 }} min="0" type="number" value={offset} onChange={this.handleChangeValue.bind(this, 'offset')} />
        &nbsp;
        <label>kRateForPrice</label><input step="0.1" style={{ width: 60 }} min="0" type="number" value={kRateForPrice} onChange={this.handleChangeValue.bind(this, 'kRateForPrice')} />
      </div>
      <div className="prices-section">
        <div className="row">
          <label style={{ color: isBuy ? 'green' : 'red' }}>{isBuy ? 'profitPx' : 'stopPx'}</label>
          <input step={unit} type="number" value={isBuy ? profitPx : stopPx} onChange={this.handleChangeValue.bind(this, isBuy ? 'profitPx' : 'stopPx')} />
          {
            isBuy && resetProfitPxBtn
          }
        </div>
        <div className="row">
          <label>price</label>
          <input step={unit} type="number" value={price} onChange={this.handleChangeValue.bind(this, 'price')} />
          &nbsp;
          &nbsp;
          <label>amount</label>
          <input type="number" value={amount} disabled />
          <button onClick={this.updateAmount}>update</button>
        </div>
        <div className="row">
          <label style={{ color: isBuy ? 'red' : 'green' }}>{isBuy ? 'stopPx' : 'profitPx'}</label>
          <input step={unit} type="number" value={isBuy ? stopPx : profitPx} onChange={this.handleChangeValue.bind(this, isBuy ? 'stopPx' : 'profitPx')} />
          {
            !isBuy && resetProfitPxBtn
          }
        </div>
      </div>
      <div><button onClick={this.handleSubmit}>submit</button></div>
      {
        pending && <div className="pending">pending ...</div>
      }
    </div>
  }

  // handleCheckboxOption = (index, key, e) => {
  //   this.props.onChangeOption(index, key, e.target.checked)
  // }

  handleChangeValue = (key, e) => {
    this.setState({
      [key]: e.target.value
    }, () => {
      if (key === 'stopPx') {
        this.updateAmount()
      }
    })
  }

  handleCheckboxOption = (key, e) => {
    this.setState({
      [key]: e.target.checked
    })
    if (key === 'autoOrderProfit' || key === 'shortMode') {
      this.fetchSaveOption(`limitStopProfit.${key}`, e.target.checked)
    }
  }

  handleFetchCandleAndApply = (period) => {
    const { symbol, offset } = this.state
    this.setState({
      pending: true
    })
    axios.get(`/api/coin/candle_data?symbol=${symbol}&period=${period}&offset=${offset}&t=${+new Date()}`)
      .then(({ status, data }) => {
        if (status === 200 && data.result) {
          const { side, kRateForPrice, symbol } = this.state
          const isBuy = side === 'Buy'
          const { open, close, high, low } = data.data
          const priceDiff = Math.abs(high - low) * kRateForPrice
          let price = isBuy ? (high - priceDiff) : (low + priceDiff)
          price = transformPrice(symbol, price)
          const unit = PirceUnitMap[symbol]
          const stopPx = isBuy ? (low - unit) : (high + unit)
          this.setState({
            price,
            stopPx
          }, () => {
            this.updateAmount()
            this.resetProfitPx()
          })
        } else {
          alert('error', data)
        }
        this.setState({
          pending: false
        })
      })
  }

  updateAmount = () => {
    const { side, risk, price, stopPx } = this.state
    const diffP = Math.abs(stopPx - price)
    const amount = Math.round((risk / diffP) * price)
    this.setState({
      amount
    })
  }

  resetProfitPx = () => {
    const { defaultProfitRate, price, stopPx, side } = this.state
    const diffP = Math.abs(stopPx - price)
    const profitDiffP = Math.round(defaultProfitRate * diffP)
    const profitPx = side === 'Buy' ? (+price + profitDiffP) : (+price - profitDiffP)
    this.setState({
      profitPx
    })
  }

  handleSubmit = () => {
    const { symbol, price, amount, side, stopPx, profitPx } = this.state
    if (!price || !amount || !stopPx || !profitPx) {
      alert('price or amount error')
      return
    }
    const msg = `${side} ${symbol} @ ${price} ${amount} stop@${stopPx}`
    if (window.confirm(msg)) {
      this.setState({
        pending: true
      })

      const errorCb = (e) => {
        alert('error', e)
        console.log('error', e)
        this.setState({
          pending: false
        })
      }

      this.fetchSaveOptions().then(() => {
        this.fetchOrder().then(() => {
          this.setState({
            pending: false
          })
          this.props.onFetchUserList()
        }).catch(errorCb)
      }).catch(errorCb)
    }
  }

  fetchOrder = () => {
    const { user } = this.props.options
    const path = '/api/coin/order_limit_with_stop'
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

  fetchSaveOptions = () => {
    const {
      shortMode, symbol, side, risk,
      period, defaultProfitRate, profitPx,
      kRateForPrice, price, stopPx,
    } = this.state
    const { user } = this.props.options
    const options = {
      limitStopProfit: {
        shortMode,
        symbol,
        side,
        risk,
        period,
        defaultProfitRate,
        symbolConfig: {
          [symbol]: {
            profitPx,
            price,
            side,
            stopPx,
          }
        },
        kRateForPrice,
      }
    }
    return new Promise((resolve, reject) => {
      axios.post('api/coin/change_options', { user, options })
        .then(({ status, data }) => {
          if (status === 200 && data.result) {
            resolve()
          } else {
            reject(data)
          }
        })
    })
  }

  fetchSaveOption = (path, value) => {
    const { user } = this.props.options
    this.setState({
      pending: true
    })
    axios.post('api/coin/change_option', { user, path, value }).then(({ status, data }) => {
      if (status === 200 && data.result) {

      } else {
        alert('error', data.info)
      }
      this.setState({
        pending: false
      })
    }).catch(() => {
      this.setState({
        pending: false
      })
    })
  }
}
