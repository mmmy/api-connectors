// 检查时间
const path = require('path')
const fs = require('fs')

const file = process.argv[2]
if (!file) {
  console.error('need a file')
  process.exit(1)
}

const checkData = function(list) {
  var timeIntervals = []
  var len = list.length
  for(var i=1; i<len; i++) {
    var interval = new Date(list[i].timestamp) - new Date(list[i - 1].timestamp)
    if (interval < 0) {
      console.log(list[i - 1])
      console.log(list[i])
      return '顺序不对'
    }
    if (timeIntervals.length > 0 && interval !== timeIntervals[timeIntervals.length - 1]) {
      console.log(list.slice(-2))
      return 'list 时间序列不合法'
    }
    timeIntervals.push(interval)
  }
}

const filePath = path.join(__dirname, file)
const fileConent = fs.readFileSync(filePath).toString()
const csvList = fileConent.split('\n')
csvList.pop() // 最后一行为空, 去掉
const len = csvList.length
console.log('length:', len)

const list = csvList.map(row => {
  const splitList = row.split(',')
  return {
    timestamp: splitList[0]
  }
})

const result = checkData(list)
if (result) {
  console.log(result)
  process.exit(1)
} else {
  console.log('OK')
  process.exit(0)
}
