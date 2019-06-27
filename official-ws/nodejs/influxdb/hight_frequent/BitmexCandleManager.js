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

  rsiDivergenceSignal(symbol, len, highlowLen, divergenceLen, theshold_bottom, theshold_top) {
    return this._candles[symbol].rsiDivergenceSignal(false, len, highlowLen, divergenceLen, theshold_bottom, theshold_top)
  }

  getHistoryCandle(symbol) {
    return this._candles[symbol].getHistoryCandle(1)
  }

  rsiOverTradeSignal(symbol, len, theshold_bottom, theshold_top) {
    return this._candles[symbol].rsiOverTradeSignal(false, len, theshold_bottom, theshold_top)
  }

  highlow1Signal(symbol) {
    return this._candles[symbol].highlow1Signal()
  }

  getLastStochKD(symbol, len, kLen) {
    return this._candles[symbol].getLastStochKD(len, kLen)
  }

  getLastRsi(symbol, len) {
    return this._candles[symbol].getLastRsi(len)
  }

  getLastEMA(symbol, len) {
    return this._candles[symbol].getLastEMA(len)
  }

  stochOverTradeSignal(symbol, len, kLen, theshold_bottom, theshold_top) {
    return this._candles[symbol].stochOverTradeSignal(len, kLen, theshold_bottom, theshold_top)
  }
}

module.exports = BitmexCandleManager
