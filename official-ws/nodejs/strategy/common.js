
function slow(func, wait) {
	var lastCall = 0
	return function() {
		var now = +new Date()
		if (now - lastCall > wait) {
			func.apply(null, arguments)
			lastCall = now
		}
	}
}

var logSlow = slow(function() { console.log.apply(null, arguments) }, 0.1 * 60 * 1000)

const logRed = console.log.bind(null, '\x1b[31m%s\x1b[0m')
const logGreen = console.log.bind(null, '\x1b[42m%s\x1b[0m')

exports.consoleRed = function() {
  logRed.apply(null, arguments)
}

exports.consoleGreen = function() {
  logGreen.apply(null, arguments)
}

exports.logSlow = logSlow
