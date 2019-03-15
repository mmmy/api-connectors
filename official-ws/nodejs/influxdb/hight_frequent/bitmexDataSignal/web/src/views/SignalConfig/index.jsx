import React from 'react'
import axios from 'axios'

import './index.css'

export default class SignalConfig extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      checkOptions: null,
      pending: false,
    }
  }
  componentDidMount() {
    this.fetchCheckOptions()
  }
  render() {
    const { checkOptions, pending } = this.state
    if (!checkOptions) {
      return <p>未加载</p>
    }
    const { orderBook } = checkOptions
    const obKeys = Object.getOwnPropertyNames(orderBook)
    return <div className="signal-config-container">
      <h4>
        <label htmlFor="check_interval_box">开关：</label>
        <input id="check_interval_box" type="checkbox" checked={checkOptions.checkInterval} onChange={this.handleCheckBoxChange.bind(this, 'checkInterval')} />
      </h4>
      <h5>order book</h5>
      <div>
        {
          obKeys.map((key, i) => {
            return <p key={i}>
              <label htmlFor={`ob_${i}`}>{key}</label>
              <input id={`ob_${i}`} type="checkbox"
                checked={orderBook[key]}
                onChange={this.handleCheckBoxChange.bind(this, `orderBook.${key}`)}
              />
            </p>
          })
        }
      </div>
      {
        pending && <div className="loading">fetching...</div>
      }
    </div>
  }

  fetchCheckOptions() {
    this.setState({
      pending: true
    })
    axios.get('/api/signal').then(({ data, status }) => {
      this.setState({
        pending: false
      })
      if (status === 200 && data.result) {
        this.setState({
          checkOptions: data.data
        })
      } else {
        alert(data)
      }
    })
  }

  handleCheckBoxChange(path, e) {
    if (path === 'checkInterval') {
      this.setCheckInterval(e.target.checked)
      return
    }
    this.updateOptionsValue(path, e.target.checked)
  }

  setCheckInterval(value) {
    this.setState({
      pending: false
    })
    let path = value ? '/api/signal/start_check_interval' : '/api/signal/stop_check_interval'
    axios.post(path, {}).then(({ data, status }) => {
      this.setState({
        pending: false
      })
      if (status === 200 && data.result) {
        this.fetchCheckOptions()
      } else {
        alert(data)
      }
    })
  }

  updateOptionsValue(path, value) {
    this.setState({
      pending: false
    })
    axios.post('/api/signal/update_check_options', { path, value }).then(({ data, status }) => {
      this.setState({
        pending: false
      })
      if (status === 200 && data.result) {
        this.fetchCheckOptions()
      }
    })
  }
}