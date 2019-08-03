const puppeteer = require('puppeteer-core')
const path = require('path')
// const echarts = require('echarts')
const args = require('yargs').argv

const dir = args.dir

if (!dir) {
  console.log('need a dir')
  return
}

async function launchBrowser() {
  return await puppeteer.launch({
    headless: true,
    executablePath: 'F:/chrome-win/chrome.exe',
    // defaultViewport: {
    //   width: 1500,
    //   height: 1000,
    // },
    // args: [`--window-size=${1500},${1000}`] // new option
  })
}

async function run() {
  const filePath = path.join(__dirname, dir, 'index.html')
  const browser = await launchBrowser()
  const page = await browser.newPage()
  await page.goto(filePath)
  await page.pdf({
    path: path.join(__dirname, dir, 'report.pdf'),
    format: 'A4',
  })
  await browser.close()
  console.log(filePath)
}

try {
  run()
} catch(e) {
  console.log(e)
}