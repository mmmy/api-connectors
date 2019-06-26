
const path = require('path')
const fs = require('fs')

const PRIOD_MIS = {
  '5m': 5 * 60 * 1000,
  '1h': 3600 * 1000,
  '1d': 24 * 3600 * 1000,
}

module.exports = function (fileName, period) {
  const filePath = path.join(__dirname, fileName)
  const fileContent = fs.readFileSync(filePath).toString()
  const csvList = fileContent.split('\n')
  csvList.pop() // 最后一行为空, 去掉
  const list = csvList.map(row => {
    const splitList = row.split(',')
    let timestamp = splitList[0]
    // origin data is close time, transfer to start time
    // to same with TV
    timestamp = (new Date(new Date(timestamp) - PRIOD_MIS[period])).toISOString()
    return {
      timestamp,
      open: +splitList[1],
      high: +splitList[2],
      low: +splitList[3],
      close: +splitList[4],
      size: +splitList[5]
    }
  })
  return list
}
