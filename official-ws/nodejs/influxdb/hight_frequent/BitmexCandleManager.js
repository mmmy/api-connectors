// bitmex kline manager like AccountOrder
const Candles = require('../../strategy/Candles')
class BitmexCandleManager {
  constructor(options) {
    this._options = {
      ...options
    }
    this._candles = {}
  }

  update(candle, symbol) {
    symbol = symbol || 'XBTUSD'
    this.initManagerIfNeed(symbol)
    this._candles[symbol].updateLastHistory(candle)
    return this._candles[symbol]
  }

  setHistoryData(list, symbol) {
    symbol = symbol || 'XBTUSD'
    this.initManagerIfNeed(symbol)
    this._candles[symbol].setHistoryData(list)
    return this._candles[symbol]
  }
  
  initManagerIfNeed(symbol) {
    if (!this._candles[symbol]) {
      this._candles[symbol] = new Candles()
    }
  }

  calcMacdDepartSignal(symbol, len, offset) {
    return this._candles[symbol].macdDepartSignal(false, len, offset)
  }

  rsiDivergenceSignal(symbol, len, divergenceLen) {
    return this._candles[symbol].rsiDivergenceSignal(false, len, divergenceLen)
  }

  getHistoryCandle(symbol) {
    return this._candles[symbol].getHistoryCandle(1)
  }

  rsiOverTradeSignal(symbol, len) {
    return this._candles[symbol].rsiOverTradeSignal(false, len)
  }

  highlow1Signal(symbol) {
    return this._candles[symbol].rsiOverTradeSignal()
  }
}

module.exports = BitmexCandleManager
