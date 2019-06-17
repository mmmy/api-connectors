import React from 'react'
import axios from 'axios'

const SYMBOLS = ['XBTUSD', 'ETHUSD']

const INDICATORS = [
  {
    period: '1d',
    indicators: ['stoch_k', 'rsi', 'ema'],
  }, {
    period: '1h',
    indicators: ['stoch_k', 'rsi', 'ema'],
  }, {
    period: '5m',
    indicators: ['stoch_k', 'rsi', 'ema'],
  }
]

export default class IndicatorValues extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      pending: false,
      data: {}
    }
  }

  componentDidMount() {

  }

  render() {
    const { data } = this.state
    const namesRow = [<td></td>]
    INDICATORS.forEach((ind) => {
      const { indicators } = ind
      indicators.forEach(indName => {
        namesRow.push(<th>{indName}</th>)
      })
    })
    return <div>
      <table>
        <thead>
          <tr>
            {
              [<th></th>].concat(INDICATORS.map((ind) => {
                const { period, indicators } = ind
                return <th colSpan={indicators.length}>{period}</th>
              }))
            }
          </tr>
          <tr>
            {
              namesRow
            }
          </tr>
        </thead>
        <tbody>
          {
            SYMBOLS.map(symbol => {
              const symbolData = data[symbol] || {}
              const valuesRow = [<td>{symbol}</td>]
              INDICATORS.forEach(ind => {
                const { period, indicators } = ind
                const periodData = symbolData[period] || {}
                indicators.forEach(indName => {
                  valuesRow.push(<td>{periodData[indName]}</td>)
                })
              })
              return <tr>{valuesRow}</tr>
            })
          }
        </tbody>
      </table>
    </div>
  }

  fetchIndicatorValues() {
    this.setState({
      pending: true
    })
    axios.get('/api/coin/all_indicator_values').then(({ status, data }) => {
      this.setState({
        pending: false
      })
      if (status === 200) {
        this.setState({
          data
        })
      }
    })
  }
}
