const Telegraf = require('telegraf')
// const bot = new Telegraf(process.env.BOT_TOKEN)

const isProduction = process.env.NODE_ENV === 'production'

var SocksProxyAgent = require('socks-proxy-agent');

var agent = isProduction ? null : new SocksProxyAgent('socks://127.0.0.1:1080');
const bot = new Telegraf("753812904:AAFp6-Upva0MOo-T9QgiOc7Rs3qNOpJ7wRw", {
  telegram: {
    agent: agent
  }
})

// bot.on('text', (ctx) => {
//   console.log(ctx.chat.id)
//   ctx.reply('Hello World')
// })

let orderBookChartIds = []

bot.command('orderbook_on', (ctx) => {
  const id = ctx.chat.id
  if (orderBookChartIds.indexOf(id) === -1) {
    orderBookChartIds.push(id)
    ctx.reply('成功订阅orderbook信号 💹')
  } else {
    ctx.reply('已经订阅过orderbook信号 🚼')
  }
})

bot.command('orderbook_off', (ctx) => {
  const id = ctx.chat.id 
  const index = orderBookChartIds.indexOf(id)
  if (index === -1) {
    ctx.reply('未订阅过orderbook信号 👐')  
  } else {
    orderBookChartIds.splice(index, 1)
    ctx.reply('成功退订orderbook信号 🌚')  
  }
})

bot.launch()

module.exports = {
  sendMessageToGroup: (msg) => {
    orderBookChartIds.forEach(id => {
      bot.telegram.sendMessage(id, msg).catch(e => {
        console.log(`send message to ${id} error`, e)
      })
    })
  }
}