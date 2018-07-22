

const logRed = console.log.bind(null, '\x1b[31m%s\x1b[0m')
const logGreen = console.log.bind(null, '\x1b[42m%s\x1b[0m')

exports.consoleRed = function() {
  logRed.apply(null, arguments)
}

exports.consoleGreen = function() {
  logGreen.apply(null, arguments)
}
