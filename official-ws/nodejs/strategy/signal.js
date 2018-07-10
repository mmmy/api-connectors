var technicalindicators = require('technicalindicators')
var RSI = technicalindicators.RSI
var BB = technicalindicators.BollingerBands
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

exports.BollingerBandsSignal = function(kline) {
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
exports.RSI = function(kline) {
  const { T, O, H, L, C, V } = parseKline(kline)
  var result = RSI.calculate({ values: C, period: 14 })
  const lastV = result.slice(-1)[0]
  return lastV
  // console.log(result.slice(result.length - 10))
}