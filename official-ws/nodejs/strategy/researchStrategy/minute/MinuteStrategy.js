
const Strategy = require('../../Strategy')

class MinuteStrategy extends Strategy {
  constructor(options) {
    super(options)
    this.initStratety()
  }

  initStratety() {
    this.setStrategy(() => {
      let long = false
      let short = false

      return {
        long,
        short
      }
    })
  }
}

module.exports = MinuteStrategy
