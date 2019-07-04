const fs = require('fs')
const BitmexSdk = require('../../bitmexSdk')
const path = require('path')
const execSync = require('child_process').execSync
const args = require('yargs').argv

const BinSize = args.b || '5m'
const symbol = args.s || 'XBTUSD'

const sizeToMilSec = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '1h': 3600 * 1000,
  '1d': 24 * 3600 * 1000
}

function remainBars(lastTime, binSize) {
  const milSec = new Date() - new Date(lastTime)
  return milSec / sizeToMilSec[binSize]
}
/*{
  "timestamp":"2017-11-11T01:00:00.000Z",
  "symbol":"XBTUSD",
  "open":6721.5,
  "high":6760.5,
  "low":6712,
  "close":6754,
  "trades":1566,
  "volume":8244099,
  "vwap":6738.5445,
  "lastSize":9990,
  "turnover":122343427819,
  "homeNotional":1223.4342781900002,
  "foreignNotional":8244099
}*/
async function requestData(params) {
  const json = await BitmexSdk.getTradeHistory(params)
  const dataList = JSON.parse(json)
  if (Array.isArray(dataList)) {
    return params.reverse ? dataList.reverse() : dataList
  } else {
    throw dataList
  }
}

function sleep(sec) {
  return new Promise(resolve => {
    setTimeout(() => { }, sec * 1000)
  })
}

const JSONtoCSV = require('../utils').JSONtoCSV

const CONFIG = {
  prefix: '',
  symbol: symbol,
  count: 200,
  binSize: BinSize,
  startDate: symbol === 'XBTUSD' ? '2017-09-01' : '2018-08-03',
  columns: ['timestamp', 'open', 'high', 'low', 'close', 'volume'],
  reverse: true,
}

if (BinSize === '1m') {
  CONFIG.startDate = symbol === 'XBTUSD' ? '2017-09-01' : '2018-08-03'
  CONFIG.count = 200
  CONFIG.reverse = false
}

if (BinSize === '1h') {
  CONFIG.startDate = symbol === 'XBTUSD' ? '2017-06-01' : '2018-08-03'
  CONFIG.count = 100
}

if (BinSize === '1d') {
  CONFIG.startDate = symbol === 'XBTUSD' ? '2017-04-01' : '2018-08-03'
  CONFIG.count = 10
  CONFIG.reverse = false
}

const fileName = `${CONFIG.prefix}${CONFIG.symbol}_${CONFIG.binSize}_${CONFIG.startDate}.csv`
const filePath = path.join(__dirname, fileName)
let lastTimestamp = CONFIG.startDate + 'T00:00:00.000Z' // ISO time
// init request start time
if (fs.existsSync(filePath)) {
  const fileContent = fs.readFileSync(filePath).toString()
  const csvList = fileContent.split('\n')
  const len = csvList.length
  if (len > 0) {
    const last = csvList[len - 2]
    if (last) {
      const timestamp = last.split(',')[0]
      lastTimestamp = timestamp
      console.log('lastTimestamp => ', timestamp)
    }
  }
}
// 写入文件
function saveToFile(list) {
  const d0 = new Date()
  console.log('start save to file')
  const dataToCsv = JSONtoCSV(list, CONFIG.columns)
  fs.appendFileSync(fileName, dataToCsv + '\n')
  const sec = (new Date() - d0) / 1000
  console.log('end save to file, second:', sec)
}

function checkDataFile() {
  execSync(`node check_data.js ./${fileName}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    stdout && console.log(`stdout: ${stdout}`)
    stderr && console.log(`stderr: ${stderr}`)
  })
}

async function run() {
  let offset = 3540300000
  if (BinSize === '1m') {
    offset = 0
  }
  if (BinSize === '1h') {
    offset = 42843600000
  }
  if (BinSize === '1d') {
    offset = 0
  }
  let hasNewData = new Date(lastTimestamp) < (new Date() - sizeToMilSec[CONFIG.binSize])
  if (!hasNewData) {
    console.log('has no new data, exit')
    // checkDataFile()
  }
  let dataList = []
  while (hasNewData) {
    const remains = Math.floor(remainBars(lastTimestamp, CONFIG.binSize))
    console.log('remain:', remains, 'request:', Math.ceil(remains / CONFIG.count))
    if (remains === 0) {
      console.log('remain is 0, finished')
      // checkDataFile()
      break
    }
    let startTime = new Date(new Date(lastTimestamp) - offset + sizeToMilSec[CONFIG.binSize]).toISOString()
    let list = []
    try {
      list = await requestData({
        symbol: CONFIG.symbol,
        binSize: CONFIG.binSize,
        count: CONFIG.count,
        reverse: CONFIG.reverse,
        startTime
      })
    } catch (e) {
      console.log(e)
      console.log('continue...')
      continue
    }
    const len = list.length
    if (len === 0) {
      console.log('data len is 0, finished')
      break
    }
    // console.log(dataToCsv)
    hasNewData = len === CONFIG.count
    lastTimestamp = list[len - 1].timestamp
    dataList = dataList.concat(list)
    if (dataList.length > (BinSize === '1d' ? 50 : 5E2)) {
      saveToFile(dataList)
      dataList = []
    }
    sleep(1)
  }

  if (dataList.length > 0) {
    saveToFile(dataList)
    dataList = []
  }
}

run()

// console.log(data)