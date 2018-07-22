function timeFormat(value, item) {
  return new Date(value).toLocaleString()
}
function percentFormat(value, item) {
  return +(value * 100).toFixed(5)
}

function sumEarn(trades) {
  // add fee
  var fees = 0
  var all = 0
  trades.forEach(item => {
    var fee = item.earn > 0 ? 0.0005 : -0.0005
    fees += fee
    all += (item.earn + fee)
  })
  return {all: percentFormat(all), fees: percentFormat(fees)}
}

function getWinsFails(trades) {
  let wins = 0
  let fails = 0
  let rate = 0

  trades.forEach(item => {
    if(item.win) {
      wins++
    } else {
      fails++
    }
  })

  if (wins > 0 || fails > 0) {
    rate = 100 * wins / (wins + fails)
  }
  return {wins, fails, rate}
}

var Site = {
  renderStrategy: function(data) {
    var $itemRoot = $('<div class="strategy-container"></div>')
    var $title = $('<h5 class="title"></h5>')
    var $table = $('<div class="trade-list"></div>')
    $itemRoot.append([$title, $table])
    $('#app').append($itemRoot)

    var allEarn = sumEarn(data.trades)
    var winsFails = getWinsFails(data.trades)
    var wftext = `(${winsFails.wins}/${winsFails.fails})(${winsFails.rate.toFixed(2)}) earn:(${allEarn.all} [${allEarn.fees}])`
    $title.text(`${data.options.id}  ${wftext} total: ${data.trades.length}`)

    $table.jsGrid({
      width: "1000px",
      height: '400px',
      filtering: true,
      editing: false,
      sorting: true,
      data: data.trades,
      fields: [
        {name: 'startTime', type: 'text', width: 150, itemTemplate: timeFormat},
        // {name: 'endTime', type: 'text'},
        {name: 'minute', type: 'number', width: 30},
        {name: 'long', type: 'checkbox', width: 20},
        {name: 'price', type: 'number', width: 60},
        {name: 'endPrice', type: 'number', width: 60},
        {name: 'minPrice', type: 'number', width: 60},
        {name: 'maxPrice', type: 'number', width: 60},
        {name: 'loss', type: 'number', width: 40},
        {name: 'profit', type: 'number', width: 40},
        {name: 'win', type: 'checkbox', width: 20},
        {name: 'earn', type: 'number', width: 50, itemTemplate: percentFormat},
      ]
    })
  }
}

$(function(){
  $.get('/list', function(data) {
    data.forEach(item => {
      Site.renderStrategy(item)
    })
  })
})