const path = require('path')
const fs = require('fs')
const JSONtoCSV = require('../utils').JSONtoCSV
const statisticTrades = require('../utils').statisticTrades

const file = 'benchmark.json'

const filePath = path.join(__dirname, file)
const fileConent = fs.readFileSync(filePath).toString()
const dataList = JSON.parse(fileConent)
// 比如每當一次损失后 开始执行策略
function filterTrades(trades) {
  const newTrades = []
  const len = trades.length
  let preIsPushed = false
  for (let i = 3; i < len; i++) {
    const pre2 = trades[i - 3]
    const pre1 = trades[i - 2]
    const pre = trades[i - 1]
    // 胜率62.75, 最大回撤-180, netProfit: 614
    // if (pre2.wined && pre1.wined && !pre.wined) {
    //   newTrades.push(trades[i])
    // }
    const t = trades[i]
    // 胜率56.8, 最大回撤-239, netProfit: 1362,
    if (preIsPushed) {
      newTrades.push(t)
      if (!pre.wined) {
        preIsPushed = false
      }
    } else {
      if (!pre1.wined && !pre.wined) {
        newTrades.push(t)
        preIsPushed = true
      }
    }
  }
  return newTrades
}

dataList.map((t, i) => {
  const { id, trades } = t
  const saveName = `filter_${id || (i + 1)}.csv`
  const savePath = path.join(__dirname, saveName)
  const newTrades = filterTrades(trades)
  const statistic = statisticTrades(newTrades)
  console.log(statistic)
  const dataToCsv = JSONtoCSV(statistic.tradeEarnList, ['st', 'pf', 'bk'])
  fs.writeFileSync(savePath, dataToCsv)
})

