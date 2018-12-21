

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

initData('2018-12-20T05:09:54.920Z', '2018-12-20T06:09:54.920Z')
  .then(() => {
    setDrawIndex(0)
  })

function setDrawIndex(index) {
  const ob = bm.getOrderBookByIndex(index)
  drawDepthChart(ob && ob.book || [])
  if (ob) {
    let index = ob.index
    const trades = bm.getTrades(index, interval)
  }
}

// })
$(function () {
  var $range = $("#slider-range").slider({
    range: true,
    min: 0,
    max: 1000,
    values: [0, 1000],
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
      setDrawIndex(v0)
    }
  })
})
