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

  getHistoryCandle(symbol, bars = 1) {
    return this._candles[symbol].getHistoryCandle(bars)
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

  isLowVol(symbol, len, rate) {
    return this._candles[symbol].isLowVol(len, rate)
  }

  isAdxHigh(symbol, len) {
    return this._candles[symbol].isAdxHigh(len)
  }

  isCurrentHighestLowestClose(symbol, len) {
    return this._candles[symbol].isCurrentHighestLowestClose(false, len)
  }

  isLastBarTrend(symbol, len) {
    return this._candles[symbol].isLastBarTrend(len)
  }

  isUpVol(symbol, slowLen, fastLen) {
    return this._candles[symbol].isUpVol(slowLen, fastLen)
  }

  adxSignal(symbol, len) {
    return this._candles[symbol].adxSignal(len, false)
  }

  getMinMaxHighLow(symbol, len) {
    return this._candles[symbol].getMinMaxHighLow(len)
  }

  pinBarOpenSignal(symbol, backLen) {
    return this._candles[symbol].pinBarOpenSignal(backLen)
  }
}

module.exports = BitmexCandleManager
