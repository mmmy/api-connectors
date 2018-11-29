
const csvToJson = require('./csvToJson')
const file = 'tETHUSD_5m_2017-09-01.csv'
const data = csvToJson(file)

module.exports = data
