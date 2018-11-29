const JSONtoCSV = (arr, columns, delimiter = ',') =>
  [
    // columns.join(delimiter),
    ...arr.map(obj =>
      columns.reduce(
        (acc, key) => `${acc}${!acc.length ? '' : delimiter}${typeof obj[key] === 'undefined' ? '' : obj[key]}`,
        ''
      )
    )
  ].join('\n');


const arrayToCSV = (arr, delimiter=',') => {
  return arr.map(item => item.join(delimiter)).join('\n')
}
// 統計
const statisticTrades = function (trades) {
  const touchedTrades = trades.filter(t => t.touched)
  let netProfit = 0,
    winRate = 0,
    total = trades.length,
    touchedTotal = touchedTrades.length,
    maxBack = 0,
    avgHoldMinute = 0,
    tradeEarnList = []

  let wins = 0
  let sumMinute = 0
  let backList = [0]
  touchedTrades.forEach((t, i) => {
    const { wined, minute, profit } = t
    if (wined) {
      wins++
    }
    sumMinute += minute
    netProfit += profit

    if (i > 0) {
      let backLen = backList.length
      let back = backList[backLen - 1] + profit
      back = Math.min(0, back)
      backList.push(back)
    }
    tradeEarnList.push({
      st: new Date(t.startTime).toISOString(),
      pf: netProfit,
      bk: backList[backList.length - 1] || 0,
    })
  })
  maxBack = Math.min.apply(null, backList)
  winRate = (wins / touchedTotal).toFixed(4)
  avgHoldMinute = Math.round(sumMinute / touchedTotal)

  return {
    total,
    touchedTotal,
    touchedRate: touchedTotal / total,
    netProfit,
    winRate,
    maxBack,
    avgHoldMinute,
    tradeEarnList,
  }
}

module.exports = {
  arrayToCSV,
  JSONtoCSV,
  statisticTrades
}

