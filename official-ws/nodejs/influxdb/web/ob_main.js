

// $(function() {
const db = new BitmexDataDB()
const bm = new BitmexDataManager()

function initData(from, to) {
  return new Promise(resolve => {
    db.getData(from, to).then(list => {
      bm.setData(list)
      resolve()
    })
  })
}

// initData('2018-12-20T05:09:54.920Z', '2018-12-20T08:22:54.920Z')
initData('2018-12-20T05:09:54.920Z', '2018-12-20T06:25:25.920Z')
  .then(() => {
    $("#slider-range").slider({
      max: bm._orderbookHistory.length - 1
    })
    setDrawIndex(0)
  })

function setDrawIndex(index) {
  const ob = bm.getOrderBookByIndex(index)
  drawDepthChart(ob && ob.book || [])

  if (ob) {
    let index = ob.index
    const trades = bm.getTrades(index, 5)
    if (trades.length > 0) {
      const time = trades[trades.length - 1][0].timestamp
      console.log(time)
    }
    const orderbookUpdates = bm.getOrderBookActions(index, 4)
    console.log(orderbookUpdates)
    updateOrderbookTable(orderbookUpdates)
  }
}

// })
$(function () {
  var $range = $("#slider-range").slider({
    range: true,
    min: 0,
    max: 1000,
    values: [0, 10000],
    slide: function (event, ui) {
      var v0 = ui.values[0],
        v1 = ui.values[1]
      // if (v0 !== CONFIG.s0) {
      //   CONFIG.s0 = v0
      //   // CONFIG.s1 = v0 + CONFIG.space
      // } else if (v1 !== CONFIG.s1) {
      //   CONFIG.s1 = v1
      //   // CONFIG.s0 = v1 - CONFIG.space
      // }
      // if (CONFIG.s0 !== v0 || CONFIG.s1 !== v1) {
      //   $range.slider("values", [CONFIG.s0, CONFIG.s1])
      // }
      // _saveConfig()
      $("#index").val(v0);
      // console.log(v0)
      setDrawIndex(v0)
    }
  })

  function stepRange(next) {
    var $range = $("#slider-range")
    var cur = $range.slider('values', 0)
    var nextV = next ? cur + 1 : (cur - 1)
    $range.slider('values', 0, nextV)
    setDrawIndex(nextV)
  }

  $('#next').on('click', function() {
    stepRange(true)
  })
  
  $('#pre').on('click', function() {
    stepRange(false)
  })
  
})

function updateOrderbookTable(updates) {
  var $tableBody = $('#orderbook-actions tbody')
  const trs = updates.map(u => {
    return `<tr><td>${u.time}</td><td>${u.action}</td><td>${JSON.stringify(u.data)}</td></tr>`
  }).join('')
  $tableBody.empty().append(trs)
}
