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

bot.launch()

module.exports = {
  sendMessageToGroup: (msg) => {
    bot.telegram.sendMessage("-320826333", msg).catch(e => {
      console.log('send message to -320826333 error', e)
    })
  }
}