
const BitmexSdk = require('../strategy/bitmexSdk')
const { BitmexKlineDB } = require('./db')
const sizeToMilSec = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '1h': 3600 * 1000
}
async function requestData(params) {
  const json = await BitmexSdk.getTradeHistory(params)
  const dataList = JSON.parse(json)
  if (Array.isArray(dataList)) {
    return dataList.reverse()
  } else {
    throw dataList
  }
}

function getKlines(binSize, startTime) {
  // 交易所有bug
  const timeOffset = new Date('2018-12-10T00:00:00.000Z') - new Date('2018-12-17T19:31:00.000Z')
  const params = {
    symbol: 'XBTUSD',
    count: 750,
    binSize: binSize,
    reverse: true,
    startTime: (new Date(+new Date(startTime) + timeOffset)).toISOString(),
  }
  return requestData(params)
}

async function getDBLastKlineTime(binSize) {
  const rows = await BitmexKlineDB.getLastKline(binSize)
  return rows.length > 0 ? rows[0].time : ''
}

async function main() {
  const binSize = '1m'

  const defaultStartTime = '2018-12-20T00:00:00.000Z'
  let startTime = await getDBLastKlineTime(binSize) || defaultStartTime
  let hasNewData = () => {
    return new Date() > (+new Date(startTime) + 300 * 1000)
  }
  while (hasNewData()) {
    let klines = await getKlines(binSize, startTime)
    if (klines.length === 0) {
      console.log('length === 0')
      break
    }
    klines = klines.filter(k => new Date(k.timestamp) >= new Date(startTime))
    if (+new Date(klines[0].timestamp) !== +new Date(startTime)) {
      console.log('time is not right exit!', klines[0].timestamp)
      break
    }
    const res = await BitmexKlineDB.writeKline(binSize, klines)
    console.log(res)
    startTime = await getDBLastKlineTime(binSize)
    console.log(startTime)
  }
  console.log('finish')
}

main()