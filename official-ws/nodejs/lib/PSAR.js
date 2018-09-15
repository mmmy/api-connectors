/**
 * 参考 anandanand84/technicalindicators PSAR
 * 将step 参数分解为 start, step
 */
// const IndicatorInput = require('../node_modules/technicalindicators/lib/indicator/indicator').IndicatorInput
// const IndicatorInput = require('../node_modules/technicalindicators/lib/indicator/indicator').IndicatorInput
class IndicatorInput {
}

let config = {};
function setConfig(key, value) {
    config[key] = value;
}
function getConfig(key) {
    return config[key];
}

function format(v) {
    let precision = getConfig('precision');
    if (precision) {
        return parseFloat(v.toPrecision(precision));
    }
    return v;
}

class Indicator {
  constructor(input) {
      this.format = input.format || format;
  }
  static reverseInputs(input) {
      if (input.reversedInput) {
          input.values ? input.values.reverse() : undefined;
          input.open ? input.open.reverse() : undefined;
          input.high ? input.high.reverse() : undefined;
          input.low ? input.low.reverse() : undefined;
          input.close ? input.close.reverse() : undefined;
          input.volume ? input.volume.reverse() : undefined;
          input.timestamp ? input.timestamp.reverse() : undefined;
      }
  }
  getResult() {
      return this.result;
  }
}

class PSAR extends Indicator {
  constructor(input) {
      super(input);
      let highs = input.high || [];
      let lows = input.low || [];
      var genFn = function* (start, step, max) {
          let curr, extreme, sar, furthest;
          let up = true;
          let accel = start;
          let prev = yield;
          while (true) {
              if (curr) {
                  sar = sar + accel * (extreme - sar);
                  if (up) {
                      sar = Math.min(sar, furthest.low, prev.low);
                      if (curr.high > extreme) {
                          extreme = curr.high;
                          accel = Math.min(accel + step, max);
                      }
                      
                  }
                  else {
                      sar = Math.max(sar, furthest.high, prev.high);
                      if (curr.low < extreme) {
                          extreme = curr.low;
                          accel = Math.min(accel + step, max);
                      }
                  }
                  if ((up && curr.low < sar) || (!up && curr.high > sar)) {
                      accel = start;
                      sar = extreme;
                      up = !up;
                      extreme = !up ? curr.low : curr.high;
                  }
              }
              else {
                  // Randomly setup start values? What is the trend on first tick??
                  sar = prev.low;
                  extreme = prev.high;
              }
              furthest = prev;
              if (curr)
                  prev = curr;
              curr = yield sar;
          }
      };
      this.result = [];
      this.generator = genFn(input.start, input.step, input.max);
      this.generator.next();
      lows.forEach((tick, index) => {
          var result = this.generator.next({
              high: highs[index],
              low: lows[index],
          });
          if (result.value !== undefined) {
              this.result.push(result.value);
          }
      });
  }
  ;
  nextValue(input) {
      let nextResult = this.generator.next(input);
      if (nextResult.value !== undefined)
          return nextResult.value;
  }
  ;
}
PSAR.calculate = psar;
function psar(input) {
  Indicator.reverseInputs(input);
  var result = new PSAR(input).result;
  if (input.reversedInput) {
      result.reverse();
  }
  Indicator.reverseInputs(input);
  return result;
}

exports.PSAR = PSAR