const BackTestSymbol = require('../BackTestSymbol')
const AccountV2 = require('../AccountV2')

module.exports = class BackTestDuet extends BackTestSymbol {
  constructor(options) {
    super(options)
    this._accout = new AccountV2(this._options['account'])

    this.initStrategy()
  }
  initStrategy() {
    this.setStrategy(() => {
      const { highVol, useAdx, len, upVol, disableLong, disableShort } = this._options

      let long = false
      let short = false

      const signal = this.getCandle('XBTUSD', '5m').isLastBarTrend(48)
      if (!disableLong && signal.long) {
        const upVolFilter = this.getCandle('XBTUSD', '1h').isUpVol(10, 3)
        const useAdx = this.getCandle('XBTUSD', '1d').adxSignal(14, false).long
        if (upVolFilter && useAdx) {
          long = true
        }
      }

      return {
        long,
        short
      }
    })

    this._closeSignal = () => {
      return {
        long: false,
        short: false
      }
    }

    this._onUpdateBar['XBTUSD']['5m'] = this.readBar5m.bind(this)
    this._onUpdateBar['ETHUSD']['5m'] = this.readBar5m.bind(this)
  }

  readBar5m(symbol, period, data) {
    // console.log(symbol)
    // this.checkCandle(symbol)
  }
}
