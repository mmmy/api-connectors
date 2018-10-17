var technicalindicators = require('technicalindicators')
var RSI = technicalindicators.RSI
var BB = technicalindicators.BollingerBands
var MACD = technicalindicators.MACD
var SMA = technicalindicators.SMA
var PSAR = require('../lib/PSAR').PSAR
// var jStat = require('jStat')

function parseKline(kline) {
    // okex
    var T = [],
        O = [],
        H = [],
        L = [],
        C = [],
        V = []

    kline.forEach(item => {
        T.push(item.timestamp)
        O.push(parseFloat(item.open))
        H.push(parseFloat(item.high))
        L.push(parseFloat(item.low))
        C.push(parseFloat(item.close))
        V.push(parseFloat(item.size))
    })

    return { T, O, H, L, C, V }
}
// [{MACD: ,histogram: , signal: }]
exports.MacdSignal = function (kline) {
    const { C } = parseKline(kline)
    const result = MACD.calculate({
        values: C,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    })
    var lastVs = result.slice(-10)
    return lastVs
}

exports.BBSignalSeries = function(kline) {
    const { T, O, H, L, C, V } = parseKline(kline)
    const result = BB.calculate({ period: 20, values: C, stdDev: 2 })
    const rLen = result.length
    const hLen = H.length
    const lLen = L.length
    const signals = [] // 1: top, 0: middle, -1: bottom
    const maxLen = Math.min(100, rLen) // 只导出最近的100条
    // 注意要从最后往前遍历
    for (var i = 1; i <= maxLen; i++) {
        const r = result[rLen - i]
        const high = H[hLen - i]
        const low = L[lLen - i]
        let v = 0
        if (high > r.upper) {
            v = 1
        } else if (low < r.lower) {
            v = -1
        }
        signals.unshift(v)
    }
    return {
        signals
    }
}

exports.BollingerBandsSignal = function (kline) {
    const { T, O, H, L, C, V } = parseKline(kline)
    const result = BB.calculate({ period: 20, values: C, stdDev: 2 })
    const lastResult = result.slice(-1)[0] || {}
    const date = T.slice(-1)[0]
    const lastH = H.slice(-1)[0]
    const lastL = L.slice(-1)[0]
    const lastC = C.slice(-1)[0]
    const long = lastH > lastResult.upper
    const short = lastL < lastResult.lower
    // console.log(result.slice(result.length - 4))
    return {
        long,
        short,
        date,
        price: lastC,
    }
}
// 注意最好是200条k线以上
exports.RSI = function (kline, len=14) {
    const { T, O, H, L, C, V } = parseKline(kline)
    var result = RSI.calculate({ values: C, period: len })
    const lastVs = result
    return lastVs
    // console.log(result.slice(result.length - 10))
}
// 200条K线以上？？
exports.PasrSignal = function (kline, start=0.02, step=0.02, max=0.11) {
    const { T, O, H, L, C, V } = parseKline(kline)

    const psar = new PSAR({ high: H, low: L, start, step, max }) // 0.11-0.13效果好
    const result = psar.getResult()

    const len = result.length
    const signalLen = 100
    const signals = []
    for (var i = len - signalLen; i < len; i++) {
        signals.push(C[i] > result[i])
    }
    return {
        signals
    }
}

function SMA(kline, period) {
    const { T, O, H, L, C, V } = parseKline(kline)
    const result = SMA.calculate({ period, values: C })
    return result
}

