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


const arrayToCSV = (arr, delimiter = ',') => {
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
    const { wined, minute, profit, price } = t
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
    const pfp = profit / price
    let pfp_r = pfp + 0.9985
    const amount = Math.abs(t.amount)
    if (!isNaN(amount)) {
      const baseAmount = 1
      const pp = amount / baseAmount
      pfp_r = pfp + 1 - 0.0015 * pp
    }
    let margin = 1
    if (i > 0) {
      const pre = tradeEarnList[i - 1]
      margin = pre.margin * pfp_r
    }
    tradeEarnList.push({
      st: (t.startTime || t.timestamp) && new Date(t.startTime || t.timestamp).toISOString(),
      pf: netProfit,
      pfp,
      pfp_r,
      bk: backList[backList.length - 1] || 0,
      margin,
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

function findIndexByTime(data, time) {
  const len = data.length
  time = +new Date(time)
  for (let i = 0; i < len; i++) {
    const b = data[i]
    if (+new Date(b.timestamp) === time) {
      return i
    }
  }
}

function timeToSeries(data, list) {
  return list.map(r => {
    return r.map(t => typeof t === 'string' ? findIndexByTime(data, t) : t)
  })
}

module.exports = {
  arrayToCSV,
  JSONtoCSV,
  statisticTrades,
  timeToSeries
}

