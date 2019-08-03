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
    avgHoldBars = 0,
    tradeEarnList = [],
    winProfitSum = 0,
    loseProfitSum = 0,
    maxAmount = 0

  let wins = 0
  let sumMinute = 0
  let sumBars = 0
  let backList = [0]
  let ppBackList = [0]
  // let compound_pr = 1 //复利计算

  touchedTrades.forEach((t, i) => {
    const { wined, minute, profit, price, holdBars, amount } = t
    if (profit > 0) {
      if (!wined) {
        throw new Error('profit > 0 but wined is false ?')
      }
      wins++
      winProfitSum += profit
    } else {
      loseProfitSum += profit
    }

    maxAmount = Math.max(maxAmount, Math.abs(amount))
    sumMinute += minute
    netProfit += profit
    sumBars += holdBars

    if (i > 0) {
      let backLen = backList.length
      let back = backList[backLen - 1] + profit
      back = Math.min(0, back)
      backList.push(back)
    }
    const pfp = profit / price
    let pfp_r = pfp + 0.9985
    const amountAbs = Math.abs(t.amount)
    if (!isNaN(amountAbs)) {
      const baseAmount = 1
      const pp = amountAbs / baseAmount
      pfp_r = pfp + 1 - 0.0015 * pp
    }
    let margin = 1
    if (i > 0) {
      const pre = tradeEarnList[i - 1]
      margin = pre.margin * pfp_r

      let pBackLen = ppBackList.length
      const profitP = pfp_r - 1
      let pBack = ppBackList[pBackLen - 1] + profitP
      pBack = Math.min(0, pBack)
      ppBackList.push(pBack)
    }
    tradeEarnList.push({
      st: (t.startTime || t.timestamp) && new Date(t.startTime || t.timestamp).toISOString(),
      pf: netProfit,
      pfp,
      pfp_r,
      bk: backList[backList.length - 1] || 0,
      pp_bk: ppBackList[ppBackList.length - 1] || 0,
      margin,
    })
  })
  maxBack = Math.min.apply(null, backList)
  winRate = (wins / touchedTotal).toFixed(4)
  avgHoldMinute = Math.round(sumMinute / touchedTotal)
  avgHoldBars = sumBars / touchedTotal

  const winTotalBars = touchedTrades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.holdBars, 0)
  const loseTotalBars = touchedTrades.filter(t => t.profit < 0).reduce((sum, t) => sum + t.holdBars, 0)

  return {
    total,
    touchedTotal,
    touchedRate: touchedTotal / total,
    wins,
    loses: touchedTotal - wins,
    netProfit,
    winRate,
    maxBack,
    avgHoldMinute,
    tradeEarnList,
    avgHoldBars,
    avgWinHoldBars: winTotalBars / wins,
    avgLoseHoldBars: loseTotalBars / (touchedTotal - wins),
    winProfitSum,
    loseProfitSum,
    profitScore: Math.abs(winProfitSum / loseProfitSum),
    maxAmount,
    avgProfit: netProfit / touchedTotal,
    avgWinProfit: winProfitSum / wins,
    avgLoseProfit: loseProfitSum / (touchedTotal - wins),
  }
}

const statisticTradesReport = function (trades) {
  const longTrades = trades.filter(t => t.amount < 0)
  const shortTrades = trades.filter(t => t.amount > 0)
  const all = statisticTrades(trades)
  const long = statisticTrades(longTrades)
  const short = statisticTrades(shortTrades)
  return {
    all,
    long,
    short,
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
  statisticTradesReport,
  timeToSeries
}