// fastLen: 20, slowLen: 20
exports.SmaSignal = function(kline, fastLen, slowLen) {
    const { T, O, H, L, C, V } = parseKline(kline)
    const fastResult = SMA.calculate({ period: fastLen, values: C }).reverse()
    const slowResult = SMA.calculate({ period: slowLen, values: C }).reverse()
    const len = Math.min(slowResult.length, fastResult.length)
    const signals = []
    const slowS = []
    const fastS = []
    const diff = []
    // slow len 和 fast len 不一样， 所以要从最后还是遍历
    for (var i = 0; i < len - 1; i++) {
        // 快线 在 慢线之上 -》 long
        signals.unshift(fastResult[i] > slowResult[i])
        slowS.unshift(slowResult[i] > slowResult[i + 1])
        fastS.unshift(fastResult[i] > fastResult[i + 1])
        diff.unshift(fastResult[i] - slowResult[i])
    }
    return {
        signals,
        slowS,
        fastS,
        diff,
    }
}
// 效率比上面高25%
exports.SmaCross = function(kline, fastLen, slowLen) {
    const dataLen = kline.length
    const startSlowIndex = dataLen - slowLen - 1
    const startFastIndex = dataLen - fastLen - 1
    let sumFast = 0
    let sumSlow = 0
    for (let i = startSlowIndex; i < dataLen - 1; i++) {
        const { close } = kline[i]
        sumSlow += close
        if (i >= startFastIndex) {
            sumFast += close
        }
    }
    const lastClose = kline[dataLen - 1].close
    const slowMa1 = sumSlow / slowLen,
          slowMa = (sumSlow - kline[dataLen - slowLen - 1].close + lastClose) / slowLen,
          fastMa1 = sumFast / fastLen,
          fastMa = (sumFast - kline[dataLen - fastLen - 1].close + lastClose) / fastLen

    return {
        goldCross: fastMa > slowMa && fastMa1 <= slowMa1,
        deadCross: fastMa < slowMa && fastMa1 >= slowMa1,
        fastMa
    }
}

function SmaValue(kline, smaLen) {
    const { T, O, H, L, C, V } = parseKline(kline)
    const closeLen = C.length
    let sum = 0
    const startIndex = closeLen - smaLen
    for (let i = startIndex; i < closeLen; i++) {
        sum += C[i]
    }
    const avg = sum / smaLen
    const lastPrice = C[closeLen - 1]
    return { avg, lastClose: lastPrice }
}
exports.SmaValue = SmaValue

// 判断价格(一般是close)是否在均线之上
exports.PriceAboveSma = function(kline, smaLen) {
    const { avg, lastClose } = SmaValue(kline, smaLen)
    return lastClose > avg
}

// 模仿TradingView barssince, list的length 一般100, true false list
exports.barssince = function(list, long) {
    const len = list.length
    let index = -1
    for (var i = len - 1; i >= 0; i--) {
        // 第一个满足条件的
        if (list[i] == long) {
            index = i
            break
        }
    }
    // 如果第一个bar 就满足了， 那么返回1
    return len - index
}
// 最近第二次出现
exports.barssince2 = function(list, long) {
    const len = list.length
    let index = -1
    let fisrtFond = false
    for (var i = len - 1; i > 0; i--) {
        var pre = list[i - 1]
        if (fisrtFond) {
            if (list[i] != long && pre == long) {
                index = i - 1
                break
            }
        } else {
            if (list[i] == long && pre != long) {
                fisrtFond = true
            }
        }
    }
    return len - index
}

exports.highestLowestClose = function(kline, barsLen) {
    const len = kline.length
    const endIndex = len - barsLen
    let maxClose = kline[len - 1].close
    let minClose = kline[len - 1].close
    for (var i = len - 2; i >= endIndex; i--) {
        const close = kline[i].close
        maxClose = Math.max(close, maxClose)
        minClose = Math.min(close, minClose)
    }
    return {
        minClose,
        maxClose
    }
}

exports.highestLowestHighLow = function(kline, barsLen) {
    const len = kline.length
    const endIndex = len - barsLen
    let maxHigh = kline[len - 1].high
    let minLow = kline[len - 1].low
    for (var i = len - 2; i >= endIndex; i--) {
        const h = kline[i].high
        const l = kline[i].low
        maxHigh = Math.max(h, maxHigh)
        minLow = Math.min(l, minLow)
    }
    return {
        maxHigh,
        minLow
    }
}
