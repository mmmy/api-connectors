function showLoading() {
  $('#loader').removeClass('disabled')
}

function hideLoading() {
  $('#loader').addClass('disabled')
}

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
    } else if (!item.long && item.maxPrice <= item.price) {
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
  addNew: function(id) {
    $.post({
      url: '/list/add',
      data: { id },
      success: function(data) {
        console.log(data)
      },
      dataType: 'json'
    })
  },

  deleteById: function(id) {
    if (confirm(`delete ${id}?`)) {
      $.post('/strategy/delete', { id }, function(data) {
        console.log(data)
      })
    }
  },

  updateOption: function(id, key, value, callback) {
    $.post('/strategy/update_option', { id, key, value }, callback)
  },

  clearTradesById: function(id) {
    if (confirm(`clear ${id} trades ?`)) {
      $.post('/strategy/clear_trade', { id }, function(data) {
        console.log(data)
      })
    }
  },

  renderStatistic: function(list) {

  },

  renderStrategy: function(data, index) {
    var $itemRoot = $('<div class="strategy-container"></div>')
    var $title = $('<h5 class="title"></h5>')
    var $statistic = $('<p class="statistic"></p>')
    var $table = $('<div class="trade-list"></div>')
    $itemRoot.append([$title, $statistic, $table])
    $('#app').append($itemRoot)

    var allEarn = sumEarn(data.trades)
    var winsFails = getWinsFails(data.trades)
    $title.append(`<span>${index + 1}. ${data.options.id} total: ${data.trades.length}</span>`)
    $title.append($('<button>clear</button>').on('click', function() { Site.clearTradesById(data.options.id) }))
    $title.append($('<button>delete</button>').on('click', function() { Site.deleteById(data.options.id) }))
    $title.append($('<button>options</button>').on('click', function() {  }))

    var $longInput = $('<input type="checkbox"><span>long</span>').on('click', function() {
      showLoading()
      Site.updateOption(data.options.id, 'disableLong', $longInput[0].checked, function(data) {
        $longInput[0].checked = !data.data
        hideLoading()
      })
    })
    var $shortInput = $('<input type="checkbox"><span>short</span>').on('click', function() {
      showLoading()
      Site.updateOption(data.options.id, 'disableShort', $shortInput[0].checked, function(data) {
        $shortInput[0].checked = !data.data
        hideLoading()
      })
    })
    if (!data.options.disableLong) {
      $longInput[0].checked = true
    }
    if (!data.options.disableShort) {
      $shortInput[0].checked = true
    }

    $title.append($longInput)
    $title.append($shortInput)

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