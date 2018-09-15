
const PSAR = require('../lib/PSAR').PSAR

let high = [82.15,81.89,83.03,83.30,83.85,83.90,83.33,84.30,84.84,85.00,75.90,76.58,76.98,78.00,70.87];
let low = [81.29,80.64,81.31,82.65,83.07,83.11,82.49,82.30,84.15,84.11,74.03,75.39,75.76,77.17,70.01];

let start = 0.017
let step = 0.034;
let max = 0.13;

let input = { high, low, start, step, max };
let psar = new PSAR(input)

console.log(psar.getResult())
