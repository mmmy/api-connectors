
function randomLinesData() {
  var data = []
  var dataCount = 2
  var len = 100
  var interval = 200
  var startTime = +new Date() - len * interval
  for (var i=0; i<len; i++) {
    var item = {
      k: startTime + i * interval,
      v: []
    }
    for(var j=0; j<dataCount; j++) {
      item.v.push(Math.random() * (j*10 + 10) + 100)
    }
    data.push(item)
  }
  return data
}

function randomAppendData(cb) {
  setInterval(() => {
    var item = {
      k: new Date(),
      v: [Math.random() * 10 + 100, Math.random() * 20 + 100]
    }
    cb && cb(item)
  }, 200)
}
