
var winston = require('winston')

const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.File({ filename: './bitemx-strategy-error.log', level: 'error' })
  ]
})

process.on('uncaughtException', function(err) {
  // debug(err)
  var info = err.message + '\n  ' + err.stack
  logger.error(info)
  // console.error('uncaughtException event99:', err);
})
