const fs = require('fs')
const request = require('request')
const path = require('path')
const querystring = require('querystring')

const httpClient = require('../../httpClient')
const BASE_URL = 'https://api.binance.com/api/v1'

function formatGetParams(params, defaultParams) {
  params = {
    ...defaultParams,
    ...params
  }
  return querystring.stringify(params)
}
function createUrl(path, query) {
  return BASE_URL + path + (query ? `?${query}` : '')
}
function getTradeHistory(params) {
  var path = '/klines'
  var pStr = formatGetParams(params)
  var url = createUrl(path, pStr)
  return httpClient.get(url)
}

const sizeToMilSec = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '1h': 3600 * 1000
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
  const json = await getTradeHistory(params)
  const dataList = JSON.parse(json)
  if (Array.isArray(dataList)) {
    // 源数据为[t, o, h, l, c, v] => [isoT, o, h, l, c, v]
    return dataList.map(item => [new Date(item[0]).toISOString(), item[1], item[2], item[3], item[4], item[5]])
  } else {
    throw dataList
  }
}

function sleep(sec) {
  return new Promise(resolve => {
    setTimeout(() => {}, sec * 1000)
  })
}

const arrayToCSV = require('../utils').arrayToCSV

const CONFIG = {
  prefix: 'binace_',
  symbol: 'ETHUSDT',
  count: 1000,
  binSize: '5m',
  startDate: '2017-09-01',
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
  const dataToCsv = arrayToCSV(list)
  fs.appendFileSync(fileName, dataToCsv + '\n')
  const sec = (new Date() - d0) / 1000
  console.log('end save to file, second:', sec)
}

async function run() {
  let offset = 0
  let hasNewData = new Date(lastTimestamp) < (new Date() - sizeToMilSec[CONFIG.binSize])
  if (!hasNewData) {
    console.log('has no new data, exit')
  }
  let dataList = []
  while(hasNewData) {
    const remains = Math.floor(remainBars(lastTimestamp, CONFIG.binSize))
    console.log('remain:', remains, 'request:', Math.ceil(remains / CONFIG.count))
    if (remains === 0) {
      console.log('remain is 0, finished')
      break
    }
    let startTime = new Date(new Date(lastTimestamp) - offset + sizeToMilSec[CONFIG.binSize])
    try {
      const list = await requestData({
        symbol: CONFIG.symbol,
        startTime: +startTime,
        limit: CONFIG.count,
        interval: CONFIG.binSize
      })
      const len = list.length
      if (len === 0) {
        console.log('data len is 0, finished')
        break
      }
      // console.log(dataToCsv)
      hasNewData = len === CONFIG.count
      lastTimestamp = list[len - 1][0]
      dataList = dataList.concat(list)
      if (dataList.length > 2E3) {
        saveToFile(dataList)
        dataList = []
      }
      sleep(1)
    } catch (e) {
      console.log('error ... sleep 5')
      sleep(5)
    }
  }

  if (dataList.length > 0) {
    saveToFile(dataList)
    dataList = []
  }
}

run()
// console.log(data)