
const csvToJson = require('./csvToJson')
const file = 'XBTUSD_5m_2017-09-01.csv'
const data = csvToJson(file)

module.exports = data
