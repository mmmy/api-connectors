
function timeFormat(value, item) {
  return new Date(value).toLocaleString()
}
function percentFormat(value, item) {
  return +(value * 100).toFixed(5)
}

function isWinNotEffecient(item) {
  if (item.win) {
    if (item.long && item.minPrice >= item.price) {
      return true
    } else if (item.short && item.maxPrice <= item.price) {
      return true
    }
  }
}

function sumEarn(trades) {
  // add fee
  var maxFees = 0
  var maxAll = 0
  var all = 0
  var fees = 0
  trades.forEach(item => {
    var fee = item.earn > 0 ? 0.0005 : -0.0005
    maxFees += fee
    maxAll += (item.earn + fee)
    if (!isWinNotEffecient(item)) {
      all += (item.earn + fee)
      fees += fee
    }
  })
  return {maxAll: percentFormat(maxAll), maxFees: percentFormat(maxFees), all: percentFormat(all), fees: percentFormat(fees)}
}

function getWinsFails(trades) {
  let maxWins = 0
  let wins = 0
  let fails = 0
  let rate = 0

  trades.forEach(item => {
    if(item.win) {
      maxWins++
      if (!isWinNotEffecient(item)) {
        wins++
      }
    } else {
      fails++
    }
  })

  if (wins > 0 || fails > 0) {
    rate = 100 * wins / (wins + fails)
  }
  return {maxWins, wins, fails, rate}
}

var Site = {
  renderStatistic: function(list) {

  },
  renderStrategy: function(data) {
    var $itemRoot = $('<div class="strategy-container"></div>')
    var $title = $('<h5 class="title"></h5>')
    var $statistic = $('<p class="statistic"></p>')
    var $table = $('<div class="trade-list"></div>')
    $itemRoot.append([$title, $statistic, $table])
    $('#app').append($itemRoot)

    var allEarn = sumEarn(data.trades)
    var winsFails = getWinsFails(data.trades)
    $title.text(`${data.options.id} total: ${data.trades.length}`)

    var wftext = `[${winsFails.wins}(${winsFails.maxWins})/${winsFails.fails})(${winsFails.rate.toFixed(2)}%] 
                  earn:(${allEarn.all}% max:${allEarn.maxAll}% [${allEarn.fees}% fee max:${allEarn.maxFees}%])`

    $statistic.append($('<div></div>').text(wftext))

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
      ],
      rowClass: function(item, itemIndex) {
        var isNotEffecient = isWinNotEffecient(item)
        return isNotEffecient ? 'warn' : ''
      },
    })
  }
}