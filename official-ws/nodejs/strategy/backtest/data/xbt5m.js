
const csvToJson = require('./csvToJson')

const fileMap = {
  'XBTUSD': {
    '5m': 'XBTUSD_5m_2017-09-01.csv',
    '1h': 'XBTUSD_1h_2017-06-01.csv',
    '1d': 'XBTUSD_1d_2017-04-01.csv',
  },
  'ETHUSD': {
    '5m': 'ETHUSD_5m_2018-08-03.csv',
    '1h': 'ETHUSD_1h_2018-08-03.csv',
    '1d': 'ETHUSD_1d_2018-08-03.csv',
  }
}

function getHistroyData(symbol, period) {
  return csvToJson(fileMap[symbol][period], period)
}

module.exports = {
  getHistroyData
}
