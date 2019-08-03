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
  netProfit: { name: '' },
  winProfitSum: { name: '' },
  loseProfitSum: { name: '' },
  maxBack: { name: '' },
  profitScore: { name: '' },
  maxAmount: { name: '' },
  touchedTotal: { name: '' },
  wins: { name: 'wins' },
  loses: { name: '' },
  winRate: { name: 'winRate' },
  avgProfit: { name: '' },
  avgWinProfit: { name: '' },
  avgLoseProfit: { name: '' },
  avgHoldBars: { name: '' },
  avgWinHoldBars: { name: '' },
  avgLoseHoldBars: { name: '' },
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
    title: id,
    items,
  }
}

function saveHtml(reportData) {
  const data = convertData(reportData)
  const result = Mustache.render(template, data)
  const savePath = path.join(__dirname, `report-${data.title}-${new Date().toLocaleDateString()}.html`)
  fs.writeFileSync(savePath, result)
  return savePath
}

module.exports = {
  saveHtml
}