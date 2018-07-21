
const user = require('yargs').argv
/*
  --noProxy
*/
let argv = {
  ...user
}

console.log(argv)

module.exports = argv