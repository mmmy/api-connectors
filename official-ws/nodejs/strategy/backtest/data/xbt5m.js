
const csvToJson = require('./csvToJson')

function getXBTUSD5mData() {
  return csvToJson('XBTUSD_5m_2017-09-01.csv', '5m')
}

function getXBTUSD1hData() {
  return csvToJson('XBTUSD_1h_2017-06-01.csv', '1h')
}

function getXBTUSD1dData() {
  return csvToJson('XBTUSD_1d_2017-04-01.csv', '1d')
}

module.exports = {
  getXBTUSD5mData,
  getXBTUSD1hData,
  getXBTUSD1dData
}
