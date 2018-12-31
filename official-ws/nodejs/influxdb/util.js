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

function statisticPositions(positions) {
  const list = positions.map(item => {
    const t = new Date(item.t)
    const p = item.p
    const side = item.side

    const afterPs = item.afterPs
    let maxPTrade = null
    let minPTrade = null

    let levelsTime = []
    const levelsPrice = []
    for (let i=1; i<7; i++) {
      levelsPrice.push(side > 0 ? (p + 0.5 * i) : (p - 0.5 * i))
    }

    for (let i = 0; i < afterPs.length; i++) {
      const tr = afterPs[i]
      // max
      if (!maxPTrade) {
        maxPTrade = tr
      } else {
        if (tr.price > maxPTrade.price) {
          maxPTrade = tr
        }
      }
      // min
      if (!minPTrade) {
        minPTrade = tr
      } else {
        if (tr.price < minPTrade.price) {
          minPTrade = tr
        }
      }
      // p level time
      // 首次达到价格的时间差
      const index = levelsPrice.indexOf(tr.price)
      if (index > -1 && levelsTime[index] === undefined) {
        levelsTime[index] = (new Date(tr.timestamp) - t) / 1000
      }
    }

    const lastTrade = item.afterPs[item.afterPs.length - 1]
    let lastPrice = null
    let profit = null
    if (lastTrade) {
      lastPrice = lastTrade.price
      profit = side > 0 ? (lastPrice - item.p) : (item.p - lastPrice)
    }

    const diffHigh = maxPTrade.price - item.p
    const diffLow = minPTrade.price - item.p
    return {
      ...item,
      diffHigh,
      timeHigh: (new Date(maxPTrade.timestamp) - t) / 1000,
      diffLow,
      lastPrice,
      profit,
      timeLow: (new Date(minPTrade.timestamp) - t) / 1000,
      levelsTime1: levelsTime[0],
      levelsTime2: levelsTime[1],
      levelsTime3: levelsTime[2],
      levelsTime4: levelsTime[3],
      levelsTime5: levelsTime[4],
      levelsTime6: levelsTime[5],
    }
  })
  const sumHigh = list.reduce((s, item) => s + item.diffHigh, 0)
  const avgHigh = sumHigh / list.length
  const timeSumHigh = list.reduce((s, item) => s + item.timeHigh, 0)
  const timeAvgHigh = timeSumHigh / list.length

  const sumLow = list.reduce((s, item) => s + item.diffLow, 0)
  const avgLow = sumLow / list.length
  const timeSumLow = list.reduce((s, item) => s + item.timeLow, 0)
  const timeAvgLow = timeSumLow / list.length

  const sumProfit = list.reduce((s, item) => s + item.profit, 0)
  const avgProfit = sumProfit / list.length
  return {
    list,
    sumHigh,
    avgHigh,
    timeSumHigh,
    timeAvgHigh,
    sumLow,
    avgLow,
    timeSumLow,
    timeAvgLow,
    sumProfit,
    avgProfit,
  }
}

module.exports = {
  JSONtoCSV,
  statisticPositions
}
