
const path = require('path')
const fs = require('fs')

module.exports = function(fileName) {
  const filePath = path.join(__dirname, fileName)
  const fileContent = fs.readFileSync(filePath).toString()
  const csvList = fileContent.split('\n')
  csvList.pop() // 最后一行为空, 去掉
  const list = csvList.map(row => {
    const splitList = row.split(',')
    return {
      timestamp: splitList[0],
      open: +splitList[1],
      high: +splitList[2],
      low: +splitList[3],
      close: +splitList[4],
      volume: +splitList[5]
    }
  })
  return list
}
