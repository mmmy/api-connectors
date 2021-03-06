
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
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    
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
      if (typeof options !== 'object') {
        res.json({
          result: false,
          msg: 'options 必须是个object'
        })
        return
      }
      this._stratetyManager.updateOptionsById(id, options)
      res.json(this._stratetyManager.getStratgyInfoById(id))
    })

    app.post('/strategy/update_option', (req, res) => {
      console.log(req.body)
      const id = req.body.id
      const val = this._stratetyManager.updateOptionById(id, req.body)
      res.json({
        result: true,
        data: val
      })
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

    app.get('/candles/:id/:timeframe', (req, res) => {
      const id = req.params.id
      const timeframe = req.params.timeframe
      if (!id) {
        res.json({
          result: false,
          msg: '/candles/:id id必填'
        })
      } else {
        const candles = this._stratetyManager.getCandlesById(id, timeframe)
        return res.json({
          result: true,
          data: candles
        })
      }

    })

    app.listen(this._options.port)
    this._app = app
  }

  getStragetiesInfo() {
    return this._stratetyManager.getStragetiesInfo()
  }
}

module.exports = WebServer
