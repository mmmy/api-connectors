import React from 'react'

const defaultOptions = {
  "width": 600,
  "height": 300,
  // "autosize": true,
  "interval": "5",
  "theme": "Light",
  "style": "1",
  "locale": "zh_CN",
  "toolbar_bg": "#f1f3f6",
  "enable_publishing": false,
  "withdateranges": true,
  "allow_symbol_change": true,
  "hide_top_toolbar": true,
  "hide_legend": false,
  "studies": [
    "Volumn@tv-basicstudies",
    // "RSI@tv-basicstudies",
  ],
}

export default class TradingView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      chartList: [
        { "symbol": "BITMEX:XBTUSD", "container_id": "_tv_1", interval: "5" },
        { "symbol": "BITMEX:XBTUSD", "container_id": "_tv_2", interval: "60" },
        { "symbol": "BITMEX:XBTUSD", "container_id": "_tv_3", interval: "240" },
        { "symbol": "BITMEX:XBTUSD", "container_id": "_tv_4", interval: "D" },
        { "symbol": "BITMEX:XBTUSD", "container_id": "_tv_5", interval: "W" },
      ]
    }
  }

  componentDidMount() {
    this.state.chartList.forEach(c => {
      const option = Object.assign({}, defaultOptions, c)
      try {
        new window.TradingView.widget(option)
      } catch (e) {
        console.error(e)
      }
    })
  }

  render() {
    return <div className="clearfix">
      {
        this.state.chartList.map(c => <div style={{ float: 'left' }} id={c.container_id}></div>)
      }
    </div>
  }
}
