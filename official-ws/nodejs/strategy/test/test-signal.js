var SmaValue = require('../signal').SmaValue

let close = [127.75,129.02,132.75,145.40,148.98,137.52,147.38,139.05,137.23,149.30,162.45,178.95,200.35,221.90,243.23,243.52,286.42]
let klines = close.map(c => ({close: c}))
//test ok
console.log(SmaValue(klines, 10))
