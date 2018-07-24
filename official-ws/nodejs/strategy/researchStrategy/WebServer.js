
const express = require('express')
const path = require('path')
var bodyParser = require('body-parser')

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
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    
    app.get('/', function(req, res) {
      res.sendFile(path.join(__dirname + '/web/index.html'))
    })

    app.get('/list', (req, res) => {
      const list = this._stratetyManager.getStragetiesInfo()
      res.json(list)
    })

    app.post('/list/add', (req, res) => {
      const id = req.body.id
      if (!id) {
        res.json({
          result: false,
          msg: 'id is required'
        })
      } else {
        this._stratetyManager.addNewStrategy({ id })
        res.json(this._stratetyManager.getStratgyInfoById(id))
      }
    })

    app.post('/strategy/update_options', (req, res) => {
      const id = req.body.id
      const options = req.body.options
      this._stratetyManager.updateOptionsById(id, options)
      res.json(this._stratetyManager.getStratgyInfoById(id))
    })

    app.post('/strategy/clear_trade', (req, res) => {
      const id = req.body.id
      this._stratetyManager.clearTradesById(id)
      res.json(this._stratetyManager.getStratgyInfoById(id))
    })

    app.post('/strategy/delete', (req, res) => {
      const id = req.body.id
      const result = this._stratetyManager.deleteStrategyById(id)
      res.json({
        result: result
      })
    })

    app.listen(this._options.port)
    this._app = app
  }

  getStragetiesInfo() {
    return this._stratetyManager.getStragetiesInfo()
  }
}

module.exports = WebServer
