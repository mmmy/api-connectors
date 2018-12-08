
const FlowDataStrategyBase = require('../FlowDataStrategyBase')

class TestFlowDataStrategy extends FlowDataStrategyBase {
  onIndicativeSettlePriceChange(delta) {
    const { amount, upThreshold, downThreshold } = this._options
    if (delta > upThreshold) {
      this.order(true, amount)
    } else if (delta < downThreshold) {
      this.order(false, amount)
    }
  }
}

module.exports = TestFlowDataStrategy
