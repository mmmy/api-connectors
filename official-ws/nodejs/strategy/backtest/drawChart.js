
const { getHistoryData } = require('./data/xbt5m')
const puppeteer = require('puppeteer-core')

async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'F:/chrome-win32/chrome.exe'
  })
  return browser
}

function drawKline({ symbol, period }) {
  const data = getHistoryData(symbol, period)
  const browser = launchBrowser()
}

module.exports = {
  drawKline
}

drawKline({
  symbol: 'XBTUSD',
  period: '5m',
})
