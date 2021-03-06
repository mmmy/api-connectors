var technicalindicators = require('technicalindicators')
var RSI = technicalindicators.RSI
var BB = technicalindicators.BollingerBands
var MACD = technicalindicators.MACD
var SMA = technicalindicators.SMA
var EMA = technicalindicators.EMA
var PSAR = require('../lib/PSAR').PSAR
var StochasticRsi = technicalindicators.StochasticRSI
var Stochastic = technicalindicators.Stochastic
var ADX = technicalindicators.ADX
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
        V.push(parseFloat(item.volume))
    })

    return { T, O, H, L, C, V }
}

//[{ adx, mdi, pdi }]
exports.ADXSignal = function (kline, len = 14) {
    const { C, H, L } = parseKline(kline)
    return ADX.calculate({
        close: C,
        high: H,
        low: L,
        period: len,
    })
}
// [{MACD: ,histogram: , signal: }]
exports.MacdSignal = function (kline, fastLen = 12, slowLen = 26, signalLen = 9) {
    const { C } = parseKline(kline)
    const result = MACD.calculate({
        values: C,
        fastPeriod: fastLen,
        slowPeriod: slowLen,
        signalPeriod: signalLen,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    })
    var lastVs = result.slice(-200)
    return lastVs
}

exports.calcBB = function (kline, period = 20, stdDev = 2) {
    const { T, O, H, L, C, V } = parseKline(kline)
    const result = BB.calculate({ period, values: C, stdDev })
    return result
}

exports.BBSignalSeries = function (kline) {
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
exports.RSI = function (kline, len = 14, useValues) {
    const { T, O, H, L, C, V } = parseKline(kline)
    let values = C
    if (useValues) {
        values = useValues({O,H,L,C,V})
    }
    var result = RSI.calculate({ values, period: len })
    const lastVs = result
    return lastVs
    // console.log(result.slice(result.length - 10))
}

exports.StochasticRsi = function (kline, rsiPeriod = 14, stochasticPeriod = 14, kPeriod = 3, dPeriod = 3) {
    const { T, O, H, L, C, V } = parseKline(kline)
    var result = StochasticRsi.calculate({
        values: C,
        rsiPeriod,
        stochasticPeriod,
        kPeriod,
        dPeriod,
    })
    return result
}
// 注意在tradingview中的k对应这里的d, sma(d, N)之后才是tradingview的d
exports.StochKD = function (kline, period = 9, signalPeriod = 3) {
    const { T, O, H, L, C, V } = parseKline(kline)
    var result = Stochastic.calculate({
        high: H,
        low: L,
        close: C,
        period,
        signalPeriod,
    })
    return result  //[{k, d}]
}

exports.EMA = function (kline, len = 20) {
    const { T, O, H, L, C, V } = parseKline(kline)
    var result = EMA.calculate({
        values: C,
        period: len,
    })
    return result
}

// 200条K线以上？？
exports.PasrSignal = function (kline, start = 0.02, step = 0.02, max = 0.11) {
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

// function SMA(kline, period) {
//     const { T, O, H, L, C, V } = parseKline(kline)
//     const result = SMA.calculate({ period, values: C })
//     return result
// }

exports.VolSMA = function (kline, period) {
    kline = kline.slice(-period * 2)
    const { T, O, H, L, C, V } = parseKline(kline)
    const result = SMA.calculate({ period, values: V })
    return result
}

exports.VolEMA = function (kline, period) {
    kline = kline.slice(-period * 2)
    const { T, O, H, L, C, V } = parseKline(kline)
    const result = EMA.calculate({ period, values: V })
    return result
}

// fastLen: 20, slowLen: 20
exports.SmaSignal = function (kline, fastLen, slowLen) {
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
exports.SmaCross = function (kline, fastLen, slowLen) {
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
exports.PriceAboveSma = function (kline, smaLen) {
    const { avg, lastClose } = SmaValue(kline, smaLen)
    return lastClose > avg
}

// 模仿TradingView barssince, list的length 一般100, true false list
exports.barssince = function (list, long) {
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
exports.barssince2 = function (list, long) {
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

exports.highestLowestClose = function (kline, barsLen) {
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
function highestLowestHighLow(kline, barsLen) {
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
exports.highestLowestHighLow = highestLowestHighLow
// 弃用
exports.canculateTopBottomPoints = function (kline, count) {
    const len = kline.length
    // 高点确定的半径
    const searchR = 10
    const points = []
    let highestH
    let lowestL
    let offset = 0
    for (var i = 0; i < len; i++) {
        const middleIndex = len - 1 - i
        if (middleIndex === 0) {
            break
        }
        const k = kline[middleIndex]
        let startIndex = middleIndex - searchR
        let endIndex = middleIndex + searchR
        startIndex = Math.max(startIndex, 0)  // 最少为0
        endIndex = Math.min(endIndex, len - 1)  // 最大为len-1
        let highs = []
        let lows = []
        kline.slice(startIndex, endIndex).map(k => {
            highs.push(k.high)
            lows.push(k.low)
        })
        if (k.high === Math.max.apply(null, highs)) {
            points.push({
                index: i,
                kline: k
            })
        } else if (false) {

        }
    }
}

exports.isPinBar = function (bar, up, exact) {
    const lastBar = bar
    // const body = Math.abs(lastBar.close - lastBar.open)
    const height = lastBar.high - lastBar.low
    const top_whisker_percent = (lastBar.high - Math.max(lastBar.close, lastBar.open)) / height
    const bottom_whisker_percent = (Math.min(lastBar.close, lastBar.open) - lastBar.low) / height
    // 锤子
    const up_pin = bottom_whisker_percent > 0.6//top_whisker_percent < 0.5 && bottom_whisker_percent > 0.4
    // 墓碑
    const down_pin = top_whisker_percent > 0.6//top_whisker_percent > 0.4 && bottom_whisker_percent < 0.5
    if (up) {
        return up_pin && (exact ? lastBar.close > lastBar.open : true)
    } else {
        return down_pin && (exact ? lastBar.close < lastBar.open : true)
    }
}

exports.composeBar = function (klines) {
    const firstBar = klines[0]
    const lastBar = klines[klines.length - 1]
    const { maxHigh, minLow } = highestLowestHighLow(klines, klines.length)
    return {
        timestamp: firstBar.timestamp,
        open: firstBar.open,
        close: lastBar.close,
        high: maxHigh,
        low: minLow
    }
}