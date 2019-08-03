const Mustache = require('mustache')
const path = require('path')
const fs = require('fs')

const templateFile = 'report-template.mustache'

const filePath = path.join(__dirname, templateFile)

const template = fs.readFileSync(filePath).toString()

function formatValue(key, value) {
  let color = ''
  let newV = value
  switch (key) {
    case 'netProfit':
    case 'winProfitSum':
    case 'loseProfitSum':
    case 'maxBack':
    case 'avgProfit':
    case 'avgWinProfit':
    case 'avgLoseProfit':
      newV = `$${value.toFixed(2)}`
      color = value < 0 ? 'red' : ''
      break
    case 'winRate':
    case 'maxAmount':
      newV = `${(value * 100).toFixed(2)}%`
      break

    default:
      break
  }
  return { value: newV, color }
}

const KEY_MAP = {
  netProfit: { name: '净利润' },
  winProfitSum: { name: '毛利润' },
  loseProfitSum: { name: '毛亏损' },
  maxBack: { name: '最大回撤' },
  profitScore: { name: '盈利因子' },
  maxAmount: { name: '最大持仓' },
  touchedTotal: { name: '所有已平仓交易' },
  wins: { name: '获利交易次数' },
  loses: { name: '亏损交易次数' },
  winRate: { name: '胜率' },
  avgProfit: { name: '平均交易' },
  avgWinProfit: { name: '平均盈利交易' },
  avgLoseProfit: { name: '平均亏损交易' },
  avgHoldBars: { name: '全部交易的平均持仓K线根数' },
  avgWinHoldBars: { name: '盈利交易的平均持仓K线根数' },
  avgLoseHoldBars: { name: '亏损交易的平均持仓K线根数' },
}
const KEYS = [
  'netProfit', 'winProfitSum', 'loseProfitSum', 'maxBack',
  'profitScore', 'maxAmount', 'touchedTotal', 'wins', 'loses',
  'winRate', 'avgProfit', 'avgWinProfit', 'avgLoseProfit',
  'avgHoldBars', 'avgWinHoldBars', 'avgLoseHoldBars',
]
// console.log(template)
function convertData(reportData) {
  const { id, report } = reportData
  const { all, long, short } = report
  const items = KEYS.map(key => {
    const allDataV = formatValue(key, all[key])
    const longDataV = formatValue(key, long[key])
    const shortDataV = formatValue(key, short[key])
    return {
      name: KEY_MAP[key].name,
      all: allDataV.value,
      all_color: allDataV.color,
      long: longDataV.value,
      long_color: longDataV.color,
      short: shortDataV.value,
      short_color: shortDataV.color,
    }
  })
  return {
    ...reportData,
    title: id,
    items,
  }
}

function saveHtml(reportData, path) {
  const data = convertData(reportData)
  const result = Mustache.render(template, data)
  // const savePath = path.join(__dirname, `report-${data.title}-${new Date().toLocaleDateString()}.html`)
  fs.writeFileSync(path, result)
  // return savePath
}

module.exports = {
  saveHtml
}