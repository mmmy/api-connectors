
const express = require('express')
const path = require('path')

class WebServer {
  constructor(options, strategyManager) {
    this._options = {
      ...options
    }
    this._app = null
    this._stratetyManager = strategyManager
    this.init()
  }

  init() {
    const app = new express()
    app.use('/web', express.static(__dirname + '/web'))
    app.get('/', function(req, res) {
      res.sendFile(path.join(__dirname + '/web/index.html'))
    })

    app.get('/list', (req, res) => {
      const list = this._stratetyManager.getStragetiesInfo()
      res.json(list)
    })

    app.listen(this._options.port)
    this._app = app
  }

  getStragetiesInfo() {
    return this._stratetyManager.getStragetiesInfo()
  }
}

module.exports = WebServer
