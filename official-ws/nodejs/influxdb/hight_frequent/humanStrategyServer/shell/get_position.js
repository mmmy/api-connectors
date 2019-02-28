// nodejs v8
const http = require('http')
const base_url="http://139.180.203.107:3004"
const path="/api/coin"

const POSITION_KEYS = ['leverage', 'currentQty', 'avgCostPrice', 'unrealisedPnl', 'unrealisedPnlPcnt', 'realisedPnl', 'realisedGrossPnl']

function checkStop(item) {
  var userData = item
  const { positions } = userData
  let msg = ''
  positions.forEach(p => {
    const isbuyPosition = p.currentQty > 0
    let totalQty = 0
    userData.orders.filter(o => o.symbol === p.symbol).forEach(o => {
      const side = isbuyPosition ? 'Sell' : 'Buy'
      if (o.ordType === 'Stop' && o.side === side) {
        totalQty += o.orderQty
      }
    })
    if (totalQty < Math.abs(p.currentQty)) {
      msg = msg + `${p.symbol}止损设置有误！`
    }
  })

  return msg
}

function logJson(json) {
  if (json.result) {
    json.items.forEach(item => {
      const { options, orders, positions } = item
      console.log('user:',options.user)
      console.log('positions')
      console.log('------------------------------------------------------------')
      positions.forEach(p => {
        let row = `${p.symbol}  `
        POSITION_KEYS.forEach(key => {
          let val = p[key]
          if (['unrealisedPnlPcnt'].indexOf(key) > -1) {
            val = (val * p.leverage * 100).toFixed(2) + '%'
          }
          row += `${key}:${val} `
        })
        console.log(row)
      })
      console.log('\n')
      console.log('orders-------------------------------')
      orders.filter(o => o.ordType !== 'Stop').forEach(o => {
        const isBuy = o.side === 'Buy'
        let row = `${o.symbol}  `
        row += `qty:${o.orderQty * (isBuy ? 1 : -1)} `
        row += `price:${o.price} `
        row += `execInst:${o.execInst} `
        row += `status:${o.ordStatus} `
        row += `releavesQty:${o.leavesQty * (isBuy ? 1 : -1)} `
        row += `${new Date(o.timestamp).toLocaleString()}`
        console.log(row)
      })
      console.log('stop orders-------------------------------')
      const stopWarnMsg = checkStop(item)
      if (stopWarnMsg) {
        console.log(stopWarnMsg)
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      }
      orders.filter(o => o.ordType === 'Stop').forEach(o => {
        const isBuy = o.side === 'Buy'
        let row = `${o.symbol}  `
        row += `qty:${o.orderQty * (isBuy ? 1 : -1)} `
        row += `stopPx:${o.stopPx} `
        row += `price:${o.price || '市价'} `
        row += `status:${o.ordStatus} `
        row += `releavesQty:${o.leavesQty * (isBuy ? 1 : -1)} `
        row += `${new Date(o.timestamp).toLocaleString()}`
        console.log(row)
      })
    })
  } else {
    console.log('result false: ', json.info)
  }
}

http.get(base_url + path, (res) => {
  var body = ''
  res.on('data', (chunk) => {
    body += chunk
  })
  res.on('end', () => {
    var json = JSON.parse(body)
    logJson(json)
  })
}).on('error', (e) => {
  console.log('got a error:', e)
})
