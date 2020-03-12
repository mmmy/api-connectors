import React from 'react'
import axios from 'axios'

const tvConfigKeys = ['minStop', 'maxStop', 'risk', 'maxAmount', 'profitRate']
const Intervals = ['4h', '1h', '30']

export default class StopLimitProfit extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      symbol: 'BTCUSDT',
      side: 'BUY',
      defaultProfitRate: 2,
      risk: 100,
      price: 0,
      stopPx: 0,
      profitPx: 0,
      amount: 0,
      pending: false,
      openMethod: 'limit',
    }
  }

  componentDidMount() {
    this.resetPrices()
  }

  componentWillReceiveProps(newProps, newState) {
    // console.log('commmmmmmmmmmm')
  }

  render() {
    const {
      side, symbol, risk, profitPx,
      stopPx, price, amount, pending,
      defaultProfitRate, openMethod,
    } = this.state
    const { limitStopProfit } = this.props.options
    const isBuy = side === 'BUY'
    const resetProfitPxBtn = <button onClick={this.resetProfitPx}>reset default</button>
    const unit = this.getSymbolPriceStep(symbol)
    const { tvAlertConfig } = limitStopProfit.symbolConfig[symbol]

    if (!this.props.exchangeInfo) {
      return 'no exchangeInfo'
    }
    return <div className="order-limit-withstop-container">
      <div className="row" style={{ fontSize: 12 }}>
        <select value={side} onChange={this.handleChangeValue.bind(this, 'side')}>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <select value={symbol} onChange={this.handleChangeValue.bind(this, 'symbol')}>
          {
            this.getAllSymbols().map(s => <option value={s}>{s}</option>)
          }
        </select>
        &nbsp;
        <label>risk$</label>
        <input style={{ width: 50 }} type="number" onChange={this.handleChangeValue.bind(this, 'risk')} value={risk} />
        &nbsp;
        <label>ProfitR</label>
        <input style={{ width: 50 }} type="number" step="0.5" onChange={this.handleChangeValue.bind(this, 'defaultProfitRate')} value={defaultProfitRate} />
      </div>
      <div className="prices-section">
        <div className="row">
          <label>openMethod</label>
          <select value={openMethod} onChange={this.handleChangeValue.bind(this, 'openMethod')}>
            <option value="limit">limit</option>
            <option value="stop">stop</option>
          </select>
        </div>
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
        </div>
        <div className="row">
          <label style={{ color: isBuy ? 'red' : 'green' }}>{isBuy ? 'stopPx' : 'profitPx'}</label>
          <input step={unit} type="number" value={isBuy ? stopPx : profitPx} onChange={this.handleChangeValue.bind(this, isBuy ? 'stopPx' : 'profitPx')} />
          {
            !isBuy && resetProfitPxBtn
          }
        </div>
        <div className="row">
          <label>amount</label>
          <input type="number" value={amount} disabled />
          <button onClick={this.updateAmount}>update</button>
        </div>
        <div><button onClick={this.handleSubmit}>submit</button></div>
        <br />
      </div>
      <br />
      {this.renderTvAlertConfig()}
      {
        pending && <div className="pending">pending ...</div>
      }
    </div>
  }

  renderTvAlertConfig() {
    const { symbolConfig } = this.props.options.limitStopProfit
    return <div>
      <div>tv alert config</div>
      <table style={{ fontSize: '12px' }}>
        <thead><tr>
          <th>symbol</th>
          {tvConfigKeys.map(k => <th>{k}</th>)}
          <th></th>
          <th>filters</th>
          <th>support intervals</th>

        </tr></thead>
        <tbody>
          {
            Object.getOwnPropertyNames(symbolConfig).map(s => {
              let rows = [<td>{s}</td>]
              const { tvAlertConfig } = symbolConfig[s]
              rows = rows.concat(tvConfigKeys.map(k =>
                <td><div className="cb" onClick={this.handleTvConfig.bind(this, s, k)}>{tvAlertConfig[k]}</div></td>
              ))

              const switchTd = <td>
                <input className="cb" checked={tvAlertConfig['enableLong']} type="checkbox" onChange={this.onChangeTvConfigCheckbox.bind(this, s, 'enableLong')} />多&nbsp;
                <input className="cb" checked={tvAlertConfig['enableShort']} type="checkbox" onChange={this.onChangeTvConfigCheckbox.bind(this, s, 'enableShort')} />空
                <br />
                <div title="entryOffset">eo: <span className="cb" onClick={this.handleTvConfig.bind(this, s, 'entryOffset')}>{tvAlertConfig.entryOffset}</span></div>
              </td>
              rows.push(switchTd)

              const filtersTd = <td>
                <div title="最大入场价格">maxp: <span className="cb" onClick={this.handleTvConfig.bind(this, s, 'entryMaxPrice')}>{tvAlertConfig.entryMaxPrice}</span></div>
                <div title="最小入场价格">minp: <span className="cb" onClick={this.handleTvConfig.bind(this, s, 'entryMinPrice')}>{tvAlertConfig.entryMinPrice}</span></div>
              </td>
              rows.push(filtersTd)

              const intervalsTd = <td>
                {
                  Intervals.map(inter => <span>
                    <input
                      className="cb"
                      checked={tvAlertConfig['supportIntervals'].indexOf(inter) > -1}
                      type="checkbox"
                      onChange={this.onChangeTvConfigInterval.bind(this, s, inter)}
                    />{inter}&nbsp;&nbsp;
                </span>)
                }
              </td>
              rows.push(intervalsTd)
              const autoProfitTd = <td>
                <input className='cb' checked={tvAlertConfig['autoOrderProfit']} type="checkbox" onChange={this.onChangeTvConfigCheckbox.bind(this, s, 'autoOrderProfit')} />autoOrderProfit
              </td>
              rows.push(autoProfitTd)
              const autoStopTd = <td>
                <input className="cb" checked={tvAlertConfig['autoUpdateStop']} type="checkbox" onChange={this.onChangeTvConfigCheckbox.bind(this, s, 'autoUpdateStop')} />
                自动protect @&nbsp;
                <span
                  style={{ width: 30, cursor: 'pointer', display: 'inline-block', fontWeight: 'bold' }}
                  title="当达到该盈亏比自动设置保本止损"
                  onClick={this.handleTvConfig.bind(this, s, 'profitRateForUpdateStop')}
                >{tvAlertConfig.profitRateForUpdateStop}</span>
              </td>
              rows.push(autoStopTd)
              return <tr>{rows}</tr>
            })
          }
        </tbody>
      </table>
    </div>
  }

  handleTvConfig(symbol, key) {
    const { options, onChangeOption } = this.props
    const { tvAlertConfig } = options.limitStopProfit.symbolConfig[symbol]
    const oldValue = tvAlertConfig[key]
    const newVal = window.prompt(`update tv config ${symbol} ${key}`, oldValue)
    if (newVal !== null) {
      const val = +newVal
      if (val < 0) {
        window.alert('需要>0')
        return
      }
      const path = `limitStopProfit.symbolConfig.${symbol}.tvAlertConfig.${key}`
      onChangeOption(path, val)
    }
  }

  getSymbolPriceStep(symbol) {
    const { exchangeInfo } = this.props
    const symbolData = exchangeInfo.symbols.find(s => s.symbol === symbol)
    return symbolData.filters.find(f => f.filterType === 'PRICE_FILTER').tickSize
  }

  getAllSymbols() {
    return this.props.exchangeInfo.symbols.map(s => s.symbol)
  }

  onChangeTvConfigCheckbox = (symbol, key, e) => {
    const { onChangeOption } = this.props
    // const { tvAlertConfig } = options.limitStopProfit
    const newVal = e.target.checked
    const path = `limitStopProfit.symbolConfig.${symbol}.tvAlertConfig.${key}`
    onChangeOption(path, newVal)
  }

  onChangeTvConfigInterval(symbol, interval) {
    const { options, onChangeOption } = this.props
    const { tvAlertConfig } = options.limitStopProfit.symbolConfig[symbol]
    let supportIntervals = tvAlertConfig.supportIntervals
    if (supportIntervals.indexOf(interval) > -1) {
      supportIntervals = supportIntervals.filter(t => t !== interval)
    } else {
      supportIntervals.push(interval)
    }
    const path = `limitStopProfit.symbolConfig.${symbol}.tvAlertConfig.supportIntervals`
    onChangeOption(path, supportIntervals)
  }

  handleChangeValue(key, e) {
    this.setState({
      [key]: e.target.value
    }, () => {
      if (key === 'stopPx' || key === 'price') {
        this.updateAmount()
      }
      if (key === 'side' || key === 'symbol') {
        this.resetPrices()
      }
    })
  }

  updateAmount = () => {
    const { risk, price, stopPx } = this.state
    const diffP = Math.abs(stopPx - price)
    const amount = Math.round((risk / diffP) * price)
    this.setState({
      amount
    })
  }

  resetPrices = () => {
    const { side, symbol } = this.state
    const { uiConfig } = this.props.options.limitStopProfit.symbolConfig[symbol]
    const sideConfig = uiConfig[side]
    this.setState({
      price: sideConfig.price,
      stopPx: sideConfig.stopPx,
      profitPx: sideConfig.profitPx,
      risk: uiConfig.risk,
      defaultProfitRate: uiConfig.defaultProfitRate,
    }, () => {
      this.updateAmount()
    })
  }

  resetProfitPx = () => {
    const { defaultProfitRate, price, stopPx, symbol, side } = this.state
    const diffP = Math.abs(stopPx - price)
    const profitDiffP = this.transformPrice(symbol, defaultProfitRate * diffP)
    const profitPx = side === 'BUY' ? (+price + profitDiffP) : (+price - profitDiffP)
    this.setState({
      profitPx
    })
  }

  transformPrice = (symbol, price) => {
    const unit = this.getSymbolPriceStep(symbol)
    // const rate = 1 / unit
    return Math.round(price / unit) * unit
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
        alert(`error ${e}`)
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
          this.props.onFetchUserData()
        }).catch(errorCb)
      }).catch(errorCb)
    }
  }

  fetchSaveOptions = () => {
    const {
      symbol, side, risk,
      defaultProfitRate, profitPx,
      price, stopPx,
    } = this.state
    const { user } = this.props.options
    const options = {
      limitStopProfit: {
        symbolConfig: {
          [symbol]: {
            uiConfig: {
              risk,
              defaultProfitRate,
              [side]: {
                profitPx,
                price,
                stopPx,
              },
            }
          }
        }
      }
    }
    return new Promise((resolve, reject) => {
      axios.post('/api/bn/change_options', { user, options })
        .then(({ status, data }) => {
          if (status === 200 && data.result) {
            resolve()
          } else {
            reject(data)
          }
        })
    })
  }

  fetchOrder = () => {
    const { user } = this.props.options
    const path = '/api/bn/order_limit_with_stop'
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
